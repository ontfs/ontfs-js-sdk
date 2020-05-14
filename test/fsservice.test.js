const { FsService, MAX_PREFIX_LENGTH } = require('../fs/fsservice')
const fs = require('fs')
const { newFs } = require("../fs")
const utils = require("../utils")
const config = require("../config")
const { newPdp } = require("../pdp")
describe('fs service', () => {
    config.DaemonConfig = {
        fsRepoRoot: "./test/Fs",
        fsFileRoot: "./test/Download",
        fsType: 0
    }
    let testTimeout = 1000 * 60
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
        const filePath = './test/wallet.dat'
        const prefix = "helloworld"
        var data = fs.readFileSync(filePath);
        const hashes = await fsSvr.addFile(filePath, data, prefix, true, "123456")
        rootHash = hashes[0]
        console.log('hashes', hashes)
    }, testTimeout)


    test('delete file', async () => {
        await fsSvr.deleteFile(rootHash)
    })

    test('get file all block hashs and offsets', async () => {
        const cidOffsets = await fsSvr.getFileAllBlockHashAndOffset(rootHash)
        console.log('cidOffsets', cidOffsets)
    })


    test('get block with hash', async () => {
        // block = await fsSvr.getBlockWithHash(rootHash)
        block = await fsSvr.getBlockWithHash('Qme2mnhZPYM8y9pSjZPGpnMeqhJ858JDyo69if2ehRWNya')
        console.log('block', block._data.length)
        console.log(' data', block._data.toString('hex'))
    })

    test('get block links', async () => {
        const filePath = './test/Zoom.pkg'
        prefix = "helloworld"
        const hashes = await fsSvr.addFile(filePath, fs.readFileSync(filePath), prefix, false, "")
        for (let hash of hashes) {
            links = await fsSvr.getBlockLinks(hash).catch((err) => {
                console.log('err', err)
            })
            console.log(`hash: ${hash} has ${links ? links.length : 0} links`)
        }
    })

    test('encoded to block with cid', async () => {
        const blockhash = 'Qme2mnhZPYM8y9pSjZPGpnMeqhJ858JDyo69if2ehRWNya'
        const block = await fsSvr.getBlockWithHash(blockhash)
        console.log('block', block)
        const blockdata = fsSvr.getBlockData(block)
        console.log('block data', blockdata.toString('hex'))
        const encodedBlk = fsSvr.encodedToBlockWithCid(blockdata, blockhash)
        console.log('encoded block', encodedBlk)
    })

    test('write file', async () => {
        const filePath = './test/Zoom.pkg'
        prefix = "helloworld"
        var data = fs.readFileSync(filePath);
        const hashes = await fsSvr.addFile(filePath, data, prefix, false, "")
        // console.log('hashes', hashes)
        rootHash = hashes[0]
        const cidOffsets = await fsSvr.getFileAllBlockHashAndOffset(rootHash)
        // console.log('cidOffsets', cidOffsets)
        block = await fsSvr.getBlockWithHash('QmcvQN2iTxRydp3LudrdqpTxTU3nEvUidayvZ33qk31Hn6')
        console.log('block', block)
        hasCutPrefix = false
        const outputPath = "./test/testdownload"
        const fd = fs.openSync(outputPath, 'w')
        if (!fd) {
            throw new Error(`open file failed`)
        }
        for (let index in hashes) {
            let hash = hashes[index]
            let offset = cidOffsets[`${hash}-${index}`]
            block = await fsSvr.getBlockWithHash(hash)
            if (!block) {
                continue
            }
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

    test('get all block raw data', async () => {
        const filePath = './test/zoom'
        const prefix = "010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000f8b25010000000000000000"
        let fileContent = fs.readFileSync(filePath)
        const hashes = await fsSvr.addFile(filePath, fileContent, prefix, false, "")
        console.log('hashes', hashes)
        rootHash = hashes[0]
        for (let hash of hashes) {
            const block = await fsSvr.getBlockWithHash(hash)
            console.log('hash', hash, utils.hex2sha256(block.rawData.toString('hex')), block.rawData.length)
        }
    }, testTimeout)

    test('get all block raw data and calc pdp', async () => {
        const merklePdp = 1
        const filePath = './test/zoom'
        const prefix = "010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000f8b25010000000000000000"
        let fileContent = fs.readFileSync(filePath)
        const hashes = await fsSvr.addFile(filePath, fileContent, prefix, false, "")
        console.log('hashes', hashes)

        let datas = []
        for (let hash of hashes) {
            const block = await fsSvr.getBlockWithHash(hash)
            datas.push(block.rawData)
        }
        const pdp = await newPdp(merklePdp)
        const result = pdp.genUniqueIdWithFileBlocks(datas)
        console.log('uniqueId: ', result.buffer)
    }, testTimeout)

    test('encrypt file and decrypt', () => {
        var data = fs.readFileSync("./test/wallet.dat");
        var encData = fsSvr.aesEncryptFile(data, "123")
        fs.writeFileSync("./test/wallet_enc.dat", encData)
        var decData = fsSvr.aesDecryptFile(encData, "123", 0)
        fs.writeFileSync("./test/wallet_dec.dat", decData)
    })

    test('decrypt file', async () => {
        const filePath = './test/test.zip'
        prefix = "helloworld"
        password = "123"
        encrypt = true
        const hashes = await fsSvr.addFile(filePath, prefix, encrypt, password)
        const block = await fsSvr.getBlockWithHash(hashes[0])
        encPath = "./test/file_enc"
        decPath = "./test/file_dec"
        fs.writeFileSync(encPath, block.rawData)
        fsSvr.aesDecryptFile(encPath, password, decPath, prefix.length)
    })
})
