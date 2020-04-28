const { FsService } = require("./fsservice")
const config = require("../config")

class Fs {
    constructor(_fs, _cfg, _closeCh) {
        this.fs = _fs
        this.cfg = _cfg
        this.closeCh = _closeCh
    }

    /**
     * start a ipld service
     *
     * @returns 
     * @memberof Fs
     */
    async start() {
        return await this.fs.initIpldInMemory()
    }

    /**
     * close ipld service
     *
     * @memberof Fs
     */
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

    /**
     * get file all block hash and offset 
     *
     * @param {string} rootHash: root block hash of the file
     * @returns {Object} key `${hash}-${index}` value offset
     * @memberof Fs
     */
    async getFileAllBlockHashAndOffset(rootHash) {
        let offsets = {}
        offsets[`${rootHash}-0`] = 0
        let others = await this.fs.getFileAllBlockHashAndOffset(rootHash)
        return Object.assign(offsets, others)
    }

    /**
     * encoded a block data to Object
     *
     * @param {ArrayBuffer} data
     * @param {String} hash
     * @returns
     * @memberof Fs
     */
    encodedToBlockWithCid(data, hash) {
        return this.fs.encodedToBlockWithCid(data, hash)
    }

    /**
     * get block links, links are a layer of children for the block
     *
     * @param {string} hash: block hash 
     * @returns {Array} links: a string array
     * @memberof Fs
     */
    async getBlockLinks(hash) {
        const links = await this.fs.getBlockLinks(hash)
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

    /**
     * encrypt a file 
     *
     * @param {ArrayBuffer} fileBuf
     * @param {string} password
     * @returns {ArrayBuffer} encrypted buffer
     * @memberof Fs
     */
    aesEncryptFile(fileBuf, password) {
        return this.fs.encrypt(fileBuf, password)
    }

    /**
     * decrypt a file
     *
     * @param {ArrayBuffer} fileBuf: encrypted buffer
     * @param {string} password: encrypted password
     * @param {number} prefixLen: prefix of the file with not belongs to the origin data
     * @returns {ArrayBuffer} origin data buffer
     * @memberof Fs
     */
    aesDecryptFile(fileBuf, password, prefixLen) {
        return this.fs.decrypt(fileBuf, password, prefixLen)
    }

    /**
     * TODO method
     *
     * @param {*} buffer
     * @memberof Fs
     */
    returnBuffer(buffer) {
    }
}



/**
 * init a FS service 
 *
 * @returns
 */
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