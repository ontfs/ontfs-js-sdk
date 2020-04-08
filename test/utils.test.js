const utils = require("../utils")
const { CurveLabel, KeyParameters, KeyType, PrivateKey, SignatureScheme, Signature, PublicKey } = require("ontology-ts-sdk").Crypto
const { str2hexstr } = require("ontology-ts-sdk").utils
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
        let str = "010104313233340000000000000000000000000000000000000000000000000000000026ec09abde52fb0d39c9e0649e7fd74940a13ebadb4956b5c43af59176398479000000000100000000000000"
        let prefix = new utils.FilePrefix()
        prefix.fromString(str)
        expect(prefix.fileSize).toEqual(4 * 1024 * 1024 * 1024)
        expect(prefix.encryptPwd).toEqual('1234')
    });
})