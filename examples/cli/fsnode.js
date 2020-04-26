
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
const getNodeInfoList = async (argv) => {
    // start sdk
    const success = await startSDK(argv)
    if (!success) {
        console.log('start sdk failed')
        return
    }
    const list = await globalSdk().ontFs.getNodeInfoList().catch((err) => {
        console.log('err', err)
    })
    if (!list) {
        console.log('storage node not exist')
    } else {
        for (let nodeInfo of list.nodesInfo) {
            const obj = {
                pledge: nodeInfo.pledge,
                profit: nodeInfo.profit,
                volume: common.formatVolumeStringFromKb(nodeInfo.volume),
                restVol: common.formatVolumeStringFromKb(nodeInfo.restVol),
                serviceTime: common.formatDateLocaleString(new Date(nodeInfo.serviceTime * 1000)),
                nodeAddr: nodeInfo.nodeAddr.toBase58(),
                nodeNetAddr: nodeInfo.nodeNetAddr,
            }
            console.log(obj)
        }
    }
    await globalSdk().stop().catch((err) => {
        console.log('stop err', err.toString())
    })
}



const nodeListCmd = {
    command: 'list',
    desc: 'list all storage nodes',
    builder: (yargs) => yargs,
    handler: async (argv) => {
        argv._handled = true
        await getNodeInfoList(argv)
    }
}

const nodeCmd = {
    command: 'node',
    desc: 'node command',
    builder: (yargs) => yargs
        .command(nodeListCmd)
    ,
    handler: (argv) => {
        argv._handled = true
    }
}

module.exports = nodeCmd