// TODO: implement OntFSService
const ontFs = {
    newOntFsService: () => {
    }
}
const cid = {}

const config = require("../config")
const common = require("../common")
const Deferred = require("deferred")

class Fs {
    constructor(_fs, _cfg, _closeCh) {
        this.fs = _fs
        this.cfg = _cfg
        this.closeCh = _closeCh
    }

    start() {
        return this.fs.start()
    }

    close() {
        this.closeCh.resolve()
        return this.fs.stop()
    }

    // TODO
    crc32HashFile() {

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
        const lns = this.fs.getBlockLinks(block)
        let links = []
        for (let link of lns) {
            links.push(link.cid.string())
        }
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

    putBlock(block) {
        return this.fs.putBlock(block)
    }


    setFsFilePrefix(fileName, prefix) {
        return this.fs.setFilePrefix(fileName, prefix)
    }

    putBlockForFileStore(fileName, block, offset) {
        return this.fs.putBlockForFilestore(fileName, block, offset)
    }

    pinRoot(ctx, fileHash) {
        const rootCid = cid.Decode(fileHash)
        return this.fs.pinRoot(ctx, rootCid)
    }

    getBlock(hash) {
        const c = cid.Decode(hash)
        const block = this.fs.getBlock(c)
        return block
    }

    deleteFile(fileHashStr, filePath) {
        return this.fs.deleteFile(fileHashStr)
    }

    aesDecryptFile(file, password, outputPath, prefixLen) {
        // TODO
    }

    aesEncryptFile(file, password, outputPath) {
        // TODO
    }

    setFsFileBlockHashes(fileHash, blockHashes) {
        return this.fs.setFsFileBlockHashes(fileHash, blockHashes)
    }
    returnBuffer(buffer) {
        return ontFs.returnBuffer(buffer)
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
    let fs = ontFs.newOntFsService(fsConfig, null)
    let closeCh = new Deferred()
    let service = new Fs(fs, cfg, closeCh)
    return service
}

module.exports = {
    Fs,
    newFs,
}