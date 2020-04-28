const PublicKey = require("ontology-ts-sdk").Crypto.PublicKey
const Address = require("ontology-ts-sdk").Crypto.Address

/**
 * parse a address from public key hex string
 *
 * @param {string} pubKeyHex
 * @returns {string} address base58 string
 */
const addressFromPubKeyHex = (pubKeyHex) => {
    let pubKey = new PublicKey(pubKeyHex)
    let addr = Address.fromPubKey(pubKey)
    return addr.toBase58()
}

/**
 * Deprecated
 *
 * @param {*} oldTcpAddr
 * @param {string} [newPort='30337']
 * @returns
 */
const tcpAddrToHTTPAddr = (oldTcpAddr, newPort = '30337') => {
    const httpIndex = oldTcpAddr.indexOf('http')
    if (httpIndex != -1) {
        return oldTcpAddr
    }
    const tcpIndex = oldTcpAddr.indexOf("tcp")
    if (tcpIndex != -1) {
        oldTcpAddr = oldTcpAddr.replace("tcp", "http")
    } else {
        oldTcpAddr = `http://${oldTcpAddr}`
    }
    const portIndex = oldTcpAddr.lastIndexOf(":")
    if (portIndex == -1) {
        return oldTcpAddr
    }
    const newAddr = `${oldTcpAddr.substr(0, portIndex)}:${newPort}`
    return newAddr
}

module.exports = {
    addressFromPubKeyHex,
}