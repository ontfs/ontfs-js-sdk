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


class MockFs {
    addFile(fileName, filePrefix, encrypt, password) {
        return ["SeNKDywBHnxxmyVht97oFZZEahteCuNMDS8RbBBzmLugjYAy"]
    }
    async getBlockWithHash(hash) {
        const block = {
            rawData() {
                return '3031303030303030303030303030303030303030303030303030303030303030303030303030' +
                    '30303030303030303030303030303030303030303030303030303030303030303030303030303030303030' +
                    '30303030303030303030303030303030303030303030303030303030303030303030303030303030303030' +
                    '303030303030303030306534303130303030303030303030303030303030303030307b226e616d65223a22' +
                    '4d7957616c6c6574222c2276657273696f6e223a22312e31222c22736372797074223a7b2270223a382c22' +
                    '6e223a31363338342c2272223a382c22646b4c656e223a36347d2c226163636f756e7473223a5b7b226164' +
                    '6472657373223a22414c5a584e38564b754e3633786173734155453239534731764b485466335775564622' +
                    '2c22656e632d616c67223a226165732d3235362d67636d222c226b6579223a22334745676f48526575654f' +
                    '6e513768496d357653307651712f74672f3237363036594d686d59725359323778355465666f515271536e' +
                    '6a50777437385856724d222c22616c676f726974686d223a224543445341222c2273616c74223a224c6757' +
                    '7258624a4f4c384e3944526a7a34726f646f673d3d222c22706172616d6574657273223a7b226375727665' +
                    '223a22502d323536227d2c226c6162656c223a22707764222c227075626c69634b6579223a223033653535' +
                    '63363233373565653637323561306137633435646234633230396161323861633038616139383564666336' +
                    '333437353761386465383961326636616165222c227369676e6174757265536368656d65223a2253484132' +
                    '3536776974684543445341222c22697344656661756c74223a747275652c226c6f636b223a66616c73657d5d7d'
            }
        }
        return block
    }
    async getFileAllBlockHashAndOffset() {
        return {
            "SeNKDywBHnxxmyVht97oFZZEahteCuNMDS8RbBBzmLugjYAy-0": 0,
        }
    }
    getBlockData(block) {
        return block.rawData()
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
    let fs = ontFs.newOntFsService(fsConfig, null)
    let closeCh = new Deferred()
    let service = new Fs(fs, cfg, closeCh)
    // let service = new MockFs()
    return service
}

module.exports = {
    Fs,
    newFs,
}