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

    async addFile(fileName, filePrefix, encrypt, password) {
        const root = await this.fs.addFile(fileName, filePrefix, encrypt, password)
        let all = [root.cid.toString()]
        const others = await this.fs.getAllFileCids(root.cid)
        for (let blk of others) {
            all.push(blk.toString())
        }
        return all
    }

    async getFileAllBlockHashAndOffset(rootHash) {
        let offsets = {}
        offsets[`${rootHash}-0`] = 0
        let others = await this.fs.getFileAllBlockHashAndOffset(rootHash)
        return Object.assign(offsets, others)
    }

    encodedToBlockWithCid(data, hash) {
        return this.fs.encodedToBlockWithCid(data, hash)
    }

    getBlockLinks(block) {
        const links = this.fs.getBlockLinks(block)
        return links
    }

    async getBlockWithHash(hash) {
        return await this.fs.getBlockWithHash(hash)
    }

    getBlockData(block) {
        return this.fs.getBlockData(block)
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
        rawLeaves: true,
        leafType: "raw",
        // rawLeaves: false,
        // leafType: 'file', // 'raw'
        strategy: 'balanced' // dag tree balanced to leaves, strategy used in golang version
    }
    console.log('repo', fsConfig.repoRoot, options)
    const fsSrv = new FsService(fsConfig.repoRoot, options)
    // let closeCh = new Deferred()
    let closeCh
    let service = new Fs(fsSrv, cfg, closeCh)
    return service
}

module.exports = {
    Fs,
    newFs,
}