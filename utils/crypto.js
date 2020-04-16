const Crypto = require("ontology-ts-sdk").Crypto
const { hexstr2str } = require("ontology-ts-sdk").utils
const PublicKey = Crypto.PublicKey
const Signature = Crypto.Signature
const address = require("./address.js")
const CryptoJS = require("crypto-js")

const verify = (pubKey, data, signData) => {
    const publicKey = new PublicKey(pubKey)
    if (!publicKey) {
        throw new Error(`deserialize publick key error`)
    }
    const signature = Signature.deserializeHex(signData)
    if (!signature) {
        throw new Error(`invalid signature data`)
    }
    const result = publicKey.verify(data, signature);
    return result
}

const publicKeyMatchAddress = (pubKey, base58Addr) => {
    let addr = address.addressFromPubKeyHex(pubKey)
    return addr == base58Addr
}

const str2base64 = (str) => {
    return CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse((str)))
}

const base64str2str = (base64str) => {
    return CryptoJS.enc.Base64.parse(base64str).toString(CryptoJS.enc.Utf8)
}

const hex2base64str = (hex) => {
    return str2base64(hexstr2str(hex))
}

module.exports = {
    verify,
    publicKeyMatchAddress,
    str2base64,
    base64str2str,
    hex2base64str,
}