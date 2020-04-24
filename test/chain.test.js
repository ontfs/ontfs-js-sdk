const { RpcClient, Account, Wallet, Crypto } = require("ontology-ts-sdk")
const OntSDK = require("ontology-ts-sdk").SDK
const { PrivateKey, Address } = require("ontology-ts-sdk").Crypto
const fs = require("fs")
const utils = require("../utils")
describe('chain test', () => {
    test('test get block height by tx', async () => {
        const rpc = new RpcClient("http://127.0.0.1:20336")
        const result = await rpc.getBlockHeightByTxHash("43fa5d92fd636ada75d5f74498760a56d687f82a0057c590f2eacdf189781809").catch((e) => {
            console.log("catch", e)
        })
        console.log("result", result)
    })
    test('test import account by wallet', async () => {
        const name = '2'
        const label = '1'
        const wallet = await Wallet.create(name)
        const password = 'pwd'
        const privateKey = Crypto.PrivateKey.random()
        var account = Account.create(privateKey, password, label)
        wallet.addAccount(account)
        const walletObj = JSON.parse(fs.readFileSync("./test/wallet.dat").toString())
        console.log('wallet1', wallet.toWalletFile())
        console.log('wallet2', walletObj)
        // const walletObj = wallet.toWalletFile()
        const defAccountObj = walletObj.accounts[0]
        const defAccountObj2 = wallet.toWalletFile().accounts[0]
        console.log('defAccountObj2.address', typeof defAccountObj2.address)
        const { error, result } = await OntSDK.importAccountWithWallet(
            defAccountObj2.label,
            defAccountObj2.key,
            // defAccountObj.label,
            // defAccountObj.key,
            // defAccountObj.address,
            defAccountObj2.address,
            // defAccountObj.salt,
            defAccountObj2.salt,
            password)
        console.log("error", error, result)
    })

})