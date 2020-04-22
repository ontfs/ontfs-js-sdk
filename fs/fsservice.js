const Ipld = require('ipld')
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
    const repo = new IpfsRepo(this.repoPath)
    const isInit = await repo.isInitialized()
    if (!isInit) {
      await repo.init({})
    }
    await repo.open()
    const blockService = new IpfsBlockService(repo)
    this.ipld = new Ipld({ blockService: blockService })
  }

  async initIpldInMemory() {
    this.ipld = await inMemory(Ipld)
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
        links.push(obj.node.cid)
      }
    }
    return links
  }


  async getBlockWithHash(cidStr) {
    const blockcid = new CID(cidStr)
    console.log('block cid', blockcid)
    const block = await this.ipld.get(blockcid)
    console.log('data', block._data)
    return new Block(block._data, blockcid)
  }

  getBlockData(block) {
    return block._data
  }

  async getBlockLinks(cidStr) {
    const blockcid = new CID(cidStr)
    const block = await this.ipld.get(blockcid)
    var links = []
    for (const link of block.Links) {
      links.push(link.Hash)
    }
    return links
  }

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

  decrypt(filePath, password, outPath) {
    try {
      var data = fs.readFileSync(filePath);
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
  var offset = 0

  async function* traverseLevel(parent, depth) {
    const nextLevelDepth = depth + 1

    // Check the depth
    if (nextLevelDepth > maxDepth) {
      return
    }

    // Get this object's links
    try {
      // Look at each link, parent and the new depth
      for (const link of await getLinks(ipld, parent.cid)) {
        const chiNode = await ipld.get(link.cid)
        if (!chiNode.Links || chiNode.Links.length == 0) {
          offsets[link.cid.toString()] = offset
          offset += CHUNK_SIZE
        }
        yield {
          parent: parent,
          node: link,
          isLeaf: !chiNode.Links || chiNode.Links.length == 0,
          isDuplicate: uniqueOnly && seen.has(link.cid.toString())
        }

        if (uniqueOnly) {
          seen.add(link.cid.toString())
        }

        yield* traverseLevel(link, nextLevelDepth)
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

// Fetch a node from IPLD then get all its links
async function getLinks(ipld, cid) {
  const node = await ipld.get(new CID(cid))
  if (DAGNode.isDAGNode(node)) {
    return node.Links.map(({ Name, Hash }) => ({ name: Name, cid: new CID(Hash) }))
  }

  return getNodeLinks(node)
}

// Recursively search the node for CIDs
function getNodeLinks(node, path = '') {
  let links = []
  for (const [name, value] of Object.entries(node)) {
    if (CID.isCID(value)) {
      links.push({
        name: path + name,
        cid: value
      })
    } else if (typeof value === 'object') {
      links = links.concat(getNodeLinks(value, path + name + '/'))
    }
  }
  return links
}

module.exports = {
  MAX_PREFIX_LENGTH,
  FsService
}