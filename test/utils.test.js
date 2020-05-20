const utils = require("../utils")
const { CurveLabel, KeyParameters, KeyType, PrivateKey, SignatureScheme, Signature, PublicKey } = require("ontology-ts-sdk").Crypto
const { str2hexstr, reverseHex } = require("ontology-ts-sdk").utils
// const { serializeVarUint } = require("ontology-ts-sdk/fs/utils")
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
        // prefix.encrypt = false
        prefix.encrypt = true
        const genRanHex = size => [...Array(size)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
        prefix.encryptSalt = genRanHex(32)
        let prefixHex = prefix.string()
        console.log('encryptSalt', prefix.encryptSalt)
        console.log('prefixHex', prefixHex)
        // expect(prefixHex).toEqual("010104313233340000000000000000000000000000000000000000000000000000000026ec09abde52fb0d39c9e0649e7fd74940a13ebadb4956b5c43af59176398479000000000100000000000000")
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
        prefix.encryptSalt = utils.randomHex(16)
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
    const CryptoJS = require("crypto-js")

    test('base64str2str', async () => {
        const base64str = `CooFCAISggUwMTAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMGU0MDEwMDAwMDAwMDAwMDAwMDAwMDAwMHsibmFtZSI6Ik15V2FsbGV0IiwidmVyc2lvbiI6IjEuMSIsInNjcnlwdCI6eyJwIjo4LCJuIjoxNjM4NCwiciI6OCwiZGtMZW4iOjY0fSwiYWNjb3VudHMiOlt7ImFkZHJlc3MiOiJBTFpYTjhWS3VONjN4YXNzQVVFMjlTRzF2S0hUZjNXdVZGIiwiZW5jLWFsZyI6ImFlcy0yNTYtZ2NtIiwia2V5IjoiM0dFZ29IUmV1ZU9uUTdoSW01dlMwdlFxL3RnLzI3NjA2WU1obVlyU1kyN3g1VGVmb1FScVNualB3dDc4WFZyTSIsImFsZ29yaXRobSI6IkVDRFNBIiwic2FsdCI6IkxnV3JYYkpPTDhOOURSano0cm9kb2c9PSIsInBhcmFtZXRlcnMiOnsiY3VydmUiOiJQLTI1NiJ9LCJsYWJlbCI6InB3ZCIsInB1YmxpY0tleSI6IjAzZTU1YzYyMzc1ZWU2NzI1YTBhN2M0NWRiNGMyMDlhYTI4YWMwOGFhOTg1ZGZjNjM0NzU3YThkZTg5YTJmNmFhZSIsInNpZ25hdHVyZVNjaGVtZSI6IlNIQTI1NndpdGhFQ0RTQSIsImlzRGVmYXVsdCI6dHJ1ZSwibG9jayI6ZmFsc2V9XX0YggU=`
        console.log('hex', CryptoJS.enc.Base64.parse(base64str).toString(CryptoJS.enc.Hex).toString())
    })

    test('address2bytestr', async () => {
        const addr = new Address('ALZXN8VKuN63xassAUE29SG1vKHTf3WuVF')
        console.log('bytes', utils.address2bytestr(addr))
    })

    test('serializeVarUint', async () => {

        for (let i = 0; i < 36; i++) {
            const value = 1 << i
            console.log(`2 ^ ${i} = ${value - 1} ${serializeVarUint(value - 1)}`)
            console.log(`2 ^ ${i} = ${value} ${serializeVarUint(value)}`)
            console.log(`2 ^ ${i} = ${value + 1} ${serializeVarUint(value + 1)} `)
        }
    })

    test('verifyEncryptPassword', async () => {
        const filePrefix = new utils.FilePrefix()
        filePrefix.fromString("010104000000000000000000000000000000008c35ed35906bec37e202878b4c276bdcd49394896b0e0fd04df6118be2bb350244ddaf85686fe3bce68de7845363ebbd000000000100000000000000")
        console.log('filePrefix', filePrefix)
        console.log('encrypt', filePrefix.encrypt)
        console.log("password", filePrefix.verifyEncryptPassword("1234"))
    })



})