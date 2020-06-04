const types = require("../types")
const utils = require("../utils")
const common = require("../common")
const sdk = require("../sdk")
const { TaskStart, TaskPause, TaskFinish } = require("./const")
const sha3_256 = require("js-sha3").sha3_256
const Buffer = require('buffer/').Buffer

const message = require("../network/message")
const client = require("../network/http/http_client")
const { client: dapi } = require("@ont-dev/ontology-dapi")
const Upload_AddTask = 0
const Upload_FsAddFile = 1
const Upload_FsGetPdpHashData = 2
const Upload_ContractStoreFiles = 3
const Upload_FilePreTransfer = 4
const Upload_FileTransferBlocks = 5
const Upload_WaitPdpRecords = 6
const Upload_Done = 7
const Upload_Error = 8

/**
 * init a upload task
 *
 * @param {string} taskID taskID
 * @param {Object} option upload option
 * @param {Object} baseInfo base info, for a new task, it is null
 * @param {Object} transferInfo transfer info, for a new task, it is null
 * @returns
 */
const newTaskUpload = async (taskID, option, baseInfo, transferInfo) => {
    if (!baseInfo && !transferInfo) {
        try {
            await checkParams(option)
        } catch (e) {
            throw e
        }
    }
    const taskUpload = new TaskUpload(option)
    if (baseInfo) {
        taskUpload.baseInfo = baseInfo
    } else {
        taskUpload.baseInfo = {
            taskID: taskID,
            progress: Upload_AddTask,
            allOffset: {}
        }
    }
    if (taskUpload.baseInfo.status != TaskFinish) {
        taskUpload.baseInfo.status = TaskPause
    }
    if (transferInfo) {
        transferInfo.blockMsgDataMap = {}
        transferInfo.blockSendNotify = {}
        taskUpload.transferInfo = transferInfo
    } else {
        taskUpload.transferInfo = {
            blockMsgDataMap: {},
            blockSendNotify: {},
            blockSendDetails: {},
        }
    }
    return taskUpload
}

/**
 * Upload task
 *
 * @class TaskUpload
 */
class TaskUpload {
    constructor(_option, _baseInfo, _transferInfo) {
        this.option = _option
        this.baseInfo = _baseInfo
        this.transferInfo = _transferInfo
    }

    /**
     * check a upload task is valid or not
     *
     * @memberof TaskUpload
     */
    async checkUploadTask() {
        const uploaded = await fileHasUploaded(this.baseInfo.fileHash)
        if (uploaded) {
            throw new Error(`file ${this.baseInfo.fileHash} info has been exist on chain`)
        }
        if (this.option.storageType != types.FileStorageTypeUseSpace) {
            return
        }
        try {
            console.log("get space info")
            const spaceInfo = await sdk.globalSdk().ontFs.getSpaceInfo()
            if (spaceInfo.restVol * 1024 < this.baseInfo.blockCount * common.CHUNK_SIZE) {
                throw new Error("space rest volume is not enough")
            }
            if (this.option.copyNum != spaceInfo.copyNumber) {
                throw new Error(`copyNum must be equal with space copyNum`)
            }
            this.option.timeExpired = spaceInfo.timeExpired
        } catch (e) {
            console.log(`get space info error ${e.toString()}`)
            throw e
        }
    }

    /**
     * start upload
     *
     * @memberof TaskUpload
     */
    async upload() {
        let fileEnc = false
        this.baseInfo.status = TaskStart
        if (this.baseInfo.progress < Upload_FsAddFile) {
            this.baseInfo.filePrefix = getFilePrefix(this.option)
            if (this.option.encPassword && this.option.encPassword.length) {
                fileEnc = true
            }
            try {
                this.baseInfo.blockHashes = await sdk.globalSdk().fs.addFile(
                    this.option.filePath,
                    this.option.fileContent,
                    this.baseInfo.filePrefix,
                    fileEnc,
                    this.option.encPassword
                )
                console.log('hash', this.baseInfo.blockHashes)
                this.baseInfo.fileHash = this.baseInfo.blockHashes[0]
                this.baseInfo.blockCount = this.baseInfo.blockHashes.length
                this.baseInfo.progress = Upload_FsAddFile
            } catch (e) {
                console.log('sharding file err', e.toString())
                throw e
            }
        }
        if (this.baseInfo.progress < Upload_FsGetPdpHashData) {
            await this.checkUploadTask().catch((e) => {
                throw e
            })
            const fileUniqueId = await getFileUniqueId(this.baseInfo.blockHashes).catch((e) => {
                console.log(`fs GetFilePdpHashes err ${e.toString()}`)
                throw e
            })
            this.baseInfo.pdpHashData = fileUniqueId
            console.log('fileUniqueId', fileUniqueId)
            this.baseInfo.progress = Upload_FsGetPdpHashData
        }
        if (this.baseInfo.progress < Upload_ContractStoreFiles) {
            const fileStore = {
                fileHash: this.baseInfo.fileHash,
                fileDesc: this.option.fileDesc,
                fileBlockCount: this.baseInfo.blockCount,
                realFileSize: this.option.fileSize,
                copyNumber: this.option.copyNum,
                firstPdp: this.option.firstPdp,
                timeExpired: this.option.timeExpired,
                pdpParam: this.baseInfo.pdpHashData,
                storageType: this.option.storageType,
            }
            console.log('fileStore', fileStore)
            const tx = await sdk.globalSdk().ontFs.storeFiles([fileStore]).catch((e) => {
                throw e
            })
            console.log('fileStore', fileStore, tx)
            await sdk.globalSdk().waitForGenerateBlock(60, 1)
            const uploaded = await fileHasUploaded(this.baseInfo.fileHash)
            if (!uploaded) {
                throw new Error(`contract interface StoreFile called failed`)
            }
            this.baseInfo.storeTxHash = tx.transaction
            const blockHeightRet = await dapi.api.network.getBlockHeightByTxHash({ hash: tx.transaction }).catch((e) => {
                console.log("get height err", e)
                throw e
            })
            this.baseInfo.storeTxHeight = blockHeightRet
            this.baseInfo.progress = Upload_ContractStoreFiles
        }
        console.log('base info', this.baseInfo)
        if (this.baseInfo.progress < Upload_FilePreTransfer) {
            this.baseInfo.allOffset = await sdk.globalSdk().fs.getFileAllBlockHashAndOffset(this.baseInfo.fileHash).catch((err) => {
                throw new Error(`[Upload] GetFileAllBlockHashAndOffset error: ${err.toString()}`)
            })
            this.baseInfo.progress = Upload_FilePreTransfer
        }
        if (this.baseInfo.progress < Upload_FileTransferBlocks) {
            let fileReceivers = {}
            const nodeList = await sdk.globalSdk().ontFs.getNodeInfoList(common.DEFAULT_FS_NODES_LIST).catch((e) => {
                throw e
            })

            if (!nodeList.nodesInfo || nodeList.nodesInfo.length < this.option.copyNum) {
                throw new Error(`fs nodes count ${nodeList.nodesInfo ? nodeList.nodesInfo.length : 0} less 
                than copyNum(${this.option.copyNum})`)
            }
            for (let fsNode of nodeList.nodesInfo) {
                const fsNodeAddr = fsNode.nodeAddr
                const fsNodeServiceTime = typeof (fsNode.serviceTime) == 'string' ? new Date(fsNode.serviceTime) : fsNode.serviceTime
                console.log(`node service time: ${parseInt(fsNodeServiceTime.getTime() / 1000)}, time expired:${this.option.timeExpired}`)
                if (parseInt(fsNodeServiceTime.getTime() / 1000) < this.option.timeExpired) {
                    console.log(`"CheckFsServerStatus ${fsNodeAddr} error: fsNode.ServiceTime(${fsNode.serviceTime}) 
                    < opt.TimeExpired(${this.option.timeExpired})"`)
                    continue
                }
                if (fsNode.restVol * 1024 < this.baseInfo.blockCount * common.CHUNK_SIZE) {
                    console.log(`"CheckFsServerStatus ${fsNodeAddr} error: fsNode.RestVol(${fsNode.restVol * 1024})
                     >= fileSize(${this.baseInfo.blockCount * common.CHUNK_SIZE})"`)
                    continue
                }
                const fsNodeNetAddr = common.getHTTPAddrFromNodeNetAddr(fsNode.nodeNetAddr)
                await this.checkFsServerStatus(fsNodeNetAddr).then(() => {
                    fileReceivers[fsNodeNetAddr] = fsNodeAddr
                }).catch((e) => { })
                console.log(`receivers =`, fileReceivers)
                if (fileReceivers && Object.keys(fileReceivers).length == this.option.copyNum) {
                    break
                }
            }
            if (Object.keys(fileReceivers).length < this.option.copyNum) {
                throw new Error(`find fs receivers count(${Object.keys(fileReceivers).length}) less than copyNum(${this.option.copyNum})`)
            }
            await this.blocksSend(fileReceivers).catch((e) => {
                throw e
            })
            console.log("block send this.baseInfo.allOffse", this.baseInfo)
            console.log(`Task Id: ${this.baseInfo.taskID} FileHash: ${this.baseInfo.fileHash}, BlocksSend Done.`)
            this.baseInfo.progress = Upload_FileTransferBlocks
        }

        if (this.baseInfo.progress < Upload_WaitPdpRecords) {
            for (let count = 0; count < common.UPLOAD_WAIT_PDP_RECORDS_MAX_TIME + 1; count++) {
                if (count == common.UPLOAD_WAIT_PDP_RECORDS_MAX_TIME) {
                    throw new Error(`Task Id: ${this.baseInfo.taskID} FileHash: ${this.baseInfo.fileHash}` +
                        ` Wait for pdp records timeout `)
                } else if (count != 0) {
                    await utils.sleep(common.UPLOAD_WAIT_PDP_RECIRDS_INTERVAL * 1000)
                }
                try {
                    const pdpRecordList = await sdk.globalSdk().ontFs.getFilePdpRecordList(this.baseInfo.fileHash)
                    console.log("pdpRecordList", pdpRecordList, this.option.copyNum)
                    if (pdpRecordList && pdpRecordList.pdpRecords &&
                        pdpRecordList.pdpRecords.length) {
                        break
                    }
                } catch (e) {
                    console.log(`get file pdp record list err ${e.toString()}`)
                }
            }
            this.baseInfo.progress = Upload_WaitPdpRecords
        }
        this.baseInfo.progress = Upload_Done
        console.log("pdp finish")
    }

    /**
     * start the task
     *
     * @memberof TaskUpload
     */
    start() {
        if (this.baseInfo.status == TaskStart) {
            throw new Error("Task is already start.")
        }
        if (this.baseInfo.status == TaskFinish) {
            throw new Error("Task is already finished.")
        }
        if (this.baseInfo.progress == Upload_Error) {
            throw new Error(`Start task error: ${this.baseInfo.errorInfo}`)
        }
        this.upload().then(() => {
            this.baseInfo.status = TaskFinish
        }).catch((e) => {
            console.log(`file upload failed`, JSON.stringify(e))
            this.baseInfo.progress = Upload_Error
            this.baseInfo.errorInfo = e.toString()
            this.baseInfo.status = TaskFinish
        })
    }

    /**
     * resume the task
     *
     * @memberof TaskUpload
     */
    resume() {
        this.start()
    }

    /**
     * stop the task
     *
     * @memberof TaskUpload
     */
    stop() {
    }

    /**
     * delete the task
     *
     * @memberof TaskUpload
     */
    async clean() {
        if (this.baseInfo.status == TaskFinish || this.baseInfo.status == TaskPause) {
            if ((this.baseInfo.errorInfo && this.baseInfo.errorInfo.length) ||
                this.baseInfo.progress == Upload_Error) {
                const fileInfo = await sdk.globalSdk().getFileInfo(this.baseInfo.fileHash).catch((err) => {
                    throw err
                })
                if (fileInfo) {
                    await sdk.globalSdk().deleteFile(this.baseInfo.fileHash).catch((err) => {
                        throw err
                    })
                }
            }
        } else if (this.baseInfo.status == TaskStart) {
            throw new Error("Task clean error: task is running")
        }
    }

    /**
     * check storage node status
     *
     * @param {Account} account: current account
     * @param {string} nodeNetAddr: node http host address
     * @memberof TaskUpload
     */
    async checkFsServerStatus(nodeNetAddr) {
        const account = await dapi.api.asset.getAccount();
        const sessionId = getUploadSessionId(this.baseInfo.taskID, nodeNetAddr)
        const msg = message.newFileMsg(this.baseInfo.fileHash, message.FILE_OP_UPLOAD_ASK, [
            message.withSessionId(sessionId),
            message.withBlockHashes(this.baseInfo.blockHashes),
            message.withWalletAddress(account),
            message.withTxHash(this.baseInfo.storeTxHash),
            message.withTxHeight(this.baseInfo.storeTxHeight),
        ])
        try {
            const fileAskRet = await client.httpSendWithRetry(msg, nodeNetAddr, 1, 30)
            if (!fileAskRet.data) {
                throw new Error(`send file ask msg err`)
            }
            console.log("fileAskRet.data", fileAskRet.data)
            console.log(`p2p broadcast file ask msg ret `, message.decodeMsg(fileAskRet.data))
        } catch (e) {
            console.log(`wait file receivers broadcast err ${e.toString()} `)
            throw e
        }
    }

    /**
     * send blocks concurrent to receivers
     *
     * @param {Array} fileReceivers
     * @memberof TaskUpload
     */
    async blocksSend(fileReceivers) {
        let promiseList = []
        console.log('blocksSend', fileReceivers)
        for (let peerNetAddr in fileReceivers) {
            const peerAddr = fileReceivers[peerNetAddr]
            const peerUploadInfo = {
                index: 0,
                peerWalletAddr: peerAddr,
            }
            const peerUploadNotify = {}
            this.transferInfo.blockSendDetails[peerNetAddr] = peerUploadInfo
            this.transferInfo.blockSendNotify[peerNetAddr] = peerUploadNotify
            // const sessionId = getUploadSessionId(this.baseInfo.taskID, peerNetAddr)
            const promise = new Promise((resolve, reject) => {
                this.sendBlockToPeer(peerNetAddr).then(() => {
                    resolve()
                }).catch((e) => {
                    console.log(`send block to peer error ${e.toString()} `)
                    resolve()
                })
            })
            promiseList.push(promise)
        }
        console.log("this.baseInfo.progress", this.baseInfo.progress)
        try {
            await Promise.all(promiseList)
        } catch (e) {
            throw e
        }
    }

    /**
     * send block to a peer
     *
     * @param {string} peerNetAddr: peer http host address
     * @memberof TaskUpload
     */
    async sendBlockToPeer(peerNetAddr) {
        const blockSendDetail = this.transferInfo.blockSendDetails[peerNetAddr]
        const newFileResp = await this.sendFetchReadyMsg(peerNetAddr).catch((e) => {
            console.log(`notify fetch ready msg failed, err ${e.toString()} `)
            blockSendDetail.errorInfo = `notify fetch ready msg failed, err ${e.toString()}`
            throw e
        })
        if (newFileResp.error && newFileResp.error.code != message.MSG_ERROR_CODE_NONE) {
            console.log(`receive rdy msg reply err ${newFileResp.error.code}, msg ${newFileResp.error.message} `)
            blockSendDetail.errorInfo = `receive rdy msg reply err ${newFileResp.error.code}, msg ${newFileResp.error.message}`
            throw new Error(`receive rdy msg reply err ${newFileResp.error.code}, msg ${newFileResp.error.message} `)
        }
        const respFileMsg = newFileResp.payload
        console.log(`respFileMsg`, blockSendDetail, peerNetAddr)
        console.log('respFileMsg.breakpoint', respFileMsg.breakpoint)
        if (respFileMsg.breakpoint && respFileMsg.breakpoint.hash && respFileMsg.breakpoint.hash.length &&
            respFileMsg.breakpoint.index && respFileMsg.breakpoint.index < this.baseInfo.blockCount &&
            this.baseInfo.blockHashes[respFileMsg.breakpoint.index] == respFileMsg.breakpoint.hash) {
            blockSendDetail.index = respFileMsg.breakpoint.index + 1
        }
        let toBeSentBlocks = []
        let maxSendBlockCount = common.MAX_SEND_BLOCK_COUNT
        // maxSendBlockCount = common.MAX_SEND_BLOCK_COUNT - parseInt(this.baseInfo.blockCount / 200) * 4
        // if (!maxSendBlockCount || maxSendBlockCount <= 0) {
        //     maxSendBlockCount = 4
        // }
        console.log("maxSendBlockCount", maxSendBlockCount, this.baseInfo.blockCount)
        for (let blockIndex = blockSendDetail.index; blockIndex < this.baseInfo.blockCount; blockIndex++) {
            const blockHash = this.baseInfo.blockHashes[blockIndex]
            const blockMsgData = await this.getMsgData(blockHash, blockIndex)
            if (!blockMsgData) {
                blockSendDetail.errorInfo = `no block msg data to send`
                throw new Error(`no block msg data to send`)
            }
            const b = {
                index: blockIndex,
                hash: blockHash,
                data: blockMsgData.blockData,
                offset: blockMsgData.offset,
            }
            toBeSentBlocks.push(b)
            // if (blockIndex != this.baseInfo.blockCount - 1 && toBeSentBlocks.length < common.MAX_SEND_BLOCK_COUNT) {
            if (blockIndex != this.baseInfo.blockCount - 1 && toBeSentBlocks.length < maxSendBlockCount) {
                continue
            }
            // console.log("toBeSentBlocks", toBeSentBlocks)
            const blocksAck = await this.sendBlockFlightMsg(peerNetAddr, toBeSentBlocks).catch((e) => {
                console.log(`send block flight msg err`, e.toString())
                blockSendDetail.errorInfo = e.toString()
                throw e
            })
            // if (this.baseInfo.blockCount > 800) {
            //     await utils.sleep(1000)
            // }
            console.log("blockAck", blocksAck)
            this.cleanMsgData(blocksAck)
            blockSendDetail.index = blockIndex
            toBeSentBlocks = []
        }
    }

    /**
     * generate block msg
     *
     * @param {string} hash block hash
     * @param {number} index ignore
     * @param {number} offset block data offset
     * @returns
     * @memberof TaskUpload
     */
    async generateBlockMsgData(hash, index, offset) {
        const block = await sdk.globalSdk().fs.getBlockWithHash(hash).catch((e) => {
            throw e
        })
        const blockData = sdk.globalSdk().fs.getBlockData(block)
        return {
            blockData: blockData,
            offset: offset,
            refCnt: this.option.copyNum,
        }
    }

    /**
     * send a block flight msg to peer
     *
     * @param {string} peerAddr peer http host address
     * @param {Array} blocks blocks data array
     * @returns {Array} acks from peer
     * @memberof TaskUpload
     */
    async sendBlockFlightMsg(peerAddr, blocks) {
        if (!blocks || !blocks.length) {
            console.log(`task ${this.baseInfo.taskID} has no block to send`)
            return 0
        }
        for (let block of blocks) {
            block.Hash = block.hash
            block.Index = block.index
            block.Offset = block.offset
            block.Data = block.data
            delete block['hash']
            delete block['index']
            delete block['offset']
            delete block['data']
        }
        const sessionId = getUploadSessionId(this.baseInfo.taskID, peerAddr)
        const flights = {
            SessionId: sessionId,
            FileHash: this.baseInfo.fileHash,
            Operation: message.BLOCK_FLIGHTS_OP_PUSH,
            Blocks: blocks,
        }
        const msg = message.newBlockFlightMsg(flights)
        // console.log("flights", flights)
        // console.log("msg", msg)
        const ret = await client.httpSend(peerAddr, msg).catch((e) => {
            console.log(`send block err ${e.toString()} `)
            throw e
        })
        if (ret.data) {
            // console.log("send block ret", message.decodeMsg(ret.data))
        }
        let blockAck = []
        for (let blk of blocks) {
            blockAck.push({
                hash: blk.Hash,
                index: blk.Index
            })
        }
        return blockAck
    }

    /**
     * send block fetch ready msg
     *
     * @param {string} peerAddr peer http host address
     * @returns {Object} response msg from peer
     * @memberof TaskUpload
     */
    async sendFetchReadyMsg(peerAddr) {
        const account = await dapi.api.asset.getAccount();
        const sessionId = getUploadSessionId(this.baseInfo.taskID, peerAddr)
        const msg = message.newFileMsg(this.baseInfo.fileHash, message.FILE_OP_UPLOAD_RDY, [
            message.withSessionId(sessionId),
            message.withWalletAddress(account),
            message.withBlocksRoot(this.baseInfo.fileHash),
            message.withTxHash(this.baseInfo.storeTxHash),
            message.withTxHeight(this.baseInfo.storeTxHeight),
            message.withPrefix(this.baseInfo.filePrefix),
            message.withTotalBlockCount(this.baseInfo.blockCount),
        ])
        const newFileResp = await client.httpSendWithRetry(msg, peerAddr, 1, 15).catch((e) => {
            throw e
        })
        if (!newFileResp.data) {
            throw new Error(`get file rdy msg repsone err`)
        }
        const p2pMsg = message.decodeMsg(newFileResp.data)
        console.log(`p2p send file rdy msg ret `, p2pMsg)
        return p2pMsg
    }

    /**
     * get a block msg
     *
     * @param {string} hash block hash
     * @param {number} index block index of the file
     * @returns {Object}
     * @memberof TaskUpload
     */
    async getMsgData(hash, index) {
        const key = keyOfBlockHashAndIndex(hash, index)
        let data = this.transferInfo.blockMsgDataMap[key]
        if (data) {
            return data
        }
        const offsetKey = `${hash}-${index}`
        const offset = this.baseInfo.allOffset[offsetKey]
        data = await this.generateBlockMsgData(hash, index, offset).catch((e) => {
            throw e
        })
        this.transferInfo.blockMsgDataMap[key] = data
        return data
    }

    /**
     * clean a unused msg from memory
     *
     * @param {Object} blocksAck
     * @memberof TaskUpload
     */
    cleanMsgData(blocksAck) {
        for (let reqInfo of blocksAck) {
            const { hash, index } = reqInfo
            const key = keyOfBlockHashAndIndex(hash, index)
            const data = this.transferInfo.blockMsgDataMap[key]
            if (!data) {
                continue
            }
            data.refCnt--
            if (data.refCnt > 0) {
                continue
            }
            delete this.transferInfo.blockMsgDataMap[key]
            console.log("delete blockMsgData", this.baseInfo.fileHash, key)
            sdk.globalSdk().fs.returnBuffer(data.blockData)
        }
    }
}


/**
 * generate a file prefix by option
 *
 * @param {Object} to upload option
 * @returns {string} prefix string
 */
const getFilePrefix = (to) => {
    const filePrefix = new utils.FilePrefix(utils.PREFIX_VERSION, false, 0, "", "", "", to.fileSize, "")
    filePrefix.encryptSalt = utils.randomHex(utils.CRYPT_SALT_LEN * 2)
    if (to.encPassword && to.encPassword.length) {
        filePrefix.encryptPwd = to.encPassword
        filePrefix.encryptPwdLen = to.encPassword.length
        filePrefix.encrypt = true
    }
    const prefix = filePrefix.string()
    console.log(`getFilePrefix prefix: ${prefix}, len: ${prefix.length} `)
    return prefix
}

/**
 * check upload option params
 *
 * @param {Object} to upload option
 */
const checkParams = async (to) => {
    if (!to.fileDesc || !to.fileDesc.length) {
        throw new Error("[TaskUploadOption] CheckParams file desc is missing")
    }
    if (to.fileSize > common.MAX_UPLOAD_FILE_SIZE) {
        throw new Error(`[TaskUploadOption] CheckParams file size out of limit,
            max support ${ common.MAX_UPLOAD_FILE_SIZE} in kb unit`)
    }
    if (parseInt((new Date().getTime()) / 1000) >= to.timeExpired) {
        throw new Error("[TaskUploadOption] CheckParams file expired time error")
    }
    if (to.copyNum <= 0) {
        throw new Error(`[TaskUploadOption] CheckParams file copy num must > 0, (CopyNum: ${to.copyNum})`)
    }
    if (to.copyNum > common.MAX_COPY_NUM) {
        throw new Error(`[TaskUploadOption] CheckParams max copy num limit ${common.MAX_COPY_NUM}, (CopyNum: ${to.copyNum})`)
    }
    switch (to.storageType) {
        case types.FileStorageTypeUseFile:
            break
        case types.FileStorageTypeUseSpace:
            const sp = await sdk.globalSdk().getSpaceInfo().catch((err) => {
                throw err
            })
            if (sp.copyNumber != to.copyNum) {
                throw new Error("[TaskUploadOption] CheckParams copyNum not equals spaceCopyNum: ", sp.copyNumber)
            }
            break
        default:
            throw new Error("[TaskUploadOption] CheckParams file storage type error")
    }

    if (to.storageType != types.FileStorageTypeUseFile && to.storageType != types.FileStorageTypeUseSpace) {
        throw new Error("[TaskUploadOption] CheckParams file storage type error")
    }
    if (!to.fileContent) {
        throw new Error("[TaskUploadOption] CheckParams file content is empty")
    }
}

/**
 * check if a file has uploaded
 *
 * @param {string} fileHash
 * @returns {boolean}
 */
const fileHasUploaded = async (fileHash) => {
    const fi = await sdk.globalSdk().ontFs.getFileInfo(fileHash).catch((e) => {
        console.log("get file info err", fileHash, e)
    })
    if (fi && fi.validFlag) {
        return true
    }
    return false
}

/**
 * get file unique id
 *
 * @param {Array} blockHashes
 * @returns {string}
 */
const getFileUniqueId = async (blockHashes) => {
    console.log('getFileUniqueId blockHashes', blockHashes)
    let blocks = []
    const blockCount = blockHashes.length
    for (let blockIndex = 0; blockIndex < blockCount; blockIndex++) {
        const block = await sdk.globalSdk().fs.getBlockWithHash(blockHashes[blockIndex]).catch((e) => {
            console.log('get block err', blockHashes[blockIndex], e.toString())
            throw e
        })
        const blockRawData = block.rawData
        blocks.push(Buffer.from(sha3_256.arrayBuffer(blockRawData.buffer)))
        sdk.globalSdk().fs.returnBuffer(blockRawData)
    }
    console.log(`blocks ${blocks.length} calculating file unique id`)
    // 64 bytes
    const uniqueId = await sdk.globalSdk().pdpServer.genUniqueIdWithFileBlocks(blocks)
    console.log('uniqId: ', utils.ab2hexstring(uniqueId))
    return utils.ab2hexstring(uniqueId)
}


/**
 * get key of upload session
 *
 * @param {string} taskId
 * @param {string} peerAddr
 * @returns
 */
const getUploadSessionId = (taskId, peerAddr) => {
    return `${taskId}_${peerAddr}_upload`
}

/**
 * get key of block hash and index
 *
 * @param {string} hash
 * @param {number} index
 * @returns
 */
const keyOfBlockHashAndIndex = (hash, index) => {
    return `${hash}-${index}`
}

module.exports = {
    newTaskUpload,
    TaskUpload,
}
