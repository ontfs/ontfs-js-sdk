const { FsService } = require("./fsservice")
const config = require("../config")

class Fs {
    constructor(_fs, _cfg, _closeCh) {
        this.fs = _fs
        this.cfg = _cfg
        this.closeCh = _closeCh
    }

    async start() {
        return await this.fs.initIpldInMemory()
    }

    async close() {
        // this.closeCh.resolve()
        await this.fs.close()
    }

    /**
     * sharding file and add file to unixfs 
     *
     * @param {string} filePath: file path from the file
     * @param {ArrayBuffer} fileArrayBuf: file content 
     * @param {string} filePrefix: file identified prefix string
     * @param {bool} encrypt: encrypt the file or not
     * @param {string} password: encrypt file password
     * @returns {Array} a string array of all block hash
     * @memberof Fs
     */
    async addFile(filePath, fileArrayBuf, filePrefix, encrypt, password) {
        const root = await this.fs.addFile(filePath, fileArrayBuf, filePrefix, encrypt, password)
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

    /**
     * get block object with hash
     *
     * @param {string} hash
     * @returns {Object} : block object
     * @memberof Fs
     */
    async getBlockWithHash(hash) {
        return await this.fs.getBlockWithHash(hash)
    }

    /**
   * get block encoded data
   *
   * @param {Object} block
   * @returns {ArrayBuffer} block encoded data buffer
   * @memberof FsService
   */
    getBlockData(block) {
        return this.fs.getBlockData(block)
    }

    aesEncryptFile(fileBuf, password) {
        return this.fs.encrypt(fileBuf, password)
    }

    aesDecryptFile(fileBuf, password, prefixLen) {
        return this.fs.decrypt(fileBuf, password, prefixLen)
    }

    returnBuffer(buffer) {
    }
}



const newFs = () => {
    let cfg = config.DaemonConfig
    let fsConfig = {
        repoRoot: cfg.fsRepoRoot,
        fsType: cfg.fsType,
    }
    const options = {
        cidVersion: 0,
        codec: 'dag-pb',
        rawLeaves: true,
        leafType: "raw",
        strategy: 'balanced' // dag tree balanced to leaves, strategy used in golang version
    }
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