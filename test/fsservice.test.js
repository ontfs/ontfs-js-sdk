const { FsService, MAX_PREFIX_LENGTH } = require('../fs/fsservice')
const fs = require('fs')
const { newFs } = require("../fs")
const utils = require("../utils")
const config = require("../config")

describe('fs service', () => {
    config.DaemonConfig = {
        fsRepoRoot: "./test/Fs",
        fsFileRoot: "./test/Download",
        fsType: 0
    }
    let fsSvr
    let rootHash = 'QmbzsFMX7xvrfEYoi5te3RwdbDKeKPeNaK5h3Rdw5jaidA'
    beforeAll(async () => {
        fsSvr = await newFs()
        await fsSvr.start()
    })

    afterAll(async () => {
        await fsSrv.close()
    })

    test('add file', async () => {
        const filePath = './test/test.zip'
        const hashes = await fsSvr.addFile(filePath, "", false, "")
        rootHash = hashes[0]
        console.log('cidOffsets', hashes)
    })


    test('delete file', async () => {
        await fsSvr.deleteFile(rootHash)
    })

    test('get file all block hashs and offsets', async () => {
        const cidOffsets = await fsSvr.getFileAllBlockHashAndOffset(rootHash)
        console.log('cidOffsets', cidOffsets)
    })


    test('get block with hash', async () => {
        block = await fsSvr.getBlockWithHash(rootHash)
        console.log('block', block)
        blockdata = fsSvr.getBlockData(block)
        console.log('block data', blockdata.toString('base64'))
    })

    test('get block links', async () => {
        links = await fsSvr.getBlockLinks(rootHash)
        console.log('links', links)
    })

    test('encoded to block with cid', async () => {
        const blockhash = rootHash
        const block = await fsSvr.getBlockWithHash(blockhash)
        console.log('block', block)
        const blockdata = fsSvr.getBlockData(block)
        console.log('block data', blockdata)
        const encodedBlk = fsSvr.encodedToBlockWithCid(blockdata, blockhash)
        console.log('encoded block', encodedBlk)
    })

    // it('encrypt file', () => {
    //     fsSvr.encrypt(fileName, password, encFileName)
    // })

    // it('decrypt file', () => {
    //     fsSvr.decrypt(fileName, password, decFileName)
    // })
})