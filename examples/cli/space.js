
const { RpcClient, Account, Wallet, Crypto } = require("ontology-ts-sdk")
const OntSDK = require("ontology-ts-sdk").SDK
const fs = require("fs")
const path = require("path")
const utils = require("../../utils")
const flags = require("./flags")
const { initTaskManage, globalTaskMgr } = require("../../taskmanage")
const { initSdk, setGlobalSdk, globalSdk } = require("../../sdk")
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
const getSpace = async (argv) => {
    // start sdk
    const success = await startSDK(argv)
    if (!success) {
        console.log('start sdk failed')
        return
    }
    const space = await globalSdk().ontFs.getSpaceInfo().catch((err) => {

    })
    if (!space) {
        console.log('space not exist')
    } else {
        console.log('get space : ', space)
    }
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
        parseInt(Date.parse(argv.spaceTimeExpired) / 1000))
    console.log('create space tx: ', tx)
    const events = await globalSdk().chain.getSmartCodeEvent(tx)
    if (events && events.result.Notify && events.result.Notify.length) {
        for (let n of events.result.Notify) {
            if (n.ContractAddress == common.ONTFS_CONTRACT_ADDRESS) {
                console.log(utils.base64str2utf8str(n.States))
            }
        }
    } else {
        console.log(`create space success`)
    }
    await globalSdk().stop().catch((err) => {
        console.log('stop err', err.toString())
    })
}


const updateSpace = async (argv) => {
    // start sdk
    const success = await startSDK(argv)
    if (!success) {
        console.log('start sdk failed')
        return
    }
    var reg = /^\d+$/;
    let spaceVolume = 0
    if (!reg.test(argv.spaceVolume)) {
        spaceVolume = parseInt(bytes.parseBytes(argv.spaceVolume) / 1024)
    } else {
        spaceVolume = argv.spaceVolume
    }
    const newTimeExpired = parseInt(Date.parse(argv.spaceTimeExpired) / 1000)
    const tx = await globalSdk().ontFs.updateSpace(
        spaceVolume,
        newTimeExpired)
    console.log('update space tx: ', tx)
    const events = await globalSdk().chain.getSmartCodeEvent(tx)
    if (events && events.result.Notify && events.result.Notify.length) {
        for (let n of events.result.Notify) {
            if (n.ContractAddress == common.ONTFS_CONTRACT_ADDRESS) {
                console.log(utils.base64str2utf8str(n.States))
            }
        }
    } else {
        console.log(`update space success`)
    }
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


const createSpaceCmd = {
    command: 'create',
    desc: 'create a space',
    builder: (yargs) => yargs
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


const updateSpaceCmd = {
    command: 'update',
    desc: 'update a space',
    builder: (yargs) => yargs,
    handler: async (argv) => {
        argv._handled = true
        await updateSpace(argv)
    }
}


const spaceCmd = {
    command: 'space',
    desc: 'space command',
    builder: (yargs) => yargs
        .command(createSpaceCmd)
        .command(getSpaceCmd)
        .command(deleteSpaceCmd)
        .command(updateSpaceCmd)
    ,
    handler: (argv) => {
        argv._handled = true
    }
}

module.exports = spaceCmd