const PublicKey = require("ontology-ts-sdk").Crypto.PublicKey
const Address = require("ontology-ts-sdk").Crypto.Address

const addressFromPubKeyHex = (pubKeyHex) => {
    let pubKey = new PublicKey(pubKeyHex)
    let addr = Address.fromPubKey(pubKey)
    return addr.toBase58()
}

module.exports = {
    addressFromPubKeyHex
}