const PublicKey = require("ontology-ts-sdk").Crypto.PublicKey
const Address = require("ontology-ts-sdk").Crypto.Address

const addressFromPubKeyHex = (pubKeyHex) => {
    let pubKey = new PublicKey(pubKeyHex)
    let addr = Address.fromPubKey(pubKey)
    return addr.toBase58()
}

const tcpAddrToHTTPAddr = (tcpAddr) => {
    const tcpIndex = tcpAddr.indexOf("tcp")
    if (tcpIndex == -1) {
        return tcpAddr
    }
    tcpAddr = tcpAddr.replace("tcp", "http")
    const portIndex = tcpAddr.lastIndexOf(":")
    if (portIndex == -1) {
        return tcpAddr
    }
    const newAddr = `${tcpAddr.substr(0, portIndex)}:30337`
    return newAddr
}

module.exports = {
    addressFromPubKeyHex,
    tcpAddrToHTTPAddr
}