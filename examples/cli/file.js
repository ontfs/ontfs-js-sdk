const { RpcClient, Account, Wallet, Crypto } = require("ontology-ts-sdk")
const { PrivateKey, Address } = require("ontology-ts-sdk").Crypto
const OntSDK = require("ontology-ts-sdk").SDK
const fs = require("fs")
const path = require("path")
const utils = require("../../utils")
const flags = require("./flags")
const { initTaskManage, globalTaskMgr } = require("../../taskmanage")
const { initSdk, setGlobalSdk, globalSdk } = require("../../sdk")
const types = require("../../types")
const bytes = require("../../common/humanize/bytes")
const config = require("../../config")
const common = require("../../common")


const startSDK = async (argv) => {
    // init config
    const password = argv.password ? argv.password : 'pwd'
    const rpcAddr = argv.rpcAddr ? argv.rpcAddr : 'http://127.0.0.1:20336'
    const walletObj = JSON.parse(fs.readFileSync(path.join(__dirname, "./wallet.dat")).toString())
    const defAccountObj = walletObj.accounts[0]
    const { error, result } = OntSDK.importAccountWithWallet(
        defAccountObj.label,
        defAccountObj.key,
        defAccountObj.address,
        defAccountObj.salt,
        password)
    if (error != 0) {
        console.log('import account failed ', error)
        return false
    }
    const sdkCfg = {
        walletPwd: password,
        chainRpcAddr: rpcAddr,
        gasPrice: 500,
        gasLimit: 4000000,
        pdpVersion: 1
    }
    config.DaemonConfig = {
        fsRepoRoot: "./test/Fs",
        fsFileRoot: "./test/Download",
        fsType: 0
    }
    // init global task manager
    initTaskManage()

    const account = Account.parseJson(result)
    // init global sdk
    const s = await initSdk(sdkCfg, account)
    setGlobalSdk(s)
    await s.start()
    return true
}

const uploadFile = async (argv) => {
    // start sdk
    const success = await startSDK(argv)
    if (!success) {
        console.log('start sdk failed')
        return
    }
    const filePaths = []
    if (argv.filePath != undefined) {
        if (Array.isArray(argv.filePath)) {
            filePaths.push(...argv.filePath)
        } else {
            filePaths.push(argv.filePath)
        }
    }
    const descs = []
    if (argv.desc != undefined) {
        if (Array.isArray(argv.desc)) {
            descs.push(...argv.desc)
        } else {
            descs.push(argv.desc)
        }
    }

    const storeTypes = []
    if (argv.storeType != undefined) {
        if (Array.isArray(argv.storeType)) {
            storeTypes.push(...argv.storeType)
        } else {
            storeTypes.push(argv.storeType)
        }
    }
    const copyNums = []
    if (argv.copyNum != undefined) {
        if (Array.isArray(argv.copyNum)) {
            copyNums.push(...argv.copyNum)
        } else {
            copyNums.push(argv.copyNum)
        }
    }
    const firstPdps = []
    if (argv.firstPdp != undefined) {
        if (Array.isArray(argv.firstPdp)) {
            firstPdps.push(...argv.firstPdp)
        } else {
            firstPdps.push(argv.firstPdp)
        }
    }
    const timeExpireds = []
    if (argv.timeExpired != undefined) {
        if (Array.isArray(argv.timeExpired)) {
            timeExpireds.push(...argv.timeExpired)
        } else {
            timeExpireds.push(argv.timeExpired)
        }
    }
    const encryptPwds = []
    if (argv.encryptPwd != undefined) {
        if (Array.isArray(argv.encryptPwd)) {
            encryptPwds.push(...argv.encryptPwd)
        } else {
            encryptPwds.push(argv.encryptPwd)
        }
    }
    const promises = []
    for (let index in filePaths) {
        const promise = new Promise(async (resolve, reject) => {
            // init upload option
            const option = new types.TaskUploadOption()
            option.filePath = filePaths && filePaths.length && filePaths.length > index ? filePaths[index] : __dirname + "/test.zip"
            option.fileDesc = descs && descs.length && descs.length > index ? descs[index] : "test.zip"
            const stat = fs.statSync(option.filePath)
            option.fileSize = stat.size
            option.storageType = storeTypes && storeTypes.length && storeTypes.length > index ? storeTypes[index] : 1
            option.copyNum = copyNums && copyNums.length && copyNums.length > index ? copyNums[index] : 1
            option.firstPdp = firstPdps && firstPdps.length && firstPdps.length > index ? firstPdps[index] : true
            const nowTimeStamp = parseInt(new Date().getTime() / 1000)
            option.timeExpired = timeExpireds && timeExpireds.length && timeExpireds.length > index ? parseInt(Date.parse(timeExpireds[index]) / 1000) :
                (nowTimeStamp + 86400) // default 1 day
            if (option.timeExpired < nowTimeStamp) {
                console.log(`file time expired less than now ${nowTimeStamp}`)
                resolve()
                return
            }
            const minHour = 4
            if (option.timeExpired < nowTimeStamp + minHour * 60 * 60) {
                console.log(`file time expired less than ${minHour} hours`)
                resolve()
                return
            }
            option.encPassword = encryptPwds && encryptPwds.length && encryptPwds.length > index ? encryptPwds[index] : ""
            console.log('upload option', option)
            // add task
            const taskID = await globalTaskMgr().addTask(option).catch((e) => {
                console.log('e', e)
            })
            console.log('add upload task success, taskID', taskID)
            // poll check if node has store the file commit PDP prove
            while (true) {
                await utils.sleep(1000)
                const task = globalTaskMgr().getUploadTaskByTaskId(taskID)
                if (!task.baseInfo.fileHash) {
                    console.log("task not found", task.baseInfo)
                    continue
                }
                const pdpRecordList = await globalSdk().ontFs.getFilePdpRecordList(task.baseInfo.fileHash).catch((err) => {
                })
                if (pdpRecordList && pdpRecordList.pdpRecords && pdpRecordList.pdpRecords.length) {
                    console.log(`storage node has store the file ${task.baseInfo.fileHash}`, pdpRecordList)
                    break
                } else {
                    console.log(`storage node have not stored the file ${task.baseInfo.fileHash}`)
                }
            }
            console.log('done')
            resolve()
        })
        promises.push(promise)
    }

    await Promise.all(promises).catch((err) => {
        console.log('promise all failed')
    })

    await globalSdk().stop().catch((err) => {
        console.log('stop err', err.toString())
    })
}


const downloadFile = async (argv) => {
    // start sdk
    const success = await startSDK(argv)
    if (!success) {
        console.log('start sdk failed')
        return
    }
    if (!argv.fileHash) {
        console.log('missing file hash')
        return
    }
    const fileHashes = []
    const maxPeerCnts = []
    const outFilePaths = []
    const decryptPwds = []
    if (argv.fileHash != undefined) {
        if (Array.isArray(argv.fileHash)) {
            fileHashes.push(...argv.fileHash)
        } else {
            fileHashes.push(argv.fileHash)
        }
    }
    if (argv.maxPeerCnt != undefined) {
        if (Array.isArray(argv.maxPeerCnt)) {
            maxPeerCnts.push(...argv.maxPeerCnt)
        } else {
            maxPeerCnts.push(argv.maxPeerCnt)
        }
    }
    if (argv.outFilePath != undefined) {
        if (Array.isArray(argv.outFilePath)) {
            outFilePaths.push(...argv.outFilePath)
        } else {
            outFilePaths.push(argv.outFilePath)
        }
    }
    if (argv.decryptPwd != undefined) {
        if (Array.isArray(argv.decryptPwd)) {
            decryptPwds.push(...argv.decryptPwd)
        } else {
            decryptPwds.push(argv.decryptPwd)
        }
    }

    const promises = []
    for (let index in fileHashes) {
        const promise = new Promise(async (resolve, reject) => {
            // init upload option
            const option = new types.TaskDownloadOption()
            const hash = fileHashes[index]
            option.fileHash = hash
            option.inOrder = true
            option.maxPeerCnt = maxPeerCnts && maxPeerCnts.length && maxPeerCnts.length > index ? maxPeerCnts[index] : 10
            option.outFilePath = outFilePaths && outFilePaths.length && outFilePaths.length > index ? outFilePaths[index] : "./" + hash
            option.decryptPwd = decryptPwds && decryptPwds.length && decryptPwds.length > index ? decryptPwds[index] : ''
            console.log('option', option)
            // add task
            const taskID = await globalTaskMgr().addTask(option).catch((e) => {
                console.log('e', e)
            })
            console.log('add download task success, taskID', taskID)
            // poll check if file has downloaded
            while (true) {
                await utils.sleep(1000)
                const task = globalTaskMgr().getDownloadTaskByTaskId(taskID)
                if (task && task.baseInfo.progress == 4) {
                    console.log(`file ${hash} download success`)
                    break
                }
            }
            console.log(`done`)
            resolve()
        })
        promises.push(promise)
    }
    await Promise.all(promises).catch((err) => {
        console.log('promise all err', err)
    })
    await globalSdk().stop().catch((err) => {
        console.log('stop err', err.toString())
    })
}


const deleteFile = async (argv) => {
    // start sdk
    const success = await startSDK(argv)
    if (!success) {
        console.log('start sdk failed')
        return
    }
    const tx = await globalSdk().ontFs.deleteFiles([argv.fileHash])
    console.log('delete file tx: ', tx)
    const events = await globalSdk().chain.getSmartCodeEvent(tx)
    if (events && events.result.Notify && events.result.Notify.length) {
        for (let n of events.result.Notify) {
            if (n.ContractAddress == common.ONTFS_CONTRACT_ADDRESS) {
                console.log(utils.base64str2utf8str(n.States))
            }
        }
    } else {
        console.log(`delete file ${argv.fileHash} success`)
    }
    await globalSdk().stop().catch((err) => {
        console.log('stop err', err.toString())
    })
}

const getFileList = async (argv) => {
    // start sdk
    const success = await startSDK(argv)
    if (!success) {
        console.log('start sdk failed')
        return
    }
    const files = await globalSdk().ontFs.getFileList()

    if (files.filesH) {
        let printList = []
        for (let item of files.filesH) {
            printList.push(item.fHash)
        }
        console.log(printList)
    } else {
        console.log('files', files)
    }

    await globalSdk().stop().catch((err) => {
        console.log('stop err', err.toString())
    })
}

const decryptFile = async (argv) => {
    // start sdk
    const success = await startSDK(argv)
    if (!success) {
        console.log('start sdk failed')
        return
    }
    try {
        await globalSdk().decryptDownloadedFile(argv.filePath, argv.decryptPwd, argv.outFilePath)
        console.log(`decrypt ${argv.filePath} success`)
    } catch (err) {
        console.log(`decrypt  ${argv.filePath} file failed ${err.toString()}`)
    }
}



const renewFile = async (argv) => {
    // start sdk
    const success = await startSDK(argv)
    if (!success) {
        console.log('start sdk failed')
        return
    }
    const fileInfo = await globalSdk().ontFs.getFileInfo(argv.fileHash).catch((err) => { })
    if (!fileInfo) {
        console.log(`file ${argv.fileHash} not exist`)
        await globalSdk().stop().catch((err) => {
            console.log('stop err', err.toString())
        })
        return
    }
    const tx = await globalSdk().ontFs.renewFile([{
        fileHash: argv.fileHash,
        renewTime: fileInfo.timeExpired + argv.addTime,
    }])
    console.log('renew file tx: ', tx)
    const events = await globalSdk().chain.getSmartCodeEvent(tx)
    if (events && events.result.Notify && events.result.Notify.length) {
        for (let n of events.result.Notify) {
            if (n.ContractAddress == common.ONTFS_CONTRACT_ADDRESS) {
                console.log(utils.base64str2utf8str(n.States))
            }
        }
    } else {
        console.log(`renew file ${argv.fileHash} success`)
    }
    await globalSdk().stop().catch((err) => {
        console.log('stop err', err.toString())
    })
}


const getFileInfo = async (argv) => {
    // start sdk
    const success = await startSDK(argv)
    if (!success) {
        console.log('start sdk failed')
        return
    }
    const fileInfo = await globalSdk().getFileInfo(argv.fileHash).catch((err) => { })
    if (!fileInfo) {
        console.log(`file ${argv.fileHash} not exist`)
        await globalSdk().stop().catch((err) => {
            console.log('stop err', err.toString())
        })
        return
    } else {
        fileInfo.timeStart = common.formatDateLocaleString(fileInfo.timeStart)
        fileInfo.timeExpired = common.formatDateLocaleString(fileInfo.timeExpired)
        fileInfo.pdpParam = Buffer.from(fileInfo.pdpParam).toString('base64')
        console.log(fileInfo)
    }
    await globalSdk().stop().catch((err) => {
        console.log('stop err', err.toString())
    })
}


const changeFileOwner = async (argv) => {
    // start sdk
    const success = await startSDK(argv)
    if (!success) {
        console.log('start sdk failed')
        return
    }
    const tx = await globalSdk().changeOwner(argv.fileHash, new Address(argv.walletAddr)).catch((err) => { })
    const events = await globalSdk().chain.getSmartCodeEvent(tx)
    if (events && events.result.Notify && events.result.Notify.length) {
        for (let n of events.result.Notify) {
            if (n.ContractAddress == common.ONTFS_CONTRACT_ADDRESS) {
                console.log(utils.base64str2utf8str(n.States))
            }
        }
    } else {
        console.log(`change file owner ${argv.fileHash} success`)
    }
    await globalSdk().stop().catch((err) => {
        console.log('stop err', err.toString())
    })
}



const getFileInfoReadPledge = async (argv) => {
    // start sdk
    const success = await startSDK(argv)
    if (!success) {
        console.log('start sdk failed')
        return
    }
    const readPledge = await globalSdk().getFileReadPledge(argv.fileHash).catch((err) => { })
    if (!readPledge) {
        console.log(`file ${argv.fileHash} readPledge  not exist`)
        await globalSdk().stop().catch((err) => {
            console.log('stop err', err.toString())
        })
        return
    } else {
        console.log(readPledge)
    }
    await globalSdk().stop().catch((err) => {
        console.log('stop err', err.toString())
    })
}

const pledge = async (argv) => {
    // start sdk
    const success = await startSDK(argv)
    if (!success) {
        console.log('start sdk failed')
        return
    }

    let readPlan = []
    let plan = {
        nodeAddr: argv.walletAddr,
        maxReadBlockNum: argv.maxReadBlockNum,
        haveReadBlockNum: argv.haveReadBlockNum,
    }
    readPlan.push(plan)
    const tx = await sdk.globalSdk().ontFs.fileReadPledge(argv.fileHash, readPlan).catch((err) => {
        console.log(`read file pledge err: ${err.toString()}`)
        throw err
    })
    const events = await globalSdk().chain.getSmartCodeEvent(tx)
    if (events && events.result.Notify && events.result.Notify.length) {
        for (let n of events.result.Notify) {
            if (n.ContractAddress == common.ONTFS_CONTRACT_ADDRESS) {
                console.log(utils.base64str2utf8str(n.States))
            }
        }
    } else {
        console.log(`set file read pledge ${argv.fileHash} success`)
    }
    await globalSdk().stop().catch((err) => {
        console.log('stop err', err.toString())
    })
}


const cancelFileReadPledge = async (argv) => {
    // start sdk
    const success = await startSDK(argv)
    if (!success) {
        console.log('start sdk failed')
        return
    }
    const tx = await globalSdk().ontFs.cancelFileRead(argv.fileHash, globalSdk().ontFs.walletAddr).catch((err) => { })
    const events = await globalSdk().chain.getSmartCodeEvent(tx)
    if (events && events.result.Notify && events.result.Notify.length) {
        for (let n of events.result.Notify) {
            if (n.ContractAddress == common.ONTFS_CONTRACT_ADDRESS) {
                console.log(utils.base64str2utf8str(n.States))
            }
        }
    } else {
        console.log(`cancel file readPledge ${argv.fileHash} success`)
    }
    await globalSdk().stop().catch((err) => {
        console.log('stop err', err.toString())
    })
}



const getFilePdpInfoList = async (argv) => {
    // start sdk
    const success = await startSDK(argv)
    if (!success) {
        console.log('start sdk failed')
        return
    }
    const pdpInfos = await globalSdk().getFilePdpInfoList(argv.fileHash).catch((err) => { })
    if (!pdpInfos) {
        console.log(`${argv.fileHash} pdp records not exist`)
    } else {
        console.log(pdpInfos)
    }
    await globalSdk().stop().catch((err) => {
        console.log('stop err', err.toString())
    })
}


const challenge = async (argv) => {
    // start sdk
    const success = await startSDK(argv)
    if (!success) {
        console.log('start sdk failed')
        return
    }
    const tx = await globalSdk().ontFs.challenge(argv.fileHash, argv.nodeAddr).catch((err) => { })
    const events = await globalSdk().chain.getSmartCodeEvent(tx)
    if (events && events.result.Notify && events.result.Notify.length) {
        for (let n of events.result.Notify) {
            if (n.ContractAddress == common.ONTFS_CONTRACT_ADDRESS) {
                console.log(utils.base64str2utf8str(n.States))
            }
        }
    } else {
        console.log(`challenge file  ${argv.fileHash} success`)
    }
    await globalSdk().stop().catch((err) => {
        console.log('stop err', err.toString())
    })
}


const judge = async (argv) => {
    // start sdk
    const success = await startSDK(argv)
    if (!success) {
        console.log('start sdk failed')
        return
    }
    const tx = await globalSdk().ontFs.judge(argv.fileHash, argv.nodeAddr).catch((err) => { })
    const events = await globalSdk().chain.getSmartCodeEvent(tx)
    if (events && events.result.Notify && events.result.Notify.length) {
        for (let n of events.result.Notify) {
            if (n.ContractAddress == common.ONTFS_CONTRACT_ADDRESS) {
                console.log(utils.base64str2utf8str(n.States))
            }
        }
    } else {
        console.log(`judge file  ${argv.fileHash} success`)
    }
    await globalSdk().stop().catch((err) => {
        console.log('stop err', err.toString())
    })
}


const getChallengeList = async (argv) => {
    // start sdk
    const success = await startSDK(argv)
    if (!success) {
        console.log('start sdk failed')
        return
    }
    const list = await globalSdk().getChallengeList(argv.fileHash).catch((err) => { })
    if (!list) {
        console.log(`${argv.fileHash} challenge not exist`)
    } else {
        console.log(list)
    }
    await globalSdk().stop().catch((err) => {
        console.log('stop err', err.toString())
    })
}


const uploadFileCmd = {
    command: 'upload',
    desc: 'upload a file',
    builder: (yargs) => yargs
        .option(flags.filePath.name, flags.filePath)
        .option(flags.fileDesc.name, flags.fileDesc)
        .option(flags.firstPdp.name, flags.firstPdp)
        .option(flags.timeExpired.name, flags.timeExpired)
        .option(flags.copyNum.name, flags.copyNum)
        .option(flags.storeType.name, flags.storeType)
        .option(flags.encryptPwd.name, flags.encryptPwd)
    ,
    handler: async (argv) => {
        argv._handled = true
        await uploadFile(argv)
    }
}


const downloadFileCmd = {
    command: 'download',
    desc: 'download a file',
    builder: (yargs) => yargs
        .option(flags.fileHash.name, flags.fileHash)
        // .option(flags.inorder.name, flags.inorder)
        .option(flags.decryptPwd.name, flags.decryptPwd)
        .option(flags.maxPeerCnt.name, flags.maxPeerCnt)
        .option(flags.outFilePath.name, flags.outFilePath)
    ,
    handler: async (argv) => {
        await downloadFile(argv)
        argv._handled = true
    }
}

const deleteFileCmd = {
    command: 'delete',
    desc: 'delete a file',
    builder: (yargs) => yargs
        .option(flags.fileHash.name, flags.fileHash)
    ,
    handler: async (argv) => {
        argv._handled = true
        await deleteFile(argv)
    }
}


const listFileCmd = {
    command: 'list',
    desc: 'list upload files',
    builder: (yargs) => yargs
    ,
    handler: async (argv) => {
        argv._handled = true
        await getFileList(argv)
    }
}



const decryptFileCmd = {
    command: 'decrypt',
    desc: 'decrypt file from local encrypted file',
    builder: (yargs) => yargs
        .option(flags.filePath.name, flags.filePath)
        .option(flags.outFilePath.name, flags.outFilePath)
        .option(flags.decryptPwd.name, flags.decryptPwd)
    ,
    handler: async (argv) => {
        argv._handled = true
        await decryptFile(argv)
    }
}



const renewFileCmd = {
    command: 'renew',
    desc: 'renew file on ontology file system',
    builder: (yargs) => yargs
        .option(flags.fileHash.name, flags.fileHash)
        .option(flags.addTime.name, flags.addTime)
    ,
    handler: async (argv) => {
        argv._handled = true
        await renewFile(argv)
    }
}



const getFileInfoCmd = {
    command: 'info',
    desc: 'get file info',
    builder: (yargs) => yargs
        .option(flags.fileHash.name, flags.fileHash)
    ,
    handler: async (argv) => {
        argv._handled = true
        await getFileInfo(argv)
    }
}



const changeFileOwnerCmd = {
    command: 'changeowner',
    desc: 'change file owner on ontology file system',
    builder: (yargs) => yargs
        .option(flags.fileHash.name, flags.fileHash)
        .option(flags.walletAddr.name, flags.walletAddr)
    ,
    handler: async (argv) => {
        argv._handled = true
        await changeFileOwner(argv)
    }
}



const pledgeFileCmd = {
    command: 'pledge',
    desc: 'file read pledge on ontology file system',
    builder: (yargs) => yargs
        .option(flags.fileHash.name, flags.fileHash)
        .option(flags.walletAddr.name, flags.walletAddr)
        .option(flags.maxReadBlockNum.name, flags.maxReadBlockNum)
        .option(flags.haveReadBlockNum.name, flags.haveReadBlockNum)
    ,
    handler: async (argv) => {
        argv._handled = true
        await pledge(argv)
    }
}



const getFileReadPledgeCmd = {
    command: 'getfilereadpledge',
    desc: 'get file read pledge on ontology file system',
    builder: (yargs) => yargs
        .option(flags.fileHash.name, flags.fileHash)
    ,
    handler: async (argv) => {
        argv._handled = true
        await getFileInfoReadPledge(argv)
    }
}



const cancelReadPledgeFileCmd = {
    command: 'cancelreadpledge',
    desc: 'cancel file read pledge on ontology file system',
    builder: (yargs) => yargs
        .option(flags.fileHash.name, flags.fileHash)
    ,
    handler: async (argv) => {
        argv._handled = true
        await cancelFileReadPledge(argv)
    }
}



const getFilePdpInfoCmd = {
    command: 'pdpinfo',
    desc: 'get file pdp info list on ontology file system',
    builder: (yargs) => yargs
        .option(flags.fileHash.name, flags.fileHash)
    ,
    handler: async (argv) => {
        argv._handled = true
        await getFilePdpInfoList(argv)
    }
}



const challengeFileCmd = {
    command: 'challenge',
    desc: 'detects the presence of a specified file on a node',
    builder: (yargs) => yargs
        .option(flags.fileHash.name, flags.fileHash)
        .option(flags.nodeAddr.name, flags.nodeAddr)
    ,
    handler: async (argv) => {
        argv._handled = true
        await challenge(argv)
    }
}



const judgeFileCmd = {
    command: 'judge',
    desc: 'judge the challenge of a specified file on a node',
    builder: (yargs) => yargs
        .option(flags.fileHash.name, flags.fileHash)
        .option(flags.nodeAddr.name, flags.nodeAddr)
    ,
    handler: async (argv) => {
        argv._handled = true
        await judge(argv)
    }
}



const getChallengeListFileCmd = {
    command: 'getChallengeList',
    desc: 'get challenge info list from contract',
    builder: (yargs) => yargs
        .option(flags.fileHash.name, flags.fileHash)
    ,
    handler: async (argv) => {
        argv._handled = true
        await getChallengeList(argv)
    }
}



const fileCmd = {
    command: 'file',
    desc: 'file command',
    builder: (yargs) => yargs
        .command(uploadFileCmd)
        .command(downloadFileCmd)
        .command(decryptFileCmd)
        .command(deleteFileCmd)
        .command(renewFileCmd)
        .command(listFileCmd)
        .command(getFileInfoCmd)
        .command(changeFileOwnerCmd)
        // .command(pledgeFileCmd)
        .command(getFileReadPledgeCmd)
        .command(cancelReadPledgeFileCmd)
        .command(getFilePdpInfoCmd)
        .command(challengeFileCmd)
        .command(judgeFileCmd)
        .command(getChallengeListFileCmd)
    ,
    handler: (argv) => {
        argv._handled = true
    }
}

module.exports = fileCmd