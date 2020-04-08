const Crypto = require("ontology-ts-sdk").Crypto
const PublicKey = Crypto.PublicKey
const Signature = Crypto.Signature
const address = require("./address.js")

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

module.exports = {
    verify,
    publicKeyMatchAddress,
}