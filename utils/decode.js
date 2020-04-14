const { reverseHex } = require("ontology-ts-sdk").utils
const Address = require("ontology-ts-sdk").Crypto.Address

const decodeBool = (sr) => {
    return sr.readBoolean()
}

const decodeVarBytes = (sr) => {
    return sr.readNextBytes()
}

const decodeVarUint = (sr) => {
    const nextBytes = sr.readNextBytes()
    if (nextBytes == '') {
        return 0
    }
    const hex = reverseHex(nextBytes)
    return parseInt(hex, 16)
}

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