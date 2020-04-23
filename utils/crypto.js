const Crypto = require("ontology-ts-sdk").Crypto
const { hexstr2str, reverseHex } = require("ontology-ts-sdk").utils
const { Address, PublicKey, Signature } = Crypto
// const PublicKey = Crypto.PublicKey
// const Signature = Crypto.Signature
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


const cryptoStr2Hex = (str) => {
    return CryptoJS.enc.Hex.stringify(CryptoJS.enc.Utf8.parse((str)))
}


const base64str2utf8str = (base64str) => {
    return CryptoJS.enc.Base64.parse(base64str).toString(CryptoJS.enc.Utf8)
}

const base64str2str = (base64str) => {
    // return CryptoJS.enc.Base64.parse(base64str).toString(CryptoJS.enc.Utf8)
    return CryptoJS.enc.Base64.parse(base64str).toString()
}

const base64str2hex = (base64str) => {
    return CryptoJS.enc.Base64.parse(base64str).toString(CryptoJS.enc.Hex).toString()
}

const hex2base64str = (hex) => {
    var _data = CryptoJS.enc.Hex.parse(hex);
    var base64_data = _data.toString(CryptoJS.enc.Base64);
    return base64_data
}


const hex2sha256 = (hex) => {
    var message = CryptoJS.enc.Hex.parse(hex);
    return CryptoJS.SHA256(message).toString();
}


const hex2utf8str = (hex) => {
    // var _data = CryptoJS.enc.Hex.parse(hex);
    // var utf8_data = _data.toString(CryptoJS.enc.Utf8);
    // return utf8_data
    return Buffer.from(hex, 'hex').toString()
    // return _data.toString()
}

const hexstr2Bytes = (str) => {
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


const bytes2HexString = (b) => {
    let hexs = "";
    for (let i = 0; i < b.length; i++) {
        let hex = b[i].toString(16);
        if (hex.length == 1) {
            hex = '0' + hex;
        }
        hexs += hex.toLowerCase();
    }
    return hexs;
}


const address2bytestr = (addr) => {
    return hexstr2Bytes(reverseHex(addr.toHexString()))
}


const bytes2address = (bytes) => {
    const hex = bytes2HexString(bytes)
    const addr = new Address(hex)
    return addr
}

const sha256str = (str) => {
    return CryptoJS.SHA256(str).toString()
}

module.exports = {
    verify,
    publicKeyMatchAddress,
    str2base64,
    base64str2str,
    hex2base64str,
    hexstr2Bytes,
    address2bytestr,
    base64str2utf8str,
    hex2utf8str,
    cryptoStr2Hex,
    base64str2hex,
    sha256str,
    hex2sha256,
    bytes2address
}