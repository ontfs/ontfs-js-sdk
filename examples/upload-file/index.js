const { Account } = require("ontology-ts-sdk")
const OntSDK = require("ontology-ts-sdk").SDK
const { initTaskManage, globalTaskMgr } = require("../../taskmanage")
const { initSdk, setGlobalSdk, globalSdk } = require("../../sdk")
const types = require("../../types")
const utils = require("../../utils")
const config = require("../../config")
const fs = require("fs")
const argv = require('yargs')
    .usage('Usage: $0 <cmd> [options]')
    .option('f', {
        string: true,
        description: '`<path>` of file to be uploaded',
        alias: 'filePath'
    })
    .option('n', {
        string: true,
        description: 'file description',
        alias: 'fileDesc'
    })
    .option('t', {
        string: true,
        description: `expired time, example format :\n "2020-11-12 14:20:53"`,
        alias: 'timeExpired'
    })
    .option('c', {
        number: true,
        description: `copy Number of file storage`,
        alias: 'copyNum'
    })
    .option('p', {
        string: true,
        description: `encrypt file password`,
        alias: 'encryptPwd'
    })
    .option('fp', {
        boolean: true,
        description: `ontFs server need commit first pdp or not, \nif not, client can download file earlier,\n default: true`,
        alias: 'firstPdp',
        default: true,
    })
    .option('st', {
        number: true,
        description: `store type, 0 means space tenant model, 1 means file model`,
        alias: 'storeType'
    })
    .option('i', {
        number: true,
        description: `file pdp interval`,
        alias: 'pdpInterval'
    })
    .option('h', {
        alias: 'help',
        description: 'display help message'
    })
    .help('help').argv

const startSDK = async () => {
    // init config
    const wif = "KxYkAszCkUhfnx2goy5wxSiUrbMcCFgjK87dgAvDxnwiq7hKymNL"
    const label = 'pwd'
    const password = 'pwd'
    const rpcAddr = 'http://127.0.0.1:20336'
    const sdkCfg = {
        walletPwd: password,
        chainRpcAddr: rpcAddr,
        gasPrice: 500,
        gasLimit: 40000,
        pdpVersion: 1
    }
    config.DaemonConfig = {
        fsRepoRoot: "./test/Fs",
        fsFileRoot: "./test/Download",
        fsType: 0
    }
    // init global task manager
    initTaskManage()
    // import account by wif private key
    const { error, result } = await OntSDK.importAccountWithWif(label, wif, password)
    if (error != 0) {
        return false
    }
    const account = Account.parseJson(result)
    // init global sdk
    const s = await initSdk(sdkCfg, account)
    setGlobalSdk(s)
    return true
}

const main = async () => {
    // start sdk
    const success = await startSDK()
    if (!success) {
        console.log('start sdk failed')
        return
    }
    // init upload option
    const option = new types.TaskUploadOption()
    option.filePath = argv.filePath || __dirname + "/test.zip"
    option.fileDesc = argv.fileDesc || "test.zip"
    const stat = fs.statSync(option.filePath)
    option.fileSize = stat.size
    option.storageType = argv.storageType ? argv.storageType : 1
    option.copyNum = argv.copyNum ? argv.copyNum : 1
    option.firstPdp = argv.firstPdp != undefined ? argv.firstPdp : true
    option.pdpInterval = argv.pdpInterval || 600
    option.timeExpired = argv.timeExpired ? parseInt(Date.parse(argv.timeExpired) / 1000) :
        (parseInt(new Date().getTime() / 1000) + 86400) // default 1 day
    option.encPassword = argv.encPassword || ""
    console.log('option', option, stat.size, argv.firstPdp)
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
}

main()
