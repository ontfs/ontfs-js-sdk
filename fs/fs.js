const cid = {}
const { FsService, MAX_PREFIX_LENGTH } = require("./fsservice")
const config = require("../config")
const common = require("../common")
const Deferred = require("deferred")
const ffs = require("fs")

class Fs {
    constructor(_fs, _cfg, _closeCh) {
        this.fs = _fs
        this.cfg = _cfg
        this.closeCh = _closeCh
    }

    async start() {
        return await this.fs.initIpld()
    }

    close() {
        this.closeCh.resolve()
        // return this.fs.stop()
    }

    addFile(fileName, filePrefix, encrypt, password) {
        return this.fs.addFile(fileName, filePrefix, encrypt, password)
    }


    getFileAllBlockHashAndOffset(rootHash) {
        return this.fs.getFileAllBlockHashAndOffset(rootHash)
    }

    encodedToBlockWithCid(data, hash) {
        return this.fs.encodedToBlockWithCid(data, hash)
    }

    getBlockLinks(block) {
        const links = this.fs.getBlockLinks(block)
        return links
    }

    blockData(block) {
        return block.rawData()
    }

    getBlockWithHash(hash) {
        return this.fs.getBlockWithHash(hash)
    }

    getBlockData(block) {
        return this.fs.getBlockData(block)
    }

    getBlock(hash) {
        const c = cid.Decode(hash)
        const block = this.fs.getBlock(c)
        return block
    }

    aesDecryptFile(file, password, outputPath, prefixLen) {
        // TODO
    }

    aesEncryptFile(file, password, outputPath) {
        // TODO
    }

    returnBuffer(buffer) {
        // return ontFs.returnBuffer(buffer)
    }
}


class MockFs {
    addFile(fileName, filePrefix, encrypt, password) {
        return ["Sk9yV47GxazE6vPYWHmPCV85YeM8nPpiTHsnjXrkU8NZUCmD", "SeNK9dipjf4ehPsW29mr8SWg9sTo6gxQtrfmCRuDxiNy5Lf9",
            "SeNKFUL2irD5uut1f3SRCXdK34ytpbwCQxe1KMt9pbHgaHHC", "SeNKFYnMYpUt7XHBUjh24TYk71h7vyByXSJR4jVUifxAXVsF"]
    }
    async getBlockWithHash(hash) {
        const index = ["Sk9yV47GxazE6vPYWHmPCV85YeM8nPpiTHsnjXrkU8NZUCmD", "SeNK9dipjf4ehPsW29mr8SWg9sTo6gxQtrfmCRuDxiNy5Lf9",
            "SeNKFUL2irD5uut1f3SRCXdK34ytpbwCQxe1KMt9pbHgaHHC", "SeNKFYnMYpUt7XHBUjh24TYk71h7vyByXSJR4jVUifxAXVsF"].indexOf(hash)
        const data = ffs.readFileSync(`/Users/zhijie/go/src/github.com/ontio/ontfs-js-sdk/test/blocks/block${index}`).toString()
        const block = {
            rawData() {
                return data
            },
            cid() {
                return hash
            }
        }
        return block
    }
    async getFileAllBlockHashAndOffset() {
        return {
            "Sk9yV47GxazE6vPYWHmPCV85YeM8nPpiTHsnjXrkU8NZUCmD-0": 0,
            "SeNK9dipjf4ehPsW29mr8SWg9sTo6gxQtrfmCRuDxiNy5Lf9-1": 0,
            "SeNKFUL2irD5uut1f3SRCXdK34ytpbwCQxe1KMt9pbHgaHHC-2": 262144,
            "SeNKFYnMYpUt7XHBUjh24TYk71h7vyByXSJR4jVUifxAXVsF-3": 524288,
        }
    }
    getBlockData(block) {
        return block.rawData()
    }
    encodedToBlockWithCid(data, hash) {
        return {
            rawData() {
                return data
            },
            cid() {
                return hash
            }
        }
    }
    getBlockLinks(block) {
        if (block.cid() == "Sk9yV47GxazE6vPYWHmPCV85YeM8nPpiTHsnjXrkU8NZUCmD") {
            return ["SeNK9dipjf4ehPsW29mr8SWg9sTo6gxQtrfmCRuDxiNy5Lf9",
                "SeNKFUL2irD5uut1f3SRCXdK34ytpbwCQxe1KMt9pbHgaHHC",
                "SeNKFYnMYpUt7XHBUjh24TYk71h7vyByXSJR4jVUifxAXVsF"]
        }
        return []
    }
    returnBuffer() {

    }
}

const newFs = () => {
    let cfg = config.DaemonConfig
    let fsConfig = {
        repoRoot: cfg.fsRepoRoot,
        fsType: cfg.fsType,
    }
    if (cfg && cfg.fsFileRoot && cfg.fsFileRoot.length) {
        common.createDirIfNeed(cfg.fsFileRoot)
    }
    const options = {
        cidVersion: 0,
        codec: 'dag-pb',
        leafType: 'file', // 'raw'
        strategy: 'trickle' // dag tree balanced to leaves, strategy used in golang version
    }
    // const fsSrv = new FsService(fsConfig.repoRoot, options)
    // let closeCh = new Deferred()
    // let service = new Fs(fsSrv, cfg, closeCh)
    let service = new MockFs()
    return service
}

module.exports = {
    Fs,
    newFs,
    MockFs
}