const path = require("path")
const fs = require("fs")
const types = require("../types")
const utils = require("../utils")
const common = require("../common")
const sdk = require("../sdk")
const config = require("../config")
const { TaskStart, TaskPause, TaskFinish } = require("./const")
const { str2hexstr, hexstr2str } = require("ontology-ts-sdk").utils
const message = require("../network/message")
const client = require("../network/http/http_client")

const Download_AddTask = 0
const Download_FsFoundFileServers = 1
const Download_FsReadPledge = 2
const Download_FsBlocksDownloadOver = 3
const Download_Done = 4
const Download_Error = 5



class TaskDownload {
    constructor(_option, _baseInfo, _transferInfo) {
        this.option = _option
        this.baseInfo = _baseInfo
        this.transferInfo = _transferInfo
    }

    start() {
        if (this.baseInfo.status == TaskStart) {
            throw new Error("Task is already start.")
        }
        if (this.baseInfo.status == TaskFinish) {
            throw new Error("Task is already finished.")
        }
        if (this.baseInfo.progress == Download_Error) {
            throw new Error(`Start task error: ${this.baseInfo.errorInfo}`)
        }
        this.download().then(() => {
            this.baseInfo.status = TaskFinish
        }).catch((err) => {
            console.log(`download err ${err.toString()}`)
            this.baseInfo.progress = Download_Error
            this.baseInfo.errorInfo = err.toString()
            this.baseInfo.status = TaskFinish
        })
    }

    resume() {
        this.start()
    }

    stop() {
    }

    async clean() {
        if (this.baseInfo.status == TaskFinish || this.baseInfo.status == TaskPause) {

        } else {
            if (this.baseInfo.status == TaskStart) {
                throw new Error("Task clean error: task is running")
            }
        }
    }

    async download() {
        this.baseInfo.status = TaskStart
        if (this.baseInfo.progress < Download_FsFoundFileServers) {
            const fileInfo = await sdk.globalSdk().ontFs.getFileInfo(this.option.fileHash).catch((err) => {
                throw new Error(`get file info err: ${err.toString()}`)
            })
            if (!fileInfo) {
                throw new Error(`get file info nil`)
            }
            const pdpRecordList = await sdk.globalSdk().ontFs.getFilePdpRecordList(this.option.fileHash).catch((err) => {
                throw err
            })
            if (!pdpRecordList || !pdpRecordList.pdpRecords || !pdpRecordList.pdpRecords.length) {
                throw new Error("no available fs nodes to download file: no node had commit pdp prove data")
            }
            let nodeAddrs = []
            let walletAddrs = []
            for (let pdpRecord of pdpRecordList.pdpRecords) {
                const nodeInfo = await sdk.globalSdk().ontFs.getNodeInfo(pdpRecord.nodeAddr.toBase58()).catch((e) => {
                    console.log(`get node ${pdpRecord.nodeAddr.toBase58()} info err: ${e.toString()}`)
                })
                if (!nodeInfo) {
                    continue
                }
                const nodeHttpAddr = common.getHTTPAddrFromNodeNetAddr(nodeInfo.nodeNetAddr)
                if (!nodeHttpAddr || nodeHttpAddr == "") {
                    console.log(`GetTcpAddrFromNodeNetAddr ${nodeInfo.nodeNetAddr} error:` +
                        ` server(${nodeInfo.nodeAddr.tBase58()}) doesn't support tcp protocol`)
                    continue

                }
                nodeAddrs.push(nodeHttpAddr)
                walletAddrs.push(walletAddrs, pdpRecord.nodeAddr)
            }
            if (!nodeAddrs.length || !walletAddrs.length) {
                throw new Error(`no available fs nodes to download file: get nodes infomation error`)
            }
            this.baseInfo.fileBlockCount = fileInfo.fileBlockCount
            this.baseInfo.fileDesc = fileInfo.fileDesc
            this.baseInfo.fileServerNetAddrs = nodeAddrs
            this.baseInfo.progress = Download_FsFoundFileServers
        }
        await this.blocksDownload().catch((err) => {
            throw err
        })
    }

    async blocksDownload() {
        this.initMicroTasks()
        await this.getValidServers(sdk.globalSdk().account).catch((err) => {
            throw err
        })
        await this.pledge().catch((err) => {
            throw err
        })
        this.transferInfo.combineInfo.combinedBlockNum = 0
        this.transferInfo.combineInfo.isFileEncrypted = utils.getPrefixEncrypted(this.baseInfo.filePrefix)
        this.transferInfo.combineInfo.hasCutPrefix = false
        const fullFilePath = path.join(config.DaemonConfig.fsFileRoot, this.option.fileHash)
        this.transferInfo.combineInfo.fullFilePath = fullFilePath

        console.log('createDownloadFile', config.DaemonConfig.fsFileRoot, fullFilePath)
        await createDownloadFile(config.DaemonConfig.fsFileRoot, fullFilePath).catch((err) => {
            console.log('[Combine] createDownloadFile error:', err)
            throw err
        })
        console.log("create success")
        const file = fs.openSync(fullFilePath, 'r+', 0o666)
        console.log("open success", fullFilePath)
        if (!file) {
            throw new Error(`[Combine] createDownloadFile error file is nil`)
        }
        this.transferInfo.combineInfo.fileStream = file
        let promiseList = []
        for (let peerNetAddr of Object.keys(this.transferInfo.blockDownloadInfo)) {
            const peerDownloadInfo = this.transferInfo.blockDownloadInfo[peerNetAddr]
            console.log(`StartRoutine (${peerDownloadInfo.peerWallet} ${peerNetAddr})`)
            const promise = new Promise(async (resolve, reject) => {
                let promiseErr
                while (true) {
                    const { blocksReq, taskIndex } = await this.getBlocksReq()
                    if (!blocksReq) {
                        console.log(`DownloadBlockFlightsFromPeer getBlocksReq return nil`)
                        break
                    }
                    const blocksResp = await this.downloadBlockFlightsFromPeer(
                        peerNetAddr, peerDownloadInfo.peerWallet, blocksReq).catch((err) => {
                            console.log(`DownloadBlockFlightsFromPeer error: ${err.toString()}`)
                            promiseErr = err
                        })
                    console.log('blockResponses', blocksResp ? blocksResp.length : 0, promiseErr)
                    if (promiseErr) {
                        this.transferInfo.microTasks[taskIndex].status = types.BlockTaskUnStart
                        break
                    }
                    if (!blocksResp) {
                        console.log("DownloadBlockFlightsFromPeer error: blocksResp is nil")
                        this.transferInfo.microTasks[taskIndex].status = types.BlockTaskUnStart
                        break
                    }
                    for (let blockResp of blocksResp) {
                        console.log(`Process BlockResp: ${blockResp.index}, ${blockResp.hash}`)
                        this.transferInfo.blockDownloadNotify.respNotify = blockResp
                        await this.combine().catch((err) => {
                            console.log("combine err", err)
                        })
                    }
                    this.transferInfo.microTasks[taskIndex].status = types.BlockTaskComplete
                }
                this.fileDownloadOk(peerNetAddr)
                this.transferInfo.blockDownloadInfo[peerNetAddr].routineStatus = types.RoutineExit
                resolve()
            })
            promiseList.push(promise)
        }
        await Promise.all(promiseList).catch((err) => {
            console.log(`promise download block flights from peer ${err.toString()}`)
        })
        console.log('DownloadBlockFlightsFromPeer finished')
        await this.combine().catch((err) => {
            console.log("combine err", err)
            fs.closeSync(file)
            this.baseInfo.errorInfo = err.toString()
            this.transferInfo.blockDownloadNotify.finished = false
            throw err
        })
        fs.closeSync(file)
        this.baseInfo.progress = Download_Done
        this.transferInfo.blockDownloadNotify.finished = true
    }
    initMicroTasks() {
        for (let index = 0; index < this.baseInfo.fileBlockCount; index += common.MAX_REQ_BLOCK_COUNT) {
            const microTaskInfo = {
                beginIndex: index,
                status: types.BlockTaskUnStart,
            }
            this.transferInfo.microTasks.push(microTaskInfo)
        }
    }

    async getBlocksReq() {
        let currTaskIndex = 0
        const microTaskTotalNum = this.transferInfo.microTasks ? this.transferInfo.microTasks.length : 0
        if (!microTaskTotalNum) {
            return
        }
        while (true) {
            let completeTaskCount = 0
            for (currTaskIndex = 0; currTaskIndex < microTaskTotalNum; currTaskIndex++) {
                if (this.transferInfo.microTasks[currTaskIndex].status == types.BlockTaskUnStart) {
                    break
                } else if (this.transferInfo.microTasks[currTaskIndex].status == types.BlockTaskComplete) {
                    completeTaskCount++
                }
            }
            if (completeTaskCount == microTaskTotalNum) {
                return
            } else if (currTaskIndex == microTaskTotalNum) {
                await utils.sleep(1000)
            } else {
                break
            }
        }
        const beginReqIndex = this.transferInfo.microTasks[currTaskIndex].beginIndex
        let blocksReq = []
        for (let i = 0; i < common.MAX_REQ_BLOCK_COUNT; i++) {
            const blockReqIndex = beginReqIndex + i
            if (blockReqIndex >= this.baseInfo.fileBlockCount) {
                break
            }
            const blockHash = this.baseInfo.fileBlockHashes[blockReqIndex]
            const req = {
                Index: blockReqIndex,
                Hash: blockHash,
            }
            blocksReq.push(req)
        }
        console.log(`blocksReq len`, blocksReq.length)
        this.transferInfo.microTasks[currTaskIndex].status = types.BlockTaskStart
        return {
            blocksReq: blocksReq,
            taskIndex: currTaskIndex
        }
    }

    async responseProcess(res, addr) {
        if (!res || !res.data) {
            return false
        }
        if (this.transferInfo.blockDownloadInfo &&
            Object.keys(this.transferInfo.blockDownloadInfo).length >= this.option.maxPeerCnt) {
            return true
        }
        console.log('res.data', res.data)
        const msg = message.decodeMsg(res.data)
        console.log('msg', msg)
        if (msg.error) {
            console.log(`get download ack err ${JSON.stringify(msg.error)} from ${addr}`)
            return false
        }
        const fileMsg = msg.payload
        if (!fileMsg.prefix) {
            console.log(`get file prefix empty from ${addr}`)
            return false
        }
        const filePrefix = new utils.FilePrefix()
        filePrefix.fromString(fileMsg.prefix)
        if (!this.baseInfo.filePrefix || !this.baseInfo.filePrefix.length) {
            this.baseInfo.filePrefix = fileMsg.prefix
        } else {
            if (fileMsg.prefix != this.baseInfo.filePrefix) {
                console.log(`file prefix not equal last`)
                return false
            }
        }

        if (this.baseInfo.fileBlockCount) {
            if (!fileMsg.blockHashes || fileMsg.blockHashes.length != this.baseInfo.fileBlockCount) {
                console.log(`BlockHashes count not equal last`)
                return false
            }
        } else {
            this.baseInfo.fileBlockCount = fileMsg.blockHashes ? fileMsg.blockHashes.length : 0
        }
        if (!this.baseInfo.fileBlockHashes) {
            this.baseInfo.fileBlockHashes = fileMsg.blockHashes
        }

        if (this.option.decryptPwd && this.option.decryptPwd.length &&
            !filePrefix.verifyEncryptPassword(this.option.decryptPwd)) {
            console.log(`encrypt password not match hash`)
            return false
        }
        if (!fileMsg.payInfo) {
            console.log(`get download ack, no payInfo`)
            return false
        }
        let settleSlice = {}
        let lastSliceId = 0
        const readPledge = await sdk.globalSdk().ontFs.getFileReadPledge(this.option.fileHash,
            sdk.globalSdk().account.address).catch((err) => {
                console.log(`contract interface FileReadPledge called failed, err ${err.toString()}`)
            })
        if (!readPledge) {
            console.log("responseProcess GetFileReadPledge return nil")
        }
        try {
            const curBlockHeight = await sdk.globalSdk().chain.getBlockHeight()
            console.log('last slice id', lastSliceId, fileMsg.payInfo.latestPayment)
            if (readPledge && readPledge.expiredHeight <= curBlockHeight) {
                for (let plan of readPledge.readPlans) {
                    if (plan.nodeAddr.toBase58() == fileMsg.payInfo.walletAddress) {
                        lastSliceId = plan.HaveReadBlockNum
                    }
                }
            } else if (fileMsg.payInfo.latestPayment && fileMsg.payInfo.latestPayment.length) {
                // test last payment
                settleSlice = JSON.parse(fileMsg.payInfo.latestPayment)
                if (settleSlice.fileHash != this.option.fileHash) {
                    console.log(`file hash in the settle slice ${settleSlice.fileHash} is 
                    not same as in the msg ${this.option.fileHash}`)
                    return false
                }
                if (settleSlice.payFrom.toBase58() != sdk.globalSdk().walletAddress()) {
                    console.log(`"payer ${settleSlice.payFrom.toBase58()} in the settle slice is 
                    not same as in the msg ${sdk.globalSdk().walletAddress()}"`)
                    return false
                }
                const ok = await sdk.globalSdk().ontFs.verifyFileReadSettleSlice(settleSlice)
                if (!ok) {
                    console.log(`check sign in the settle slice failed`)
                    return false
                }
                lastSliceId = settleSlice.sliceId
            }
        } catch (err) {
            return false
        }

        this.transferInfo.blockDownloadInfo[addr] = {
            index: 0,
            peerWallet: fileMsg.payInfo.walletAddress,
            sliceId: lastSliceId,
            totalCount: 0,
        }
        return false
    }

    async getValidServers(account) {
        const msg = message.newFileMsg(this.option.fileHash, message.FILE_OP_DOWNLOAD_ASK, [
            message.withWalletAddress(account.address.toBase58()),
        ])
        const action = async (res, addr) => {
            const result = await this.responseProcess(res, addr)
            return result
        }
        console.log("get valid msg", msg)
        await client.httpBroadcast(this.baseInfo.fileServerNetAddrs, msg, true, action).catch((err) => {
            console.log(`broadcast err ${err.toString()}`)
            throw err
        })

        // console.log("broadcast file download ask msg ret", message.decodeMsg(ret.data))
        console.log("peers:", Object.keys(this.transferInfo.blockDownloadInfo).length)
        if (!this.transferInfo.blockDownloadInfo ||
            Object.keys(this.transferInfo.blockDownloadInfo).length == 0) {
            throw new Error(`no fs nodes available when ask for download `)
        }
    }

    async pledge() {
        let readPlan = []
        const peers = Object.keys(this.transferInfo.blockDownloadInfo)
        for (let peerAddr of peers) {
            const peerDownloadInfo = this.transferInfo.blockDownloadInfo[peerAddr]
            let plan = {
                nodeAddr: peerDownloadInfo.peerWallet,
                maxReadBlockNum: this.baseInfo.fileBlockCount,
                haveReadBlockNum: 0,
            }
            readPlan.push(plan)
        }
        const readPledgeRet = await sdk.globalSdk().ontFs.fileReadPledge(this.option.fileHash, readPlan).catch((err) => {
            console.log(`read file pledge err: ${err.toString()}`)
            throw err
        })
        console.log('readPledgeRet', readPledgeRet)
        const readPledge = await sdk.globalSdk().ontFs.getFileReadPledge(this.option.fileHash,
            sdk.globalSdk().account.address).catch((err) => {
                console.log(`contract interface FileReadPledge called failed`)
                throw err
            })
        console.log("readPledge", readPledge)
        this.baseInfo.readPlanTx = readPledgeRet
        this.baseInfo.progress = Download_FsReadPledge
    }

    async downloadBlockFlightsFromPeer(peerNetAddr, peerWalletAddr, blocksReq) {
        console.log(`DownloadBlockFlightsFromPeer(${peerWalletAddr} ${peerNetAddr}) begin, Routine start`)
        const peerTransferInfo = this.transferInfo.blockDownloadInfo[peerNetAddr]
        peerTransferInfo.index = blocksReq[0].Index
        const sessionId = getDownloadSessionId(this.baseInfo.taskID, peerTransferInfo.peerWallet)
        const reqMsg = message.newBlockFlightsReqMsg(this.option.fileHash, sdk.globalSdk().walletAddress(),
            blocksReq, message.BLOCK_FLIGHTS_OP_GET, [message.withSessionId(sessionId)])
        console.log('reqMsg', reqMsg, peerNetAddr)
        const blocksReqM = {}
        for (let req of blocksReq) {
            blocksReqM[keyOfBlockHashAndIndex(req.Hash, req.Index)] = {}
        }
        const resp = await client.httpSendWithRetry(reqMsg, peerNetAddr, 1, 30).catch((err) => {
            console.log(`send download block flights msg err: ${err.toString()}`)
            throw err
        })
        if (!resp || !resp.data) {
            console.log("resp.data", resp.data)
            throw new Error(`receive invalid msg from peer ${peerNetAddr}`)
        }
        const msg = message.decodeMsg(resp.data)
        console.log('send download block flights msg, resp', msg)
        // return
        if (!msg) {
            console.log("resp.data", resp.data)
            throw new Error(`receive invalid msg from peer ${peerNetAddr}`)
        }
        if (!msg.payload || !msg.payload.blocks || !msg.payload.blocks.length) {
            throw new Error(`receive empty block flights of task ${this.baseInfo.taskID}`)
        }
        const blockFlightsMsg = msg.payload
        console.log(`taskID: ${this.baseInfo.taskID}, sessionID: ${blockFlightsMsg.sessionId},` +
            ` receive ${blockFlightsMsg.blocks ? blockFlightsMsg.blocks.length : 0} blocks from peer: ${peerNetAddr}`)
        let blocksResp = []
        for (let blockMsg of blockFlightsMsg.blocks) {
            const blockRespKey = keyOfBlockHashAndIndex(blockMsg.hash, blockMsg.index)
            if (!blocksReqM[blockRespKey]) {
                console.log(`block ${blockMsg.hash}-${blockMsg.index} is not match any request task`)
                throw new Error(`block ${blockRespKey} is not match request task`)
            }
            const block = sdk.globalSdk().fs.encodedToBlockWithCid(blockMsg.data, blockMsg.hash)
            if (!block || block.cid() != blockMsg.hash) {
                console.log(`receive wrong block ${blockMsg.hash}-${blockMsg.index}`)
                throw new Error(`receive wrong block ${blockMsg.hash}-${blockMsg.index}`)
            }
            blocksResp.push({
                hash: blockMsg.hash,
                index: blockMsg.index,
                block: utils.hex2utf8str(blockMsg.data),
                offset: blockMsg.offset,
                paymentId: blockFlightsMsg.payment.paymentId,
                peerAddr: peerNetAddr,
            })
        }
        const blocksRespCount = blocksResp.length
        if (blocksRespCount != blocksReq.length) {
            console.log(`blocksResp is not match request`)
            throw new Error(`blocksRespCount(${blocksRespCount}) is not match blocksReqCount(${blocksReq.length})`)
        }
        let blockHashes = []
        for (let req of reqBlocks) {
            blockHashes.push(req.Hash)
        }
        console.log('blockHashes', blockHashes)
        peerTransferInfo.totalCount += blocksRespCount
        await this.payForBlocks(peerNetAddr, peerWalletAddr, peerTransferInfo.sliceId + peerTransferInfo.totalCount,
            blockHashes, blocksResp[0].paymentId).catch((err) => {
                throw err
            })
        return blocksResp
    }

    async fileDownloadOk(peerNetAddr) {
        const sessionId = getDownloadSessionId(this.baseInfo.taskID, peerNetAddr)
        const fileDownloadOkMsg = message.newFileMsg(this.option.fileHash,
            message.FILE_OP_DOWNLOAD_OK,
            [
                message.withSessionId(sessionId),
                message.withWalletAddress(sdk.globalSdk().walletAddress())
            ])
        await client.httpBroadcast([peerNetAddr], fileDownloadOkMsg, false, null).then(() => { }).catch((err) => {
            console.log(`fileDownloadOk msg P2pBroadcast error`)
        })
    }

    async payForBlocks(peerNetAddr, peerWalletAddr, sliceId, blockHashes, paymentId) {
        const readPledge = await sdk.globalSdk().ontFs.getFileReadPledge(
            this.option.fileHash, sdk.globalSdk().account.address).catch((err) => {
                console.log(`download get read file pledge error: ${err.toString()}`)
                throw err
            })
        console.log(`paying to node peer addr ${peerNetAddr}, wallet addr ${sdk.globalSdk().walletAddress()}` +
            `, sliceId: ${sliceId}`)
        const fileReadSlice = await sdk.globalSdk().ontFs.genFileReadSettleSlice(this.option.fileHash,
            peerWalletAddr, sliceId, readPledge.blockHeight).catch((err) => {
                throw err
            })
        const sliceData = {
            FileHash: utils.str2base64(hexstr2str(fileReadSlice.fileHash)),
            PayFrom: utils.address2bytestr(fileReadSlice.payFrom),
            PayTo: utils.address2bytestr(fileReadSlice.payTo),
            SliceId: fileReadSlice.sliceId,
            PledgeHeight: fileReadSlice.pledgeHeight,
            Sig: utils.hex2base64str(fileReadSlice.sig.serializeHex()),
            PubKey: utils.hex2base64str(fileReadSlice.pubKey.serializeHex()),
        }
        console.log('fileReadSlice', fileReadSlice, fileReadSlice.sig.serializeHex(), fileReadSlice.pubKey.serializeHex())
        console.log('sliceData', sliceData)

        const msg = message.newPaymentMsg(fileReadSlice.payFrom.toBase58(), fileReadSlice.payTo.toBase58(),
            message.PAYMENT_OP_PAY, paymentId, this.option.fileHash, blockHashes, sliceData,
            [message.withWalletAddress(sdk.globalSdk().walletAddress())])
        console.log('payment msg', msg)

        const ret = await client.httpSendWithRetry(msg, peerNetAddr, common.MAX_NETWORK_REQUEST_RETRY,
            common.P2P_REQUEST_WAIT_REPLY_TIMEOUT).catch((err) => {
                console.log(`paymentMsg payment id ${paymentId}, for file: ${this.option.fileHash},` +
                    ` error: ${err.toString()}`)
            })
        if (!ret.data) {
            throw new Error(``)
        }
        console.log(`payment msg response:`, message.decodeMsg(ret.data))
    }

    async combine() {
        let hasCutPrefix = this.transferInfo.combineInfo.hasCutPrefix
        const isFileEncrypted = this.transferInfo.combineInfo.isFileEncrypted
        const file = this.transferInfo.combineInfo.fileStream
        const value = this.transferInfo.blockDownloadNotify.respNotify
        if (value) {
            console.log(`received block ${this.option.fileHash}-${value.hash}-${value.index} from ` +
                `${value.peerAddr}`)
            const block = sdk.globalSdk().fs.encodedToBlockWithCid(value.block, value.hash)
            if (block.cid() != value.hash) {
                console.log(`receive a unmatched hash block ${block.cid()} ${value.hash}`)
                throw new Error(`receive a unmatched hash block ${block.cid()} ${value.hash}`)
            }
            const links = sdk.globalSdk().fs.getBlockLinks(block)
            // const links = []
            if (!links || !links.length) {
                // let data = sdk.globalSdk().fs.getBlockData(block)
                let data = value.block
                console.log("data len 100", data.substr(0, 200))
                if (!isFileEncrypted && !hasCutPrefix && data.length > this.baseInfo.filePrefix.length &&
                    data.substr(0, this.baseInfo.filePrefix.length) == this.baseInfo.filePrefix) {
                    data = data.substr(this.baseInfo.filePrefix.length)
                    hasCutPrefix = true
                    this.transferInfo.combineInfo.hasCutPrefix = true
                    console.log('cut prefix')
                }
                let writeAtPos = value.offset
                if (value.offset > 0 && !isFileEncrypted) {
                    writeAtPos = value.offset - this.baseInfo.filePrefix.length
                }
                console.log(`block ${block.cid()} block-len ${data.length}, offset ${value.offset}` +
                    ` prefix ${this.baseInfo.filePrefix}, pos ${writeAtPos}`)
                fs.writeSync(file, data, writeAtPos)
            }
            console.log(`${this.option.fileHash}-${value.hash}-${value.index} set downloaded`)
        }
        this.transferInfo.combineInfo.combinedBlockNum++
        if (this.transferInfo.combineInfo.combinedBlockNum != this.baseInfo.fileBlockCount) {
            let exitDownloadRoutineCount = 0
            for (let peerDownloadInfo of this.transferInfo.blockDownloadInfo) {
                if (peerDownloadInfo.routineStatus == types.RoutineExit) {
                    exitDownloadRoutineCount += 1
                }
            }
            if (exitDownloadRoutineCount == Object.keys(this.transferInfo.blockDownloadInfo)) {
                throw new Error("[Combine] all download routine exited but blocks is not complete")
            }
            return
        }
        this.baseInfo.progress = Download_FsBlocksDownloadOver
        const fullFilePath = this.transferInfo.combineInfo.fullFilePath
        if (!this.option.decryptPwd || !this.option.decryptPwd || !isFileEncrypted) {
            console.log('fullFilePath', fullFilePath, this.option.outFilePath)
            fs.renameSync(fullFilePath, this.option.outFilePath)
        } else {
            await decryptDownloadedFile(fullFilePath, this.option.decryptPwd, this.option.outFilePath).catch((err) => {
                throw err
            })
        }
    }

}

const newTaskDownload = async (taskID, option, baseInfo, transferInfo) => {
    if (!baseInfo && !transferInfo) {
        try {
            await checkDownloadParams(option)
        } catch (err) {
            throw err
        }
    }

    let taskDownload = new TaskDownload(option)
    if (baseInfo) {
        taskDownload.baseInfo = baseInfo
    } else {
        taskDownload.baseInfo = {
            taskID: taskID,
            progress: Download_AddTask,
        }
    }
    if (taskDownload.baseInfo.status != TaskFinish) {
        taskDownload.baseInfo.status = TaskPause
    }
    if (transferInfo) {
        transferInfo.blockDownloadNotify = {
            finished: {},
            respNotify: {},
        }
        taskDownload.transferInfo = transferInfo
    } else {
        const transferInfo = {}
        transferInfo.blockDownloadInfo = {}
        transferInfo.combineInfo = {}
        transferInfo.blockDownloadNotify = {
            finished: {},
            respNotify: {},
        }
        taskDownload.transferInfo = transferInfo
    }
    return taskDownload
}

const checkDownloadParams = async (to) => {
    if (!to.inOrder) {
        throw new Error("[TaskDownloadOption] checkParams param inOrder should be true")
    }
    if (!to.fileHash || !to.fileHash.length) {
        throw new Error("[TaskDownloadOption] checkParams param fileHash error")
    }
    const fileInfo = await sdk.globalSdk().ontFs.getFileInfo(to.fileHash).catch((err) => {
        throw new Error(`[TaskDownloadOption] checkParams file(hash: ${to.fileHash}) is not exist`)
    })
    if (!fileInfo) {
        throw new Error(`[TaskDownloadOption] checkParams file(hash: ${to.fileHash}) is not exist`)
    }

    const dir = path.dirname(to.outFilePath)
    if (dir == ".") {
        to.outFilePath = path.join(config.DaemonConfig.fsFileRoot, to.outFilePath)
    } else if (!common.pathExisted(dir)) {
        throw new Error(`[TaskDownloadOption] checkParams out file path err: directory ${dir} is not exist`)
    }

    if (common.pathExisted(to.outFilePath)) {
        throw new Error(`out file path err: file ${to.outFilePath} is exist`)
    }
}

const getDownloadSessionId = (taskId, peerAddr) => {
    return `${taskId}_${peerAddr}_download`
}

const createDownloadFile = async (dir, filePath) => {
    if (!fs.existsSync(dir)) {
        await fs.mkdirSync(dir, { recursive: true, mode: 0o766 });
    }
    //     const filePath = './.data/initialized'
    // fs.closeSync(fs.openSync(filePath, 'w'))
    const stream = fs.createWriteStream(filePath, { mode: 0o666 });
    stream.close()
}

const decryptDownloadedFile = async (fullFilePath, decryptPwd, outFilePath) => {
    if (!decryptPwd || !decryptPwd.length) {
        throw new Error(`no decrypt password`)
    }
    // to do test
    const readStream = fs.createReadStream(fullFilePath, { encoding: 'utf8', start: 0, end: utils.PREFIX_LEN });
    const filePrefix = new utils.FilePrefix()
    let prefix = ""
    for await (const chunk of readStream) {
        prefix = chunk
        console.log("read first n prefix :", prefix)
        filePrefix.fromString(prefix)
    }
    readStream.close()
    if (!filePrefix.encrypt) {
        console.log(`file not encrypt`)
        return
    }
    if (!filePrefix.verifyEncryptPassword(decryptPwd)) {
        throw new Error(`wrong password`)
    }

    await sdk.globalSdk().fs.aesDecryptFile(fullFilePath, decryptPwd, outFilePath, prefix.length).catch((err) => {
        throw err
    })
}


const keyOfBlockHashAndIndex = (hash, index) => {
    return `${hash} -${index} `
}

module.exports = {
    newTaskDownload,
    TaskDownload,
}