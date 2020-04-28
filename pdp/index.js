const { num2hexstring } = require("ontology-ts-sdk").utils
const buf = fetch('./fileunique.wasm');
const utils = require("../utils")
require("./wasm_exec.js")

class Pdp {
    constructor(_version) {
        this.version = _version
    }
    genUniqueIdWithFileBlocks(blocks) {
        if (!Array.isArray(blocks)) {
            return ''
        }
        let allHash = blocks.join('|')
        return fileUnique(allHash)
    }
}

const newPdp = async (version) => {
    const p = new Pdp(version)
    const go = new Go()
    await WebAssembly.instantiate(new Uint8Array(buf), go.importObject).then(async (res) => {
        go.run(res.instance).then((res) => {
        }).catch((err) => {
        })
        await utils.sleep(3000)
    }).catch((err) => {
        console.log('err', err)
    });
    return p
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
    FilePdpHashSt,
    newPdp,
}