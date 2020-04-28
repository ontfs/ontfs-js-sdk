const { reverseHex } = require("ontology-ts-sdk").utils
const Address = require("ontology-ts-sdk").Crypto.Address

/**
 * decode bool value from StringReader
 *
 * @param {StringReader} sr
 * @returns {boolean}
 */
const decodeBool = (sr) => {
    return sr.readBoolean()
}

/**
 * decode string value from StringReader
 *
 * @param {StringReader} sr
 * @returns {string}
 */
const decodeVarBytes = (sr) => {
    return sr.readNextBytes()
}

/**
 * decode number value from StringReader
 *
 * @param {StringReader} sr
 * @returns {number}
 */
const decodeVarUint = (sr) => {
    const nextBytes = sr.readNextBytes()
    if (nextBytes == '') {
        return 0
    }
    const hex = reverseHex(nextBytes)
    return parseInt(hex, 16)
}

/**
 * decode Address value from StringReader
 *
 * @param {StringReader} sr
 * @returns {Address}
 */
const decodeAddress = (sr) => {
    const nextBytes = sr.readNextBytes()
    if (nextBytes == '') {
        return ''
    }
    const addr = new Address(nextBytes)
    return addr
}


module.exports = {
    decodeBool,
    decodeVarBytes,
    decodeVarUint,
    decodeAddress,
}