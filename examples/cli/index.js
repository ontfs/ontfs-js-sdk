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
const createWallet = async (label, password) => {
    const wallet = await Wallet.create('')
    const privateKey = Crypto.PrivateKey.random()
    var account = Account.create(privateKey, password, label)
    wallet.addAccount(account)
    const walletPath = path.join(__dirname, "./wallet.dat")
    fs.writeFileSync(walletPath, JSON.stringify(wallet.toWalletFile()))
    console.log('create wallet success at ', walletPath)
}

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
    // init upload option
    const option = new types.TaskUploadOption()
    option.filePath = argv.filePath || __dirname + "/test.zip"
    option.fileDesc = argv.desc || "test.zip"
    const stat = fs.statSync(option.filePath)
    option.fileSize = stat.size
    option.storageType = argv.storeType != undefined ? argv.storeType : 1
    option.copyNum = argv.copyNum ? argv.copyNum : 1
    option.firstPdp = argv.firstPdp != undefined ? argv.firstPdp : true
    option.pdpInterval = argv.pdpInterval || 600
    option.timeExpired = argv.timeExpired ? parseInt(Date.parse(argv.timeExpired) / 1000) :
        (parseInt(new Date().getTime() / 1000) + 86400) // default 1 day
    option.encPassword = argv.encryptPwd && argv.encryptPwd.length ? argv.encryptPwd : ""
    console.log('option', option)
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
    // init upload option
    const option = new types.TaskDownloadOption()
    option.fileHash = argv.fileHash
    option.inOrder = true
    option.maxPeerCnt = argv.maxPeerCnt ? argv.maxPeerCnt : 10
    option.outFilePath = argv.outFilePath ? argv.outFilePath : "./" + argv.fileHash
    option.decryptPwd = argv.decryptPwd != undefined ? argv.decryptPwd : ''
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
            console.log(`file ${argv.fileHash} download success`)
            break
        }
    }
    console.log('done')
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
    const info = await globalSdk().ontFs.getFileInfo(argv.fileHash).catch((err) => { })
    console.log(`delete file ${info ? 'fail' : 'success'}`)

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
    console.log('files', files)
    await globalSdk().stop().catch((err) => {
        console.log('stop err', err.toString())
    })
}


const getSpace = async (argv) => {
    // start sdk
    const success = await startSDK(argv)
    if (!success) {
        console.log('start sdk failed')
        return
    }
    const space = await globalSdk().ontFs.getSpaceInfo()
    console.log('get space : ', space)
    await globalSdk().stop().catch((err) => {
        console.log('stop err', err.toString())
    })
}

const createSpace = async (argv) => {
    // start sdk
    const success = await startSDK(argv)
    if (!success) {
        console.log('start sdk failed')
        return
    }
    // 10, 1, 600, 1586880000
    var reg = /^\d+$/;
    let spaceVolume = 0
    if (!reg.test(argv.spaceVolume)) {
        spaceVolume = parseInt(bytes.parseBytes(argv.spaceVolume) / 1024)
    } else {
        spaceVolume = argv.spaceVolume
    }
    const tx = await globalSdk().ontFs.createSpace(
        spaceVolume,
        argv.spaceCopyNum,
        argv.pdpInterval,
        parseInt(Date.parse(argv.spaceTimeExpired) / 1000))
    console.log('create space tx: ', tx)
    await globalSdk().stop().catch((err) => {
        console.log('stop err', err.toString())
    })
}


const deleteSpace = async (argv) => {
    // start sdk
    const success = await startSDK(argv)
    if (!success) {
        console.log('start sdk failed')
        return
    }
    const tx = await globalSdk().ontFs.deleteSpace(
    )
    console.log('delete space tx: ', tx)
    await globalSdk().stop().catch((err) => {
        console.log('stop err', err.toString())
    })
}

const createAccountCmd = {
    command: 'create',
    desc: 'create a account',
    builder: (yargs) => yargs
        .option(flags.password.name, flags.password)
        .option(flags.label.name, flags.label),
    handler: async (argv) => {
        argv._handled = true
        await createWallet(argv.label, argv.password)
    }
}


const accountCmd = {
    command: 'account',
    desc: 'account command',
    builder: (yargs) => yargs
        .command(createAccountCmd)
    ,
    handler: (argv) => {
        argv._handled = true
    }
}


const createSpaceCmd = {
    command: 'create',
    desc: 'create a space',
    builder: (yargs) => yargs
        .option(flags.pdpInterval.name, flags.pdpInterval)
        .option(flags.spaceVolume.name, flags.spaceVolume)
        .option(flags.spaceCopyNum.name, flags.spaceCopyNum)
        .option(flags.spaceTimeExpired.name, flags.spaceTimeExpired),
    handler: async (argv) => {
        argv._handled = true
        await createSpace(argv)
    }
}


const getSpaceCmd = {
    command: 'get',
    desc: 'get a space',
    builder: (yargs) => yargs,
    handler: async (argv) => {
        argv._handled = true
        await getSpace(argv)
    }
}



const deleteSpaceCmd = {
    command: 'delete',
    desc: 'delete a space',
    builder: (yargs) => yargs,
    handler: async (argv) => {
        argv._handled = true
        await deleteSpace(argv)
    }
}


const spaceCmd = {
    command: 'space',
    desc: 'space command',
    builder: (yargs) => yargs
        .command(createSpaceCmd)
        .command(getSpaceCmd)
        .command(deleteSpaceCmd)
    ,
    handler: (argv) => {
        argv._handled = true
    }
}


const uploadFileCmd = {
    command: 'upload',
    desc: 'upload a file',
    builder: (yargs) => yargs
        .option(flags.filePath.name, flags.filePath)
        .option(flags.fileDesc.name, flags.fileDesc)
        .option(flags.firstPdp.name, flags.firstPdp)
        .option(flags.pdpInterval.name, flags.pdpInterval)
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
        .option(flags.inorder.name, flags.inorder)
        .option(flags.decryptPwd.name, flags.decryptPwd)
        .option(flags.maxPeerCnt.name, flags.maxPeerCnt)
        .option(flags.outFilePath.name, flags.outFilePath)
    ,
    handler: async (argv) => {
        argv._handled = true
        await downloadFile(argv)
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

const fileCmd = {
    command: 'file',
    desc: 'file command',
    builder: (yargs) => yargs
        .command(uploadFileCmd)
        .command(downloadFileCmd)
        .command(deleteFileCmd)
        .command(listFileCmd)
    ,
    handler: (argv) => {
        argv._handled = true
    }
}

require('yargs')
    .usage('Usage: $0 <cmd> [options]')
    .command(accountCmd)
    .command(spaceCmd)
    .command(fileCmd)
    .option('h', {
        alias: 'help',
        description: 'display help message'
    })
    .help('help').argv

