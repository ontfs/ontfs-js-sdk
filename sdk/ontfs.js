const { hexstr2str, str2hexstr } = require("ontology-ts-sdk").utils;
const { addressFromPubKeyHex } = require('../utils/address')
const { Address } = require("ontology-ts-sdk").Crypto; // todo
const { client } = require("@ont-dev/ontology-dapi");

class Mutex {
	constructor() {
		this._locking = Promise.resolve();
		this._locks = 0;
	}
	isLocked() {
		return this._locks > 0;
	}
	lock() {
		this._locks += 1;
		let unlockNext;
		let willLock = new Promise(resolve => unlockNext = () => {
			this._locks -= 1;
			resolve();
		});
		let willUnlock = this._locking.then(() => unlockNext);
		this._locking = this._locking.then(() => willLock);
		return willUnlock;
	}
}

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
		this.mutex = new Mutex()
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
			newNode.nodeAddr = addressFromPubKeyHex(str2hexstr(node.nodeAddr));
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
		spaceInfo.spaceOwner = addressFromPubKeyHex(str2hexstr(spaceInfo.spaceOwner))
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
		return client.api.fs.storeFiles({
			filesInfo: newFiles,
			gasPrice: this.gasPrice,
			gasLimit: this.gasLimit
		});
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
		fileInfo.fileOwner = addressFromPubKeyHex(str2hexstr(fileInfo.fileOwner));
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
		return client.api.fs.renewFile({
			filesRenew: renews,
			gasPrice: this.gasPrice,
			gasLimit: this.gasLimit
		});
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
			item.fileHash = strhexstr(i2tem.fileHash);
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
		return client.api.fs.deleteFiles({
			fileHashes: newFileHashes,
			gasPrice: this.gasPrice,
			gasLimit: this.gasLimit
		});
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
		readPledge.downloader = addressFromPubKeyHex(str2hexstr(readPledge.downloader));
		let newReadPlans = []
		for (let plan of readPledge.readPlans) {
			let newPlan = plan;
			newPlan.nodeAddr = addressFromPubKeyHex(str2hexstr(plan.nodeAddr));
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
			newRecord.fileHash = hexstr2str(newRecord.fileHash);
			newRecord.fileOwner = addressFromPubKeyHex(str2hexstr(newRecord.fileOwner));
			newPdpRecords.pdpRecords.push(newRecord);
		}
		console.log(newPdpRecords)
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
			newChallenge.fileOwner = addressFromPubKeyHex(str2hexstr(newChallenge.fileOwner));
			newChallenge.nodeAddr = addressFromPubKeyHex(str2hexstr(newChallenge.nodeAddr));
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
		let unlock = await this.mutex.lock()
		const result = await client.api.fs.genFileReadSettleSlice({
			fileHash,
			payTo: peerWalletAddr,
			sliceId,
			pledgeHeight: blockHeight
		});
		unlock()
		return result
	}
}

module.exports = {
	OntFs
};
