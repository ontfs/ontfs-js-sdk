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
    let rootHash = 'QmR7Wt1XVsEcBukwYScKr4czgpQwUABX99rnxC5BKft6tg'
    beforeAll(async () => {
        fsSvr = await newFs()
        await fsSvr.start()
    })

    afterAll(async () => {
        await fsSrv.close()
    })

    test('add file', async () => {
        const filePath = './test/test.zip'
        const hashes = await fsSvr.addFile(filePath, "helloworld", false, "")
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
        // block = await fsSvr.getBlockWithHash(rootHash)
        block = await fsSvr.getBlockWithHash('bafkreics3uyhjjoirdfpj6ydcd6ayhp6qr2yjqwannlzn5lcni3vwpajcu')
        console.log('block', block._data.length)
        console.log(' data', block._data.toString())
        prefix = "helloworld"
        fs.writeFileSync("./testwallet.dat", block._data.slice(prefix.length))
    })

    test('get block links', async () => {
        const filePath = './test/test.zip'
        prefix = "helloworld"
        const hashes = await fsSvr.addFile(filePath, prefix, false, "")
        for (let hash of hashes) {
            links = await fsSvr.getBlockLinks(hash)
            console.log(`hash: ${hash} has ${links ? links.length : 0} links`)
        }
    })

    test('encoded to block with cid', async () => {
        const blockhash = rootHash
        const block = await fsSvr.getBlockWithHash(blockhash)
        console.log('block', block)
        const blockdata = fsSvr.getBlockData(block)
        console.log('block data', utils.cryptoStr2Hex(blockdata))
        const encodedBlk = fsSvr.encodedToBlockWithCid(blockdata, blockhash)
        console.log('encoded block', encodedBlk)
    })

    test('write file', async () => {
        const filePath = './test/go1.12.16.linux-amd64.tar.gz'
        // const filePath = './test/wallet.dat'
        prefix = "helloworld"
        const hashes = await fsSvr.addFile(filePath, prefix, false, "")
        console.log('hashes', hashes)
        rootHash = hashes[0]
        const cidOffsets = await fsSvr.getFileAllBlockHashAndOffset(rootHash)
        hasCutPrefix = false
        const outputPath = "./test/testdownload.zip"
        const fd = fs.openSync(outputPath, 'w')
        if (!fd) {
            throw new Error(`open file failed`)
        }
        for (let index in hashes) {
            let hash = hashes[index]
            let offset = cidOffsets[`${hash}-${index}`]
            block = await fsSvr.getBlockWithHash(hash)
            links = await fsSvr.getBlockLinks(hash)
            if (links && links.length) {
                console.log('skip block with links', hash)
                continue
            }
            writeAtPos = offset
            if (!block._data) {
                console.log('block has no data', hash, block._data)
                continue
            }
            console.log('data substr', block._data.toString().substr(0, 20))
            if (!hasCutPrefix && block._data.toString().substr(0, prefix.length) == prefix) {
                block._data = block._data.slice(prefix.length)
                hasCutPrefix = true
            } else {
                writeAtPos -= prefix.length
            }
            fs.writeSync(fd, block._data, 0, block._data.length, writeAtPos)
            console.log(`write block ${hash}-${index} len ${block._data.length} pos ${writeAtPos} ${hasCutPrefix}`)
        }
    }, 500000)

    // it('encrypt file', () => {
    //     fsSvr.encrypt(fileName, password, encFileName)
    // })

    // it('decrypt file', () => {
    //     fsSvr.decrypt(fileName, password, decFileName)
    // })
})