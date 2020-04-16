const bls = require("./pkg/bls12381")
const blockLength = 4 * 1024
const { num2hexstring, bool2VarByte, str2hexstr, StringReader, hexstr2str } = require("ontology-ts-sdk").utils

class Pdp {
    constructor(_version) {
        this.version = _version
    }
    fileBlockHash(blockData) {
        const dataLen = blockData ? blockData.length : 0
        if (dataLen < blockLength * 2) {
            const remainZeroLen = blockLength * 2 - dataLen
            for (let i = 0; i < remainZeroLen; i = i + 2) {
                blockData += '00'
            }
        }
        const data = blockData.substr(0, blockLength * 2)
        return bls.bls_hash(data)
    }
}

const newPdp = (version) => {
    return new Pdp(version)
}


class FilePdpHashSt {
    constructor(_version, _blockPdpHashes) {
        this.version = _version
        this.blockPdpHashes = _blockPdpHashes
    }

    serialize() {
        let str = num2hexstring(this.version, 8, true)
        const blockCount = this.blockPdpHashes ? this.blockPdpHashes.length : 0
        str += num2hexstring(blockCount, 8, true)
        if (blockCount == 0) {
            return str
        }
        for (let hash of this.blockPdpHashes) {
            str += num2hexstring(hash.length / 2, 8, true)
            str += hash
        }
        return str
    }

}

module.exports = {
    Pdp,
    newPdp,
    FilePdpHashSt
}