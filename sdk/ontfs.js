const { hexstr2str, reverseHex } = require("ontology-ts-sdk").utils
const { RpcClient } = require("ontology-ts-sdk")
const OntfsContractTxBuilder = require("ontology-ts-sdk").OntfsContractTxBuilder
const {
    FsNodeInfoList,
    SpaceInfo,
    FileInfo,
    FileHashList,
    FsResult,
    ReadPlan,
    ReadPledge,
    PdpRecordList,
    ChallengeList,
} = require("ontology-ts-sdk/fs")
const { sleep } = require("../utils")
const common = require("../common")


class OntFs {

    constructor(_account, _pwd, _chainRpcAddr, _gasPrice = 500, _gasLimit = 20000) {
        this.account = _account
        this.walletAddr = _account.address
        this.password = _pwd
        this.chainRpcAddr = _chainRpcAddr
        this.gasPrice = _gasPrice
        this.gasLimit = _gasLimit
        this.rpcClient = new RpcClient(_chainRpcAddr)
    }

    async preInvokeNativeContract(tx) {
        const rawTx = tx.serialize()
        const ret = await this.rpcClient.sendRawTransaction(rawTx, true)
        console.log('ret', ret)
        const result = FsResult.deserializeHex(ret.result.Result)
        return result
    }

    async invokeNativeContract(tx) {
        const signedTx = this.account.signTransaction(this.password, tx)
        const rawTx = signedTx.serialize()
        const ret = await this.rpcClient.sendRawTransaction(rawTx, false)
        console.log('ret', ret)
        if (!ret || !ret.result) {
            throw new Error("result is invalid")
        }
        if (ret && ret.error == 0) {
            try {
                await this.waitForTxConfirmed(common.WAIT_FOR_TX_COMFIRME_TIMEOUT, ret.result)
            } catch (e) {
                throw e
            }
            return ret.result
        }
        throw new Error(ret.result)
    }


    async waitForTxConfirmed(timeout, txHashStr) {
        if (!timeout) {
            timeout = 1
        }
        for (let i = 0; i < timeout; i++) {
            await sleep(1000)
            let { result } = await this.rpcClient.getBlockHeightByTxHash(txHashStr)
            if (result > 0) {
                return true
            }
        }
        throw new Error(`timeout after ${timeout} (s)`)
    }

    async getNodeInfoList(limit) {
        const tx = OntfsContractTxBuilder.buildGetNodeInfoListTx(limit)
        const result = await this.preInvokeNativeContract(tx)
        let nodeInfoList = FsNodeInfoList.deserializeHex(result.data)
        // console.log("nodeInfoList", nodeInfoList)
        return nodeInfoList
    }

    async createSpace(volume, copyNum, pdpInterval, timeExpired) {
        const tx = OntfsContractTxBuilder.buildCreateSpaceTx(this.account.address, volume, copyNum, pdpInterval, timeExpired,
            this.gasPrice, this.gasLimit, this.account.address)
        const result = await this.invokeNativeContract(tx)
        // console.log('result ', result)
        return result
    }

    async getSpaceInfo() {
        const tx = OntfsContractTxBuilder.buildGetSpaceInfoTx(this.account.address)
        const result = await this.preInvokeNativeContract(tx)
        if (!result || !result.success) {
            throw new Error(hexstr2str(result.data))
        }
        let spaceInfo = SpaceInfo.deserializeHex(result.data)
        return spaceInfo
    }

    async deleteSpace() {
        const tx = OntfsContractTxBuilder.buildDeleteSpaceTx(this.account.address, this.gasPrice, this.gasLimit,
            this.account.address)
        const result = await this.invokeNativeContract(tx)
        return result
    }
    async updateSpace(volume, timeExpired) {
        const tx = OntfsContractTxBuilder.buildUpdateSpaceTx(this.account.address, this.account.address, volume, timeExpired,
            this.gasPrice, this.gasLimit, this.account.address)
        const result = await this.invokeNativeContract(tx)
        return result
    }

    async storeFiles(files) {
        const tx = OntfsContractTxBuilder.buildStoreFilesTx(files, this.account.address, this.gasPrice, this.gasLimit,
            this.account.address)
        const result = await this.invokeNativeContract(tx)
        return result
    }

    async getFileInfo(fileHash) {
        const tx = OntfsContractTxBuilder.buildGetFileInfoTx(fileHash)
        const result = await this.preInvokeNativeContract(tx)
        if (!result || !result.success) {
            throw new Error(hexstr2str(result.data))
        }
        const fileInfo = FileInfo.deserializeHex(result.data)
        return fileInfo
    }

    async getFileList() {
        const height = await this.rpcClient.getBlockHeight()
        const ret = await this.rpcClient.getBlockJson(height)
        if (!ret || !ret.result) {
            throw new Error(`get block of ${height} failed`)
        }
        const blockHash = ret.result.Hash
        const privateKey = this.account.exportPrivateKey(this.password)
        const tx = OntfsContractTxBuilder.buildGetFileListTx(height, reverseHex(blockHash), privateKey)
        const result = await this.preInvokeNativeContract(tx)
        if (!result || !result.success) {
            throw new Error(hexstr2str(result.data))
        }
        const list = FileHashList.deserializeHex(result.data)
        return list
    }

    async renewFile(renews) {
        const tx = OntfsContractTxBuilder.buildRenewFilesTx(renews, this.account.address, this.account.address,
            this.gasPrice, this.gasLimit, this.account.address)
        const result = await this.invokeNativeContract(tx)
        return result
    }

    async transferFiles(renews) {
        const tx = OntfsContractTxBuilder.buildTransferFilesTx(renews, this.account.address, this.gasPrice,
            this.gasLimit, this.account.address)
        const result = await this.invokeNativeContract(tx)
        return result
    }

    async deleteFiles(fileHashes) {
        const tx = OntfsContractTxBuilder.buildDeleteFilesTx(fileHashes, this.gasPrice,
            this.gasLimit, this.account.address)
        const result = await this.invokeNativeContract(tx)
        return result
    }

    async fileReadPledge(fileHash, plans) {
        let readPlan = []
        for (let p of plans) {
            readPlan.push(new ReadPlan(new Address(p.nodeAddr), p.maxReadBlockNum, p.haveReadBlockNum))
        }
        const tx = OntfsContractTxBuilder.buildFileReadPledgeTx(fileHash, readPlan, this.account.address,
            this.gasPrice, this.gasLimit, this.account.address)
        const result = await this.invokeNativeContract(tx)
        return result
    }

    async getFileReadPledge(fileHash, walletAddr) {
        const tx = OntfsContractTxBuilder.buildGetFileReadPledgeTx(fileHash, walletAddr)
        const result = await this.preInvokeNativeContract(tx)
        if (!result || !result.success) {
            throw new Error(hexstr2str(result.data))
        }
        const readPledge = ReadPledge.deserializeHex(result.data)
        return readPledge
    }

    async cancelFileRead(fileHash) {
        const tx = OntfsContractTxBuilder.buildCancelFileReadTx(fileHash, this.account.address,
            this.gasPrice, this.gasLimit, this.account.address)
        const result = await this.invokeNativeContract(tx)
        return result
    }

    async getFilePdpRecordList(fileHash) {
        const tx = OntfsContractTxBuilder.buildGetFilePdpRecordListTx(fileHash)
        const result = await this.preInvokeNativeContract(tx)
        if (!result || !result.success) {
            throw new Error(hexstr2str(result.data))
        }
        const list = PdpRecordList.deserializeHex(result.data)
        return list
    }

    async challenge(fileHash, nodeAddr) {
        const tx = OntfsContractTxBuilder.buildChallengeTx(fileHash, this.account.address, new Address(nodeAddr),
            this.gasPrice, this.gasLimit, this.account.address)
        const result = await this.invokeNativeContract(tx)
        console.log("result", result)
        return result
    }
    async judge(fileHash, nodeAddr) {
        const tx = OntfsContractTxBuilder.buildJudgeTx(fileHash, this.account.address, new Address(nodeAddr),
            this.gasPrice, this.gasLimit, this.account.address)
        const result = await this.invokeNativeContract(tx)
        return result
    }
    async getFileChallengeList(fileHash) {
        const tx = OntfsContractTxBuilder.buildGetFileChallengeListTx(fileHash, this.account.address)
        const result = await this.preInvokeNativeContract(tx)
        if (!result || !result.success) {
            throw new Error(hexstr2str(result.data))
        }
        const list = ChallengeList.deserializeHex(result.data)
        return list
    }
}


module.exports = {
    OntFs
}