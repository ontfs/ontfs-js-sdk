const { FsService, MAX_PREFIX_LENGTH } = require('../fs/fsservice')
const fs = require('fs')
const utils = require("../utils")

describe('fs service', () => {
    const repoPath = './repo'
    const options = {
        cidVersion: 0,
        codec: 'dag-pb',
        rawLeaves: true,
        leafType: 'raw', // 'raw'
        strategy: 'balanced' // dag tree balanced to leaves, strategy used in golang version
        // strategy: 'flat' // dag tree with only one child layer
    }

    const fsSrv = new FsService(repoPath, options)
    testTimeout = 20 * 1000

    fileName = "test.zip"
    encFileName = "blockchain-enc.zip"
    decFileName = "blockchain-dec.zip"
    encrypt = true
    password = "onchainpwd"
    prefix = {
        Version: 1,
        FileSize: 821412165,
        Encrypt: encrypt,
        EncryptPwd: password
    }
    prefixLen = MAX_PREFIX_LENGTH

    beforeAll(async () => {
        await fsSrv.initIpld()
        // await fsSrv.initIpldInMemory()
    })

    test('add file, compute dag tree, and write new file', async () => {
        const filePath = './test/' + fileName
        const root = await fsSrv.addFile(filePath, "helloworld", false, "")
        console.log('root', root.cid)

        cidOffsets = await fsSrv.getFileAllBlockHashAndOffset(root.cid)
        console.log('cidOffsets', cidOffsets)
        // for (var bCid in cidOffsets) {
        //     block = await fsSrv.getBlockWithHash(bCid)
        //     console.log('write', block._cid, cidOffsets[block._cid.toString()], block._data.length)
        //     fs.writeFileSync("./test/" + block._cid.toString(), block._data.toString('hex'))
        //     // let writeAtPos = cidOffsets[block._cid.toString()]
        //     // let writeData = block._data.slice(6)
        //     // if (writeAtPos == 0) {
        //     //     writeData = writeData.slice(prefixLen)
        //     //     fs.writeSync(fd, writeData, 0, writeData.length - 4, writeAtPos)
        //     // }
        //     // if (writeAtPos > 0) {
        //     //     writeAtPos -= prefixLen
        //     //     fs.writeSync(fd, writeData, 0, block._data.length - 10, writeAtPos)
        //     // }
        // }
    })

    // it('add file', async () => {
    //     const root = await fsSrv.addFile('/Users/wwens/Documents/' + fileName, JSON.stringify(prefix), encrypt, password)
    //     console.log('root', root)
    // }, testTimeout)

    // it('delete file', async () => {
    //     await fsSrv.deleteFile('QmZVf14KituzMKuztZzkBx2G7LzBhum8UfQEF9LnXrnczU')
    // })

    test('get file all block hashs and offsets', async () => {
        const cidOffsets = await fsSrv.getFileAllBlockHashAndOffset('QmbDzTHEtqUECRei9m3f4uzKW3oke75A2hURn4CHkgtwcX')
        console.log('cidOffsets', cidOffsets)
    })

    // it('get all file cids', async () => {
    //     const allCids = await fsSrv.getAllFileCids('QmZVf14KituzMKuztZzkBx2G7LzBhum8UfQEF9LnXrnczU', false)
    //     console.log('cids', allCids)
    // })

    // it('get block with hash', async () => {
    //     block = await fsSrv.getBlockWithHash('QmY2mUKK3NUby3QiYCS4Dbz36w84ojRGJSRckfJN1vHAHn')
    //     console.log('block', block)
    //     blockdata = fsSrv.getBlockData(block)
    //     console.log('block data', blockdata)
    // })

    // it('get block links', async () => {
    //     links = await fsSrv.getBlockLinks('QmY2mUKK3NUby3QiYCS4Dbz36w84ojRGJSRckfJN1vHAHn')
    //     console.log('links', links)
    // })

    // it('encoded to block with cid', async () => {
    //     const blockhash = 'QmY2mUKK3NUby3QiYCS4Dbz36w84ojRGJSRckfJN1vHAHn'
    //     const block = await fsSrv.getBlockWithHash(blockhash)
    //     console.log('block', block)
    //     const blockdata = fsSrv.getBlockData(block)
    //     console.log('block data', blockdata)
    //     const encodedBlk = fsSrv.encodedToBlockWithCid(blockdata, blockhash)
    //     console.log('encoded block', encodedBlk)
    // })

    // it('encrypt file', () => {
    //     fsSrv.encrypt(fileName, password, encFileName)
    // })

    // it('decrypt file', () => {
    //     fsSrv.decrypt(fileName, password, decFileName)
    // })
})