const utils = require("../utils")
const { CurveLabel, KeyParameters, KeyType, PrivateKey, SignatureScheme, Signature, PublicKey } = require("ontology-ts-sdk").Crypto
const { str2hexstr, reverseHex } = require("ontology-ts-sdk").utils
const { Address } = require("ontology-ts-sdk").Crypto
const Deferred = require("deferred")
const fs = require("fs")
const message = require("../network/message")
const sleep = (ms = 0) => {
    return new Promise(r => setTimeout(r, ms));
}

describe('crypto test', () => {
    test('test address from pubKey', () => {
        const pubKeyHex = "03e55c62375ee6725a0a7c45db4c209aa28ac08aa985dfc634757a8de89a2f6aae"
        const addr = utils.addressFromPubKeyHex(pubKeyHex)
        expect(addr).toEqual('ALZXN8VKuN63xassAUE29SG1vKHTf3WuVF')
    });
    test('test publicKeyMatchAddress', () => {
        const pubKeyHex = "03e55c62375ee6725a0a7c45db4c209aa28ac08aa985dfc634757a8de89a2f6aae"
        const ret = utils.publicKeyMatchAddress(pubKeyHex, "ALZXN8VKuN63xassAUE29SG1vKHTf3WuVF")
        expect(ret).toBeTruthy()
    });

    test('test verify', () => {
        const seed = 'ab80a7ad086249c01e65c4d9bb6ce18de259dcfc218cd49f2455c539e9112ca3';
        const msg = "hello"
        const privateKey = new PrivateKey(seed, KeyType.ECDSA, new KeyParameters(CurveLabel.SECP256R1));
        const encoded = str2hexstr(msg);
        const signature = privateKey.sign(encoded, SignatureScheme.ECDSAwithSHA256);

        const publicKey = privateKey.getPublicKey();
        const result = utils.verify(publicKey.serializeHex(), encoded, signature.serializeHex());
        expect(result).toBeTruthy()
    })

    test('test promise', async () => {
        let closePromise = new Deferred()
        closePromise.promise.then(() => {
            console.log("receive close promise")
        })

        await sleep(3000)
        console.log('closePromise', closePromise.resolve())
        console.log("test promise done")
    })
})

describe('prefix test', () => {
    test('test getPasswordHash', () => {
        let prefix = new utils.FilePrefix()
        prefix.encryptPwd = "hello"
        prefix.encryptSalt = str2hexstr("abcdefgabcdefg1234")
        prefix.encryptPwdLen = prefix.encryptPwd.length
        let hash = prefix.getPasswordHash()
        expect(hash).toEqual("f28c1e9ae3e2fd94247be0a7ebb3b62d8f71f02dba7ef6a083195196b9e69bd0")
    });

    test('test get prefix string', () => {
        let prefix = new utils.FilePrefix()
        let pwd = "1234"
        prefix.encryptPwd = pwd
        prefix.encryptPwdLen = pwd.length
        prefix.version = 1
        prefix.fileSize = 4 * 1024 * 1024 * 1024
        prefix.encrypt = true
        let prefixHex = prefix.string()
        expect(prefixHex).toEqual("010104313233340000000000000000000000000000000000000000000000000000000026ec09abde52fb0d39c9e0649e7fd74940a13ebadb4956b5c43af59176398479000000000100000000000000")
    });

    test('test new prefix from string', () => {
        let str = "01000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000e40100000000000000000000"
        let prefix = new utils.FilePrefix()
        prefix.fromString(str)
        console.log('prefix', prefix)
        expect(prefix.fileSize).toEqual(4 * 1024 * 1024 * 1024)
        expect(prefix.encryptPwd).toEqual('1234')
    });

    test('verify password from file', async () => {
        let prefix = new utils.FilePrefix()
        let pwd = "1234"
        prefix.encryptPwd = pwd
        prefix.encryptPwdLen = pwd.length
        prefix.version = 1
        prefix.fileSize = 4 * 1024 * 1024 * 1024
        prefix.encrypt = true
        let prefixHex = prefix.string()
        const dir = './temp'
        fs.mkdirSync(`${dir}/files/`, { recursive: true, mode: 0o766 })
        const filePath = "./temp/files/a.txt"
        const stream = fs.createWriteStream(filePath, { mode: 0o666 })
        stream.write(prefixHex)
        stream.write("123123")
        stream.close()
        const readStream = fs.createReadStream(filePath, { encoding: 'utf8', start: 0, end: prefixHex.length });
        const filePrefix = new utils.FilePrefix()
        for await (const chunk of readStream) {
            console.log(`${filePath} >>> ${chunk}`);
            if (chunk == prefixHex) {
                console.log("prefix hex equal", prefixHex.length)
                filePrefix.fromString(chunk)
            }
        }
        console.log('filePrefix', filePrefix)
        console.log('encrypt', filePrefix.encrypt)
        console.log("password", filePrefix.verifyEncryptPassword(pwd))
        readStream.close()
    })
    test('hexstr2Bytes', async () => {
        const str = fs.readFileSync("./test/blocks/block1").toString()
        console.log('hex', utils.cryptoHex2base64str(str) == utils.cryptoHex2base64str(str))
    })

    test('base64str2str', async () => {
        const str = `122c0a2401010220647d4ca8c659ce58f5d3078eea3e40bac639863e57256147dad3ba26e50c9a50120018808010122c0a2401010220bb3b6bd47b88cb7ec16cc4304af539a539ceb478bf00f11235a965fca0cc8483120018808010122c0a2401010220bc5f828076c8d5c8d715802094a46f6b1125484fcb5bc5c4ef21ec40616575f2120018a8fd0c`
        // const base64str = utils.hex2base64str(str)
        // console.log('64', base64str)
        // console.log('str', utils.base64str2str(base64str) == str)
        // const str2 = `{
        //     "MessageId": 3299747308398666000, 
        //     "Header": {
        //         "Version": "1", 
        //         "Type": "file", 
        //         "MsgLength": 352
        //     }, 
        //     "Payload": "eyJTZXNzaW9uSWQiOiIyNzc5ODI3NTY5OTc1MjU3MDAwX2h0dHA6Ly8xMjcuMC4wLjE6MzAzMzdfdXBsb2FkIiwiSGFzaCI6IlNrOXlWNDdHeGF6RTZ2UFlXSG1QQ1Y4NVllTThuUHBpVEhzbmpYcmtVOE5aVUNtRCIsIkJsb2NrSGFzaGVzIjpudWxsLCJPcGVyYXRpb24iOjEwMDEsIlByZWZpeCI6bnVsbCwiUGF5aW5mbyI6eyJXYWxsZXRBZGRyZXNzIjoiQUxRNlJXSkVOc0VMRTdBVHV6SHo0emdIcnE1NzN4SnNuTSIsIkxhdGVzdFBheW1lbnQiOm51bGx9LCJUeCI6bnVsbCwiQnJlYWtwb2ludCI6bnVsbCwiVG90YWxCbG9ja0NvdW50IjowLCJDaGFpbkluZm8iOnsiSGVpZ2h0IjoxMDAxN30sIkJMb2Nrc1Jvb3QiOiIifQ==", 
        //     "Sig": null, 
        //     "Error": null
        // }`
        // const msg = message.decodeMsg(str2)
        // console.log('msg', msg)
        console.log('data', Buffer.from(str, 'hex').toString())
    })


})