const { OntfsContractTxBuilder } = require("ontology-ts-sdk")
const { Address, PublicKey, Signature } = require("ontology-ts-sdk").Crypto
const { StringReader } = require("ontology-ts-sdk").utils
const { FileReadSettleSlice } = require("ontology-ts-sdk").FS
const fs = require("fs")
const OntSDK = require("ontology-ts-sdk").SDK
const { Account } = require("ontology-ts-sdk")

describe('tssdk', () => {
    test('test verify settle slice', async () => {

        let settleSlice = {
            fileHash: "516d556242484353447467736b4a724e534d633775646d687373367a716e37566853417a6273797a65644b745a58",
            payFrom: "AHTP7bg2aJYhTw2nJxBtAQaUk8poJKAW2Z",
            payTo: "ALQ6RWJENsELE7ATuzHz4zgHrq573xJsnM",
            pledgeHeight: 0,
            publicKey: "0314b80ba745f30183480c344e5a4f67521ed3350269ec2fb1aa49f6f710f9a34d",
            signature: "01f4a535eb0beef58ac45f6dd6129db72f450e18f9e2d3d1d2fff48d7f52bd802677c38a44b9286ed8cce602948cc2e4ec1e8f7b59fd7d39306c0bff023f1cc4d0",
            sliceId: 82,
        }
        console.log('settleSlice.payFrom, settleSlice.payTo', settleSlice.payFrom, settleSlice.payTo)
        const ok = OntfsContractTxBuilder.verifyFileReadSettleSlice(settleSlice)
        console.log('verify', settleSlice, ok)
    })

    test('simple verify', async () => {
        const walletStr = fs.readFileSync("./test/wallet.dat").toString()
        const walletObj = JSON.parse(walletStr.trim())
        const defAccountObj = walletObj.accounts[0]
        const { error, result } = OntSDK.importAccountWithWallet(
            defAccountObj.label,
            defAccountObj.key,
            defAccountObj.address,
            defAccountObj.salt,
            "pwd")
        if (error != 0) {
            console.log('import account failed ', error)
            return
        }

        const account = Account.parseJson(result)
        console.log('account', account)
        let settleSlice = {
            fileHash: "QmUbBHCSDtgskJrNSMc7udmhss6zqn7VhSAzbsyzedKtZX",
            payFrom: "AHTP7bg2aJYhTw2nJxBtAQaUk8poJKAW2Z",
            payTo: "ALQ6RWJENsELE7ATuzHz4zgHrq573xJsnM",
            pledgeHeight: 0,
            publicKey: "0314b80ba745f30183480c344e5a4f67521ed3350269ec2fb1aa49f6f710f9a34d",
            // signature: "01f4a535eb0beef58ac45f6dd6129db72f450e18f9e2d3d1d2fff48d7f52bd802677c38a44b9286ed8cce602948cc2e4ec1e8f7b59fd7d39306c0bff023f1cc4d0",
            sliceId: 82,
        }
        const ss = new FileReadSettleSlice(settleSlice.fileHash, new Address(settleSlice.payFrom), new Address(settleSlice.payTo), settleSlice.sliceId, settleSlice.pledgeHeight)
        console.log('info', ss.serializeHex())
        const privateKey = account.exportPrivateKey('pwd')
        const data = privateKey.sign(ss.serializeHex())
        console.log('sign', data.serializeHex())
        settleSlice.signature = data.serializeHex()

        let pub = PublicKey.deserializeHex(new StringReader(settleSlice.publicKey))
        let sign = Signature.deserializeHex(settleSlice.signature)
        const ok = pub.verify(ss.serializeHex(), sign)
        console.log('pub', pub)
        console.log('sign', sign)
        console.log('ok', ok)
    })
})