const CalcRootHash = require("./merkle_pdp").CalcRootHash ;
const number2ArrayBuffer = require("../utils").number2ArrayBuffer;
const utils = require("../utils")
const Buffer = require('buffer/').Buffer

class Pdp {
    constructor(_version) {
        this.version = _version
    }
    /**
     * generate a unique id for file
     *
     * @param {Array} blocks: all block hex data array
     * @returns {Uint8Array} a hex string of unique Id
     * @memberof Pdp
     */
    genUniqueIdWithFileBlocks(blocks) {
        if (!Array.isArray(blocks)) {
            return null
        }
        let version = number2ArrayBuffer(1)
        let iVersion = new Uint8Array(version);

        let rootHash = CalcRootHash(blocks)
        let iRootHash = new Uint8Array(rootHash);
        console.log('iRootHash: '+ iRootHash)

        let h = new Uint8Array(8 + iRootHash.length);
        h.set(iVersion, 0);
        h.set(iRootHash, 8);
        console.log('hBuffer: ' + h)
        return h;
    }
}

/**
 * init a pdp service
 *
 * @param {number} version: pdp version, default 1
 * @returns
 */
const newPdp = async (version) => {
    const p = new Pdp(version)
    return p
}

module.exports = {
    Pdp,
    newPdp,
}
