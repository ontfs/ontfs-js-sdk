const { Account } = require("ontology-ts-sdk")
const OntSDK = require("ontology-ts-sdk").SDK
const { initTaskManage, globalTaskMgr } = require("../../taskmanage")
const { initSdk, setGlobalSdk, globalSdk } = require("../../sdk")
const types = require("../../types")
const utils = require("../../utils")
const config = require("../../config")
const argv = require('yargs')
    .usage('Usage: $0 <cmd> [options]')
    .option('f', {
        string: true,
        description: '`<hash>` of file to be delete',
        alias: 'fileHash'
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
    await s.start()
    return true
}

const main = async () => {
    // start sdk
    const success = await startSDK()
    if (!success) {
        console.log('start sdk failed')
        return
    }
    if (!argv.fileHash) {
        return
    }
    const tx = await globalSdk().ontFs.deleteFiles([argv.fileHash])
    console.log('delete file tx: ', tx)
    globalSdk().stop()
}

main()
