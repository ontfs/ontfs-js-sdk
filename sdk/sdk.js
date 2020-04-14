
const pdp = {
    newPdp() {
        return null
    }
}

const { RpcClient } = require("ontology-ts-sdk")
const config = require("../config")
const fs = require("../fs")
const common = require("../common")
const { sleep } = require("../utils")
const OntFs = require("./ontfs").OntFs

var Version
var GlobalSdk

class Sdk {
    constructor(
        _account,
        _sdkConfig,
        _chain,
        _ontFs,
        _fs,
        _stop,
        _pdpServer
    ) {
        this.account = _account
        this.sdkConfig = _sdkConfig
        this.chain = _chain
        this.ontFs = _ontFs
        this.fs = _fs
        this.stop = _stop
        this.pdpServer = _pdpServer
    }

    getVersion() {
        return common.VERSION
    }

    start() {
        return this.fs.start()
    }

    stop() {
        if (this.fs) {
            const err = this.fs.close()
            if (err) {
                throw err
            }
        }
        this.stop = true
    }

    currentAccount() {
        return this.account
    }

    walletAddress() {
        return this.currentAccount().address.toBase58()
    }

    async waitForBlock(blockHeight) {
        try {
            const currentBlockHeight = await this.chain.getBlockHeight()
            if (blockHeight <= currentBlockHeight) {
                return
            }
            const timeout = common.WAIT_FOR_GENERATEBLOCK_TIMEOUT * (blockHeight - currentBlockHeight)
            if (timeout > common.DOWNLOAD_FILE_TIMEOUT) {
                timeout = common.DOWNLOAD_FILE_TIMEOUT
            }
            await this.waitForGenerateBlock(timeout, blockHeight - currentBlockHeight)
        } catch (e) {
            throw e
        }
    }



    async waitForGenerateBlock(timeout, blockCount) {
        if (!blockCount) {
            return
        }
        let blockHeight = await this.chain.getBlockHeight()
        if (!timeout) {
            timeout = 1
        }
        for (let i = 0; i < timeout; i++) {
            await sleep(1000)
            let curBlockHeigh = await this.chain.getBlockHeight()
            if ((curBlockHeigh - blockHeight) >= blockCount) {
                return true
            }
        }
        throw new Error(`timeout after ${timeout} (s)`)
    }

    async createSpace(volume, copyNum, pdpInterval, timeExpired) {
        try {
            if (copyNum > common.MAX_COPY_NUM) {
                throw new Error(`max copy num limit ${common.MAX_COPY_NUM}, (copyNum: ${copyNum})`)
            }
            const nodeInfoList = await this.ontFs.getNodeInfoList(common.DEFAULT_FS_NODES_LIST)
            const nodeCount = nodeInfoList.nodesInfo.length
            if (nodeCount < copyNum) {
                throw new Error(`create space failed, nodeCount ${nodeCount} is less than copyNum ${copyNum}`)
            }
            const tx = await this.ontFs.createSpace(volume, copyNum, pdpInterval, timeExpired)
            if (!tx) {
                throw new Error(`create space err`)
            }
            const info = this.getSpaceInfo()
            return info
        } catch (e) {
            throw e
        }
    }

    async getSpaceInfo() {
        try {
            const info = await this.ontFs.getSpaceInfo()
            if (!info) {
                throw new Error(`get space info error`)
            }
            return info
        } catch (e) {
            throw e
        }
    }

    async deleteSpace() {
        try {
            const tx = await this.ontFs.deleteSpace()
            const info = await this.ontFs.getSpaceInfo().catch((e) => { })
            console.log(`delete space tx = ${tx}, info = ${info}`)
            if (!info) {
                console.log(`delete space success`)
            } else {
                throw new Error(`get space info also exist`)
            }
        } catch (e) {
            throw e
        }
    }

    async updateSpace(volume, timeExpired) {
        try {
            const spaceInfo1 = await this.ontFs.getSpaceInfo()
            const tx = await this.ontFs.updateSpace(volume, timeExpired)
            const spaceInfo2 = await this.ontFs.getSpaceInfo()
            if (spaceInfo1.volume == spaceInfo2.volume && spaceInfo1.timeExpired == spaceInfo2.timeExpired) {
                throw new Error(`update failed, before volume(${spaceInfo1.Volume}), time expired(${spaceInfo1.TimeExpired});
                 updated volume(${spaceInfo2.Volume}), time expired(${spaceInfo2.TimeExpired})`)
            } else {
                console.log("update space success")
            }
        } catch (e) {
            throw e
        }
    }

    async getFsNodesList(limit) {
        try {
            const fsNodeList = await this.ontFs.getNodeInfoList(limit)
            var count = 0
            var fsNodesInfoList = []
            for (let index in fsNodeList.nodesInfo) {
                let nodeInfo = fsNodeList.nodesInfo[index]
                if (count >= limit) {
                    break
                }
                fsNodesInfoList.push({
                    pledge: nodeInfo.pledge,
                    profit: nodeInfo.profit,
                    volume: common.formatVolumeStringFromKb(nodeInfo.volume),
                    restVol: common.formatVolumeStringFromKb(nodeInfo.restVol),
                    serviceTime: common.formatTimeStringFromUnixTime(nodeInfo.serviceTime),
                    minPdpInterval: nodeInfo.minPdpInterval,
                    nodeAddr: nodeInfo.nodeAddr.toBase58(),
                    nodeNetAddr: nodeInfo.nodeNetAddr,
                })
                count++
            }
            return fsNodesInfoList
        } catch (e) {
            throw e
        }
    }

    checkFsNodesNetworkAvaliable(nodeAddrs) {
        for (let fsNodeAddr of nodeAddrs) {
            client.P2pConnect(fsNodeAddr)
        }
    }


    async getFileInfo(fileHashStr) {
        try {
            const fi = await this.ontFs.getFileInfo(fileHashStr)
            if (fi) {
                return {
                    fileHash: fi.fileHash,
                    fileOwner: fi.fileOwner.toBase58(),
                    fileDesc: fi.fileDesc,
                    fileBlockCount: fi.fileBlockCount,
                    realFileSize: common.formatVolumeStringFromByteNum(fi.realFileSize),
                    copyNumber: fi.copyNumber,
                    payAmount: common.formatOng(fi.payAmount),
                    restAmount: common.formatOng(fi.restAmount),
                    fileCost: common.formatOng(fi.fileCost),
                    firstPdp: fi.firstPdp,
                    pdpInterval: fi.pdpInterval,
                    timeStart: common.formatTimeStringFromUnixTime(fi.timeStart),
                    timeExpired: common.formatTimeStringFromUnixTime(fi.timeExpired),
                    pdpParam: fi.pdpParam,
                    validFlag: fi.validFlag,
                    storageType: fi.storageType,
                }
            }
            throw new Error(`fileinfo is nil`)
        } catch (e) {
            throw e
        }
    }

    async getFileList() {
        let fileHashes = []
        try {
            const list = await this.ontFs.getFileList()
            if (!list) {
                return fileHashes
            }
            for (let hash of list.filesH) {
                if (!hash || !hash.fHash) {
                    continue
                }
                fileHashes.push(hash.fHash)
            }
            return fileHashes
        } catch (e) {
            throw e
        }
    }

    async  renewFile(fileHash, addTime) {
        try {
            const fileInfo = await this.ontFs.getFileInfo(fileHash)
            const fileRenews = {
                fileHash,
                renewTime: fileInfo.timeExpired + addTime,
            }
            await this.ontFs.renewFile([fileRenews])
        } catch (e) {
            throw e
        }
    }

    async changeOwner(fileHash, newOwner) {
        try {
            const fileRenews = {
                fileHash,
                newOwner,
            }
            await this.ontFs.transferFiles([fileRenews])
            const fileInfo = this.ontFs.getFileInfo(fileHash)
            if (fileInfo.fileOwner == newOwner) {
                console.log('change owner success')
            } else {
                throw new Error(`check upload file info owner is not newOwner ${newOwner}`)
            }
        } catch (e) {
            throw e
        }
    }

    async getFileReadPledge(fileHashStr) {
        try {
            const fileInfo = await this.ontFs.getFileInfo(fileHashStr)
            if (!fileInfo) {
                throw new Error(`get file info file hash ${fileHashStr} error`)
            }
            const pledge = await this.ontFs.getFileReadPledge(fileHashStr, this.ontFs.walletAddr)
            if (!pledge) {
                throw new Error(`file read pledge not exist`)
            }
            const readPledge = {
                fileHash: pledge.fileHash,
                downloader: pledge.downloader.toBase58(),
                blockHeight: pledge.blockHeight,
                expireHeight: pledge.expireHeight,
                restMoney: pledge.restMoney,
                readPlans: [],
            }
            for (let plan of pledge.readPlans) {
                readPledge.readPlans.push({
                    nodeAddr: plan.nodeAddr.toBase58(),
                    maxReadBlockNum: plan.maxReadBlockNum,
                    haveReadBlockNum: plan.haveReadBlockNum,
                })
            }
            return readPledge
        } catch (e) {
            throw e
        }
    }

    async cancelFileRead(fileHashStr) {
        try {
            const fileInfo = await this.ontFs.getFileInfo(fileHashStr)
            if (!fileInfo) {
                throw new Error(`get file info file hash ${fileHashStr} error`)
            }
            const pledge = await this.ontFs.getFileReadPledge(fileHashStr, this.ontFs.walletAddr)
            if (!pledge) {
                throw new Error(`get file read pledge error`)
            }
            await this.ontFs.cancelFileRead(fileHashStr)
        } catch (e) {
            throw e
        }

    }

    async getFilePdpInfoList(fileHashStr) {
        try {
            let records = []
            const fileInfo = await this.ontFs.getFileInfo(fileHashStr)
            if (!fileInfo) {
                throw new Error(`get file info fileHash ${fileHashStr} error`)
            }
            const pdpRecordList = await this.ontFs.getFilePdpRecordList(fileHashStr)
            console.log('pdpRecordList', pdpRecordList)
            if (!pdpRecordList) {
                throw new Error(`get pdp records list error`)
            }
            for (let pr of pdpRecordList.pdpRecords) {
                records.push({
                    nodeAddr: pr.nodeAddr.toBase58(),
                    fileHash: pr.fileHash,
                    fileOwner: pr.fileOwner.toBase58(),
                    pdpCount: pr.pdpCount,
                    lastPdpTime: common.formatTimeStringFromUnixTime(pr.lastPdpTime),
                    nextHeight: pr.nextHeight,
                    settleFlag: pr.settleFlag,
                })
            }
            return records
        } catch (e) {
            throw e
        }
    }

    async  challenge(fileHash, nodeAddr) {
        try {
            await this.ontFs.challenge(fileHash, nodeAddr)
        } catch (e) {
            throw e
        }
    }

    async  judge(fileHash, nodeAddr) {
        try {
            await this.ontFs.judge(fileHash, nodeAddr)
        } catch (e) {
            throw e
        }
    }

    async  getChallengeList(fileHash) {
        try {
            const challengeListTmp = await this.ontFs.getFileChallengeList(fileHash)
            let challengeList = []
            for (let challenge of challengeListTmp.challenges) {
                challengeList.push({
                    fileHash: challenge.fileHash,
                    fileOwner: challenge.fileOwner.toBase58(),
                    nodeAddr: challenge.nodeAddr.toBase58(),
                    challengeHeight: challenge.challengeHeight,
                    reward: challenge.reward,
                    expiredTime: challenge.expiredTime,
                    state: challenge.state,
                })
            }
            return challengeList
        } catch (e) {
            throw e
        }
    }

    async deleteFile(fileHash) {
        try {
            let fileInfo = await this.ontFs.getFileInfo(fileHash)
            if (!fileInfo) {
                throw new Error(`DeleteFile error: file is not exist`)
            }
            await this.ontFs.deleteFiles([fileHash])
            fileInfo = await this.ontFs.getFileInfo(fileHash).catch((e) => { })
            if (!fileInfo) {
                console.log(`file ${fileHash} has deleted`)
                return
            }
            console.log('fileInfo', fileInfo)
            throw new Error(`contract interface DeleteFile called error`)
        } catch (e) {
            throw e
        }
    }
    async  deleteFiles(fileHashes) {
        try {
            await this.ontFs.deleteFiles(fileHashes)
        } catch (e) {
            throw e
        }
    }

    decryptFile(fullFilePath, decryptPwd, outFilePath) {


    }

    decryptDownloadedFile(fullFilePath, decryptPwd, outFilePath) {

    }

}

const initSdk = (sdkCfg, acc) => {
    const s = new Sdk()
    s.sdkConfig = sdkCfg
    s.chain = new RpcClient(sdkCfg.chainRpcAddr)
    s.pdpServer = pdp.newPdp(sdkCfg.pdpVersion)
    if (acc) {
        s.account = acc
    }
    s.ontFs = new OntFs(acc, sdkCfg.walletPwd, sdkCfg.chainRpcAddr, sdkCfg.gasPrice, sdkCfg.gasLimit)
    if (!s.ontFs) {
        throw new Error("ontfs contract api init failed")
    }
    if (config.DaemonConfig && config.DaemonConfig.fsRepoRoot && config.DaemonConfig.fsRepoRoot.length) {
        s.fs = fs.newFs()
    }
    return s
}

const setGloblalSdk = (sdk) => {
    GlobalSdk = sdk
}

module.exports = {
    Sdk,
    initSdk,
    setGloblalSdk,
    Version,
    GlobalSdk
}