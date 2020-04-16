const { initTaskManage, GlobalTaskMgr } = require("../taskmanage")
const OntSDK = require("ontology-ts-sdk").SDK
const { initSdk, SetGlobalSdk, GlobalSdk } = require("../sdk")
// var { GlobalTaskMgr } = require("../taskmanage")
const types = require("../types")
const utils = require("../utils")
const config = require("../config")
const { Account } = require("ontology-ts-sdk")
const { Address } = require("ontology-ts-sdk").Crypto
const { hexstr2str, str2ab, str2hexstr } = require("ontology-ts-sdk").utils
const message = require("../network/message")

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
        SetGlobalSdk(s)
        console.log("s.fs", GlobalSdk().fs)
        // const mgr = initTaskManage()
        // GlobalTaskMgr = mgr
        // console.log('taskmanage.GlobalTaskMgr', GlobalTaskMgr, GlobalSdk)
    }
    test('test add task', async () => {
        await init()
        expect(GlobalTaskMgr()).toBeDefined()
        const option = new types.TaskUploadOption()
        option.filePath = "./wallet.dat"
        option.fileDesc = "wallet"
        option.fileSize = 484
        option.storageType = 1
        option.copyNum = 1
        option.firstPdp = true
        option.pdpInterval = 600
        option.timeExpired = 1587139200
        option.encPassword = ""
        option.whiteList = []
        const taskID = await GlobalTaskMgr().addTask(option).catch((e) => {
            console.log('e', e)
        })
        expect(taskID).toBeDefined()
        console.log('add task success, taskID', taskID)
        while (true) {
            await utils.sleep(1000)
        }
    }, testTimeout);


    const Hexstring2Bytes = (str) => {
        let pos = 0;
        let len = str.length;
        if (len % 2 != 0) {
            return null;
        }
        len /= 2;
        let hexA = new Array();
        for (let i = 0; i < len; i++) {
            let s = str.substr(pos, 2);
            let v = parseInt(s, 16);
            hexA.push(v);
            pos += 2;
        }
        return hexA;
    }

    test('test encode/decode msg', () => {
        const msg1 = `{
            "Hash": "SeNKDywBHnxxmyVht97oFZZEahteCuNMDS8RbBBzmLugjYAy",
            "Operation": 1000,
            "BlockHashes": [
                "SeNKDywBHnxxmyVht97oFZZEahteCuNMDS8RbBBzmLugjYAy"
            ],
            "Prefix": "MDEwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDBlNDAxMDAwMDAwMDAwMDAwMDAwMDAwMDA=",
            "Payinfo": {
                "WalletAddress": "ALZXN8VKuN63xassAUE29SG1vKHTf3WuVF"
            },
            "Tx": {
                "Height": 21167,
                "Hash": "43fa5d92fd636ada75d5f74498760a56d687f82a0057c590f2eacdf189781809"
            }
        }`

        const msg2 = `{
            "MessageId": 10645522441420474711,
            "Header": {
                "Version": "1",
                "Type": "file",
                "MsgLength": 303
            },
            "Payload": "eyJTZXNzaW9uSWQiOiIiLCJIYXNoIjoiU2VOS0R5d0JIbnh4bXlWaHQ5N29GWlpFYWh0ZUN1Tk1EUzhSYkJCem1MdWdqWUF5IiwiQmxvY2tIYXNoZXMiOm51bGwsIk9wZXJhdGlvbiI6MTAwMSwiUHJlZml4IjpudWxsLCJQYXlpbmZvIjp7IldhbGxldEFkZHJlc3MiOiJBTFE2UldKRU5zRUxFN0FUdXpIejR6Z0hycTU3M3hKc25NIiwiTGF0ZXN0UGF5bWVudCI6bnVsbH0sIlR4IjpudWxsLCJCcmVha3BvaW50IjpudWxsLCJUb3RhbEJsb2NrQ291bnQiOjAsIkNoYWluSW5mbyI6eyJIZWlnaHQiOjIzNjE5fSwiQkxvY2tzUm9vdCI6IiJ9",
            "Sig": null,
            "Error": null
        }`

        console.log("encoded", message.encodeFileMsg(msg1))
        console.log("decoded", message.decodeFileMsg(msg2))
    })


    test('test pack msg', () => {
        const msg1 = message.newFileMsg("SeNKDywBHnxxmyVht97oFZZEahteCuNMDS8RbBBzmLugjYAy", 1000,
            [
                message.withSessionId("123"),
                message.withWalletAddress("456"),
                message.withBlockHashes(["SeNKDywBHnxxmyVht97oFZZEahteCuNMDS8RbBBzmLugjYAy"]),
                message.withPrefix("10"),
                message.withTxHeight(10),
                message.withTxHash("!23123")
            ])
        console.log(msg1)
    })


})
