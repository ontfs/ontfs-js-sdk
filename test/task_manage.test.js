/**
 * @jest-environment node
 */
const { initTaskManage, globalTaskMgr } = require("../taskmanage")
const OntSDK = require("ontology-ts-sdk").SDK
const { initSdk, setGlobalSdk } = require("../sdk")
const types = require("../types")
const utils = require("../utils")
const config = require("../config")
const { Account } = require("ontology-ts-sdk")
describe('task manager', () => {
    const wif = "KxYkAszCkUhfnx2goy5wxSiUrbMcCFgjK87dgAvDxnwiq7hKymNL"
    const label = 'pwd'
    const password = 'pwd'
    const rpcAddr = 'http://127.0.0.1:20336'
    const testTimeout = 20 * 1000
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
    const init = async () => {
        initTaskManage()
        const { error, result } = await OntSDK.importAccountWithWif(label, wif, password)
        expect(error).toEqual(0)
        const account = Account.parseJson(result)
        const s = initSdk(sdkCfg, account)
        setGlobalSdk(s)
    }
    test('test add upload task', async () => {
        await init()
        expect(globalTaskMgr()).toBeDefined()
        const option = new types.TaskUploadOption()
        option.filePath = "./test/test.zip"
        option.fileDesc = "test.zip"
        option.fileSize = 736778
        option.storageType = 1
        option.copyNum = 1
        option.firstPdp = true
        option.pdpInterval = 600
        option.timeExpired = 1588089600
        option.encPassword = ""
        option.whiteList = []
        console.log('option', option)
        return
        const taskID = await globalTaskMgr().addTask(option).catch((e) => {
            console.log('e', e)
        })
        expect(taskID).toBeDefined()
        console.log('add upload task success, taskID', taskID)
        while (true) {
            await utils.sleep(1000)
        }
    }, testTimeout);

    test('test add download task', async () => {
        await init()
        expect(globalTaskMgr()).toBeDefined()
        const option = new types.TaskDownloadOption()
        option.fileHash = "Sk9yV47GxazE6vPYWHmPCV85YeM8nPpiTHsnjXrkU8NZUCmD"
        option.inOrder = true
        option.maxPeerCnt = 10
        option.outFilePath = "./test/Download/file"
        option.decryptPwd = ""

        const taskID = await globalTaskMgr().addTask(option).catch((e) => {
            console.log('e', e)
        })
        expect(taskID).toBeDefined()
        console.log('add download task success, taskID', taskID)
        while (true) {
            await utils.sleep(1000)
        }
    }, testTimeout);

    test('test notify process task', async () => {
        let obj = {}

        obj.notify = (block) => {
            console.log('notify block', block)
            return new Promise((resolve, reject) => {
                obj.notifyCh = resolve
                resolve(block)
            })
        }
        obj.f = async () => {
            while (1) {
                const data = await obj.notify()
                console.log('receive data', data)
            }
            console.log("func done")
        }

        obj.f().then((resp) => {
            console.log('then', resp)
        }).catch((err) => {
            console.log('err', err)
        })

        obj.notify("1").then(() => { }).catch(() => { })
        await utils.sleep(20000)

    }, testTimeout);

})
