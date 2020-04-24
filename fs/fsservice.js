const Ipld = require('ipld')
// const Ipld = require('ipld-raw')
const inMemory = require('ipld-in-memory')
const IpfsRepo = require('ipfs-repo')
const Block = require('ipfs-block')
const IpfsBlockService = require('ipfs-block-service')
const { DAGNode } = require('ipld-dag-pb')
const importer = require('ipfs-unixfs-importer')
const exporter = require('ipfs-unixfs-exporter')
const CID = require('cids')
const { Errors } = require('interface-datastore')
const ERR_NOT_FOUND = Errors.notFoundError().code
const Crypto = require("crypto");
const fs = require('fs')

const MAX_PREFIX_BUFFER_LENGTH = 256
const MAX_PREFIX_LENGTH_LENGTH = 4
const MAX_PREFIX_LENGTH = MAX_PREFIX_BUFFER_LENGTH + MAX_PREFIX_LENGTH_LENGTH
const CHUNK_SIZE = 262144

class FsService {
    constructor(repoPath, opts) {
        this.repoPath = repoPath
        this.opts = opts
        this.opts.minChunkSize = CHUNK_SIZE
        this.opts.maxChunkSize = CHUNK_SIZE
        this.opts.avgChunkSize = CHUNK_SIZE
        this.ipld = null
    }

    async initIpld() {
        const repo = new IpfsRepo(this.repoPath, { lock: 'memory' })
        const blockService = new IpfsBlockService(repo)
        const isInit = await repo.isInitialized()
        if (!isInit) {
            await repo.init({})
        }
        try {
            await repo.open()
        } catch (err) {
            console.log(err)
        }
        this.ipld = new Ipld({ blockService: blockService })
    }

    async initIpldInMemory() {
        this.ipld = await inMemory(Ipld)
    }

    async close() {
        await this.ipld.bs._repo.close()
    }

    async addFile(filePath, filePrefix, encrypt, password) {
        var data = fs.readFileSync(filePath);
        if (encrypt) {
            var cipher = Crypto.createCipher('aes-256-cbc', password);
            data = Buffer.concat([cipher.update(data), cipher.final()]);
        }
        //add prefix at the beginning
        const fullDataBuf = Buffer.concat([Buffer.from(filePrefix), data])
        for await (const file of importer([{ path: filePath, content: fullDataBuf }], this.ipld, this.opts)) {
            const result = await exporter(file.cid, this.ipld)
            if (!result.unixfs || result.unixfs.type == 'file') {
                return result
            }
        }
    }

    async deleteFile(filehash) {
        const rootCid = new CID(filehash)
        const allCids = await this.getAllFileCids(rootCid, false)
        try {
            allCids.forEach((cid) => {
                this.ipld.bs.delete(cid)
            })
        } catch (err) {
            throw err
        }
    }

    // Get a map, contain all file cids and offsets, only leaf node
    async getFileAllBlockHashAndOffset(cidStr) {
        let offsets = {}
        // Traverse the DAG
        for await (const obj of bfsTraverse(this.ipld, new CID(cidStr), offsets, 3, true)) {
            // Root object will not have a parent
            if (!obj.parent) {
                continue
            }

            // Filter out duplicates (isDuplicate flag is only set if options.unique is set)
            if (obj.isDuplicate) {
                continue
            }
        }
        return offsets
    }

    // Get all file cids, if isLeaf true, only leaf node cids
    async getAllFileCids(cidStr, isLeaf) {
        let links = []
        // Traverse the DAG
        for await (const obj of bfsTraverse(this.ipld, new CID(cidStr), {}, 3, true)) {
            // Root object will not have a parent
            if (!obj.parent) {
                continue
            }

            // Filter out duplicates (isDuplicate flag is only set if options.unique is set)
            if (obj.isDuplicate) {
                continue
            }

            if (obj.isLeaf || !isLeaf) {
                links.push(obj.node.Hash)
            }
        }
        return links
    }


    /**
     * get a encoded block object with hash string
     *
     * @param {string} cidStr: hash string
     * @returns {object} block object
     * @memberof FsService
     */
    async getBlockWithHash(cidStr) {
        const blockCid = new CID(cidStr)
        const blk = await this.ipld.get(blockCid)
        if (blk._data) {
            if (blockCid.codec == 'dag-pb') {
                const block = new Block(blk.serialize(), blockCid)
                block.rawData = blk.serialize()
                return block
            }
            const block = new Block(blk._data, blockCid)
            block.rawData = blk._data
            return block
        }
        if (Buffer.isBuffer(blk)) {
            const block = new Block(blk, blockCid)
            block.rawData = blk
            return block
        }
        return
    }

    /**
     * get block encoded data
     *
     * @param {Object} block
     * @returns {Buffer} block encoded data buffer
     * @memberof FsService
     */
    getBlockData(block) {
        return block._data
    }

    async getBlockLinks(cidStr) {
        const blockCid = new CID(cidStr)
        const block = await this.ipld.get(blockCid)
        var links = []
        if (!block || !block.Links) {
            return
        }
        for (const link of block.Links) {
            links.push(link.Hash)
        }
        return links
    }

    /**
     *
     *
     * @param {Buffer} blockdata
     * @param {string} blockhash
     * @returns
     * @memberof FsService
     */
    encodedToBlockWithCid(blockdata, blockhash) {
        const cid = new CID(blockhash)
        const block = new Block(blockdata, cid)
        return block
    }

    encrypt(filePath, password, outPath) {
        try {
            var data = fs.readFileSync(filePath);
            var cipher = Crypto.createCipher('aes-256-cbc', password);
            var encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
            fs.writeFileSync(outPath, encrypted);
            return
        } catch (exception) {
            throw new Error(exception.message);
        }
    }
    decrypt(filePath, password, outPath, prefixLen) {
        try {
            var data = fs.readFileSync(filePath);
            data = data.slice(prefixLen)
            var decipher = Crypto.createDecipher("aes-256-cbc", password);
            var decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
            fs.writeFileSync(outPath, decrypted);
            return
        } catch (exception) {
            throw new Error(exception.message);
        }
    }
}

// Do a breadth first search of the DAG, starting from the given root cid
async function* bfsTraverse(ipld, rootCid, offsets, maxDepth, uniqueOnly) { // eslint-disable-line require-await
    const seen = new Set()
    let offset = 0
    let index = 1
    async function* traverseLevel(parent, depth) {
        const nextLevelDepth = depth + 1

        // Check the depth
        if (nextLevelDepth > maxDepth) {
            return
        }

        // Get this object's links
        try {
            // Look at each link, parent and the new depth
            const pNode = await ipld.get(parent.cid)
            if (DAGNode.isDAGNode(pNode)) {
                for (const link of await pNode.Links) {
                    const chiNode = await ipld.get(link.Hash)
                    if (!chiNode.Links || chiNode.Links.length == 0) {
                        offsets[`${link.Hash.toString()}-${index}`] = offset
                        index++
                        offset += CHUNK_SIZE
                    }
                    yield {
                        parent: parent,
                        node: link,
                        isLeaf: !chiNode.Links || chiNode.Links.length == 0,
                        isDuplicate: uniqueOnly && seen.has(link.Hash.toString())
                    }

                    if (uniqueOnly) {
                        seen.add(link.Hash.toString())
                    }

                    yield* traverseLevel({ cid: link.Hash }, nextLevelDepth)
                }
            }
        } catch (err) {
            if (err.code === ERR_NOT_FOUND) {
                err.message = `Could not find object with CID: ${parent.cid}`
            }

            throw err
        }
    }

    yield* traverseLevel({ cid: rootCid }, 0)
}

module.exports = {
    MAX_PREFIX_LENGTH,
    FsService
}