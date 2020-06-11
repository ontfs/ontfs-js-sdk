const { hexstr2str, str2hexstr, StringReader } = require("ontology-ts-sdk").utils;
const { addressFromPubKeyHex } = require('../utils/address')
const { Address } = require("ontology-ts-sdk").Crypto; // todo
const { client } = require("@ont-dev/ontology-dapi");
const Base64 = require("js-base64").Base64;
const utils = require("../utils")
const { ONTFS_CONTRACT_ADDRESS } = require("../common")

class OntFs {
	/**
	 *Creates an instance of OntFs.
	 * @param {number} [_gasPrice=500] gas price for smart contract transaction
	 * @param {number} [_gasLimit=20000] gas limit for smart contract transaction
	 * @memberof OntFs
	 */
	constructor(_gasPrice = 500, _gasLimit = 20000) {
		client.registerClient({});
		this.gasPrice = _gasPrice;
		this.gasLimit = _gasLimit;
		this.mutex = new utils.Mutex()
	}

	async waitForGenerateBlock(timeout, blockCount) {
		if (!blockCount) {
			return;
		}
		let blockHeight = await client.api.network.getBlockHeight();
		if (!timeout) {
			timeout = 1;
		}
		for (let i = 0; i < timeout; i++) {
			await utils.sleep(1000);
			let curBlockHeigh = await client.api.network.getBlockHeight();
			if (curBlockHeigh - blockHeight >= blockCount) {
				return true;
			}
		}
		return false
	}

	/**
	 * get account
	 * @returns {Address}
	 * @memberof OntFs
	 */
	async getAccount() {
		return client.api.asset.getAccount()
	}

	/**
	 * get storage node info list
	 *
	 *
	 * @returns {FsNodeInfoList}
	 * @memberof OntFs
	 */
	async getNodeInfoList(limit = 1) {
		const nodes = await client.api.fs.getNodeInfoList({ count: limit });
		let newNodes = {
			nodesInfo: []
		};
		for (let node of nodes.nodesInfo) {
			let newNode = node;
			newNode.nodeAddr = new Address(node.nodeAddr);
			newNodes.nodesInfo.push(newNode);
		}
		return newNodes
	}

	/**
	 * create a storage space
	 *
	 * @param {number} volume: volume size in KB
	 * @param {number} copyNum: copy number
	 * @param {number} timeExpired: space expired timestamp, second
	 * @returns
	 * @memberof OntFs
	 */
	async createSpace(volume, copyNumber, timeExpired) {
		const nodes = await client.api.fs.getNodeInfoList({ count: 0 });
		if (nodes && nodes.nodesInfo && nodes.nodesInfo.length < copyNumber) {
			throw new Error(`node count ${nodes.nodesInfo.length} less than copy number ${copyNumber}`)
		}

		return client.api.fs.space.create({
			volume,
			copyNumber,
			timeStart: new Date(),
			timeExpired: new Date(timeExpired),
			gasPrice: this.gasPrice,
			gasLimit: this.gasLimit
		});
	}

	/**
	 *
	 * get space info for user
	 * @returns {SpaceInfo}
	 * @memberof OntFs
	 */
	async getSpaceInfo() {
		const spaceInfo = await client.api.fs.space.get();
		spaceInfo.spaceOwner = new Address(spaceInfo.spaceOwner);
		return spaceInfo
	}

	/**
	 * delete current user space
	 *
	 * @returns {string} tx hash
	 * @memberof OntFs
	 */
	async deleteSpace() {
		return client.api.fs.space.delete({
			gasPrice: this.gasPrice,
			gasLimit: this.gasLimit
		});
	}

	/**
	 * update a exist space
	 *
	 * @param {number} volume volume size in KB
	 * @param {number} timeExpired space expired timestamp, second
	 * @returns {string} tx hash
	 * @memberof OntFs
	 */
	async updateSpace(volume, timeExpired) {
		return client.api.fs.space.update({
			volume,
			timeExpired: new Date(timeExpired),
			gasPrice: this.gasPrice,
			gasLimit: this.gasLimit
		});
	}

	/**
	 * store a file
	 *
	 * @param {Array} files, array of file info object
	 * @returns  {string} tx hash
	 * @memberof OntFs
	 */
	async storeFiles(files) {
		let newFiles = [];
		for (let file of files) {
			let newFile = file;
			newFile.fileHash = client.api.utils.strToHex(file.fileHash);
			newFile.fileDesc = client.api.utils.strToHex(file.fileDesc);
			newFile.pdpParam = file.pdpParam;
			newFile.timeStart = new Date();
			newFile.timeExpired = new Date(file.timeExpired * 1000);
			newFiles.push(newFile);
		}
		const tx = await client.api.fs.storeFiles({
			filesInfo: newFiles,
			gasPrice: this.gasPrice,
			gasLimit: this.gasLimit
		});
		await this.getFsSmartCodeEvent(tx.transaction)
		return tx
	}

	async getFsSmartCodeEvent(transaction) {
		const events = await client.api.network.getSmartCodeEvent({ value: transaction })
		console.log("events:", events);
		if (
			events &&
			events.Notify &&
			events.Notify.length
		) {
			for (let n of events.Notify) {
				if (
					n.ContractAddress == ONTFS_CONTRACT_ADDRESS && n.States != 'AA=='
				) {

					const str = utils.base64str2hex(n.States);
					let sr = new StringReader(str)
					let count = utils.decodeVarUint(sr)
					let result = {}
					for (let i = 0; i < count; i++) {
						let hash = utils.hex2utf8str(utils.decodeVarBytes(sr))
						let error = utils.hex2utf8str(utils.decodeVarBytes(sr))
						result[hash] = error
					}
					console.log("tx " + transaction + "state failed, " + JSON.stringify(result))
					throw new Error(JSON.stringify(result))
				}
			}
		}
	}

	/**
	 * get file info of hash
	 *
	 * @param {string} fileHash
	 * @returns {FileInfo}
	 * @memberof OntFs
	 */
	async getFileInfo(fileHash) {
		const fileInfo = await client.api.fs.getFileInfo({ fileHash });
		fileInfo.fileHash = client.api.utils.hexToStr(fileInfo.fileHash);
		fileInfo.fileDesc = client.api.utils.hexToStr(fileInfo.fileDesc);
		fileInfo.pdpParam = client.api.utils.hexToStr(fileInfo.pdpParam);
		fileInfo.fileOwner = new Address(fileInfo.fileOwner);
		return fileInfo;
	}

	/**
	 * get stored file list
	 *
	 * @returns {FileHashList}
	 * @memberof OntFs
	 */
	async getFileList() {
		return client.api.fs.getFileList();
	}

	/**
	 * renew a exist file
	 *
	 * @param {Array} renews: array of renew object
	 * @returns  {string} tx hash
	 * @memberof OntFs
	 */
	async renewFile(renews) {
		for (let item of renews) {
			item.fileHash = client.api.utils.strToHex(item.fileHash);
		}
		const tx = await client.api.fs.renewFiles({
			filesRenew: renews,
			gasPrice: this.gasPrice,
			gasLimit: this.gasLimit
		});
		await this.getFsSmartCodeEvent(tx.transaction)
		return tx
	}

	/**
	 * change file owner
	 *
	 * @param {Array} renews: array of renew object
	 * @returns {string} tx hash
	 * @memberof OntFs
	 */
	async transferFiles(renews) {
		for (let item of renews) {
			item.fileHash = str2hexstr(item.fileHash);
		}
		return client.api.fs.transferFiles({
			fileTransfers: renews,
			gasPrice: this.gasPrice,
			gasLimit: this.gasLimit
		});
	}

	/**
	 * delete files
	 *
	 * @param {Array} fileHashes, array of file hashes
	 * @returns {string} tx hash
	 * @memberof OntFs
	 */
	async deleteFiles(fileHashes) {
		let newFileHashes = [];
		for (let item of fileHashes) {
			newFileHashes.push(client.api.utils.strToHex(item));
		}
		const tx = await client.api.fs.deleteFiles({
			fileHashes: newFileHashes,
			gasPrice: this.gasPrice,
			gasLimit: this.gasLimit
		});
		await this.getFsSmartCodeEvent(tx.transaction)
		return tx
	}

	/**
	 * make a file read pledge for download
	 *
	 * @param {string} fileHash: file hash to download
	 * @param {Array} plans: plans of download detail
	 * @returns {string} tx hash
	 * @memberof OntFs
	 */
	async fileReadPledge(fileHash, plans) {
		return client.api.fs.fileReadPledge({
			fileHash: fileHash,
			readPlans: plans,
			gasPrice: this.gasPrice,
			gasLimit: this.gasLimit
		});
	}

	/**
	 * get a file read pledge
	 *
	 * @param {string} fileHash  file hash
	 * @param {Address} walletAddr read pledge owner wallet addr
	 * @returns
	 * @memberof OntFs
	 */
	async getFileReadPledge(fileHash, walletAddr) {
		const readPledge = await client.api.fs.getFileReadPledge({
			fileHash,
			downloader: walletAddr
		});
		readPledge.fileHash = hexstr2str(readPledge.fileHash);
		readPledge.downloader = new Address(readPledge.downloader);
		let newReadPlans = []
		for (let plan of readPledge.readPlans) {
			let newPlan = plan;
			newPlan.nodeAddr = new Address(plan.nodeAddr);
			newReadPlans.push(newPlan);
		}
		readPledge.readPlans = newReadPlans
		return readPledge
	}

	/**
	 * cancel the file read pledge
	 *
	 * @param {string} fileHash
	 * @returns {string} tx hash
	 * @memberof OntFs
	 */
	async cancelFileRead(fileHash) {
		return client.api.fs.cancelFileRead({
			fileHash: fileHash,
			gasPrice: this.gasPrice,
			gasLimit: this.gasLimit
		});
	}

	/**
	 * get file pdp record list
	 *
	 * @param {string} fileHash
	 * @returns {PdpRecordList}
	 * @memberof OntFs
	 */
	async getFilePdpRecordList(fileHash) {
		const pdpRecords = await client.api.fs.getFilePdpRecordList({ fileHash });
		let newPdpRecords = {
			pdpRecords: []
		};
		for (let record of pdpRecords.pdpRecords) {
			let newRecord = record;
			newRecord.nodeAddr = new Address(newRecord.nodeAddr);
			newRecord.fileHash = hexstr2str(newRecord.fileHash);
			newRecord.fileOwner = new Address(newRecord.fileOwner);
			newPdpRecords.pdpRecords.push(newRecord);
		}
		return newPdpRecords
	}

	/**
	 * challenge a file with a specific node
	 *
	 * @param {string} fileHash
	 * @param {string} nodeAddr node wallet base58 string
	 * @returns {string} tx hash
	 * @memberof OntFs
	 */
	async challenge(fileHash, nodeAddr) {
		return client.api.fs.challenge({
			fileHash,
			nodeAddr,
			gasPrice: this.gasPrice,
			gasLimit: this.gasLimit
		});
	}

	/**
	 * judge a file with a specific node
	 *
	 * @param {string} fileHash
	 * @param {string} nodeAddr node wallet base58 string
	 * @returns {string} tx hash
	 * @memberof OntFs
	 */
	async judge(fileHash, nodeAddr) {
		return client.api.fs.judge({
			fileHash,
			nodeAddr,
			gasPrice: this.gasPrice,
			gasLimit: this.gasLimit
		});
	}

	/**
	 * get file challenge list
	 *
	 * @param {string} fileHash
	 * @returns {ChallengeList}
	 * @memberof OntFs
	 */
	async getFileChallengeList(fileHash) {
		const challengeList = await client.api.fs.getFileChallengeList({ fileHash });
		let newChallengeList = {
			challenges: []
		}
		for (let challenge of challengeList.challenges) {
			let newChallenge = challenge
			newChallenge.fileHash = hexstr2str(newChallenge.fileHash);
			newChallenge.fileOwner = new Address(newChallenge.fileOwner);
			newChallenge.nodeAddr = new Address(newChallenge.nodeAddr);
			newChallengeList.challenges.push(newChallenge)
		}
		return newChallengeList
	}

	/**
	 * get node info
	 *
	 * @param {string} walletAddr node wallet base58 string
	 * @returns {FsNodeInfo}
	 * @memberof OntFs
	 */
	async getNodeInfo(walletAddr) {
		return client.api.fs.getNodeInfo({
			nodeWallet: walletAddr
		});
	}

	/**
	 * verify file read settle slice
	 *
	 * @param {Object} settleSlice
	 * @returns {boolean}
	 * @memberof OntFs
	 */
	async verifyFileReadSettleSlice(settleSlice) {
		return client.api.fs.verifyFileReadSettleSlice({
			settleSlice
		});
	}

	/**
	 * generate a file read settle slice
	 *
	 * @param {string} fileHash file hash
	 * @param {string} peerWalletAddr node wallet base58 string
	 * @param {number} sliceId slice id
	 * @param {number} blockHeight block height
	 * @returns
	 * @memberof OntFs
	 */
	async genFileReadSettleSlice(fileHash, peerWalletAddr, sliceId, blockHeight) {
		console.log('genFileReadSettleSlice', fileHash, peerWalletAddr, sliceId)
		let unlock = await this.mutex.lock()
		try {
			const result = await client.api.fs.genFileReadSettleSlice({
				fileHash,
				payTo: peerWalletAddr,
				sliceId,
				pledgeHeight: blockHeight
			});
			// await this.waitForGenerateBlock(60, 1)
			console.log('genFileReadSettleSlice done', fileHash, peerWalletAddr, sliceId)
			unlock()
			return result
		} catch (e) {
			console.log("generate file read settle", e.message ? e.message : e.toString())
			unlock()
			throw e
		}
	}
}

module.exports = {
	OntFs
};
