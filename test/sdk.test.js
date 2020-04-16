const { initSdk, Sdk } = require('../sdk')
const OntSDK = require("ontology-ts-sdk").SDK
const { Account } = require("ontology-ts-sdk")
const { Address } = require("ontology-ts-sdk").Crypto
const { hexstr2str } = require("ontology-ts-sdk").utils
describe('sdk test', () => {
    const wif = "KxYkAszCkUhfnx2goy5wxSiUrbMcCFgjK87dgAvDxnwiq7hKymNL"
    const label = 'pwd'
    const password = 'pwd'
    const rpcAddr = 'http://127.0.0.1:20336'
    let sdk = new Sdk()
    const testTimeout = 20 * 1000
    const init = async () => {
        if (sdk && sdk.ontFs && sdk.ontFs.account) {
            return
        }
        const { error, result } = await OntSDK.importAccountWithWif(label, wif, password)
        expect(error).toEqual(0)
        const account = Account.parseJson(result)
        const testCfg = {
            walletPwd: password,
            chainRpcAddr: rpcAddr,
            gasPrice: 500,
            gasLimit: 40000
        }
        sdk = initSdk(testCfg, account)
    }
    test('test sdk get node lists', async () => {
        await expect(sdk.getFsNodesList(3)).resolves.toBeDefined();
    });

    test('test sdk wait for tx confirmed', async () => {
        const height = await sdk.chain.getBlockHeight()
        await sdk.waitForTxConfirmed(height + 3)
    }, testTimeout);


    test('test sdk createSpace', async () => {
        await init()
        await sdk.createSpace(10, 1, 600, 1586880000)
    }, testTimeout);

    test('test sdk get space info', async () => {
        await init()
        await expect(sdk.getSpaceInfo()).resolves.toBeDefined()
    });

    test('test sdk update space info', async () => {
        await init()
        let info = await sdk.getSpaceInfo()
        await expect(sdk.updateSpace(info.volume + 1000, info.timeExpired + 1)).resolves.toBeUndefined()
    }, testTimeout);

    test('test sdk delete space info', async () => {
        await init()
        await expect(sdk.deleteSpace()).resolves.toBeUndefined()
    }, testTimeout);

    test('test sdk store files', async () => {
        await init()
        let info = {
            fileHash: "SeNKDywBHnxxmyVht97oFZZEahteCuNMDS8RbBBzmLugjYAa",
            fileDesc: "wallet",
            fileBlockCount: 1,
            realFileSize: 484,
            copyNumber: 1,
            firstPdp: true,
            pdpInterval: 600,
            timeExpired: 1586880009,
            pdpParam: hexstr2str("01000000000000000100000000000000200000000000000019aedee05748b8af421f18388bc60c441813271207a960ea3b4a59007b159fa4"),
            storageType: 1
        }
        await sdk.ontFs.storeFiles([info])
    }, testTimeout);

    test('test sdk get file info', async () => {
        await init()
        const info = await sdk.getFileInfo("SeNKDywBHnxxmyVht97oFZZEahteCuNMDS8RbBBzmLugjYAa")
        console.log('info', info)
        await expect(sdk.getFileInfo("SeNKDywBHnxxmyVht97oFZZEahteCuNMDS8RbBBzmLugjYAa")).resolves.toBeDefined()
    });

    test('test sdk get file list', async () => {
        await init()
        await expect(sdk.getFileList()).resolves.toBeDefined()
    });

    test('test sdk renew file info', async () => {
        await init()
        await expect(sdk.renewFile("SeNKDywBHnxxmyVht97oFZZEahteCuNMDS8RbBBzmLugjYAa", 3600)).resolves.toBeUndefined()
    }, testTimeout);

    test('test sdk change file owner', async () => {
        await init()
        const addr = new Address("AN1n6Wm2mMjp5PNgMBViYxQaHsDWEn1uyx")
        await expect(sdk.changeOwner("SeNKDywBHnxxmyVht97oFZZEahteCuNMDS8RbBBzmLugjYAa", addr)).resolves.toBeUndefined()
    }, testTimeout);


    test('test sdk delete files', async () => {
        await init()
        const tx = await sdk.deleteFiles([
            "SeNKDywBHnxxmyVht97oFZZEahteCuNMDS8RbBBzmLugjYAy",
            "SeNKDywBHnxxmyVht97oFZZEahteCuNMDS8RbBBzmLugjYAz"
        ])
        console.log('tx', tx)
        // await expect().resolves.toBeUndefined()
    }, testTimeout);

    test('test sdk delete file', async () => {
        await init()
        await sdk.deleteFile(
            "SeNKDywBHnxxmyVht97oFZZEahteCuNMDS8RbBBzmLugjYAd"
        )
        // await expect().resolves.toBeUndefined()
    }, testTimeout);

    test('test sdk read file pledge', async () => {
        await init()
        let readPlan = {
            nodeAddr: "ALQ6RWJENsELE7ATuzHz4zgHrq573xJsnM",
            maxReadBlockNum: 1,
            haveReadBlockNum: 0,
        }
        await sdk.ontFs.fileReadPledge("SeNKDywBHnxxmyVht97oFZZEahteCuNMDS8RbBBzmLugjYAd", [readPlan])

        // await expect().resolves.toBeUndefined()
    }, testTimeout);


    test('test sdk get read file pledge', async () => {
        await init()
        await expect(sdk.getFileReadPledge("SeNKDywBHnxxmyVht97oFZZEahteCuNMDS8RbBBzmLugjYAd")).resolves.toBeDefined()
    }, testTimeout);

    test('test sdk cancel read file pledge', async () => {
        await init()
        await expect(sdk.cancelFileRead("SeNKDywBHnxxmyVht97oFZZEahteCuNMDS8RbBBzmLugjYAd")).resolves.toBeUndefined()
    }, testTimeout);


    test('test sdk get file pdp record', async () => {
        await init()
        await sdk.getFilePdpInfoList("SeNKDywBHnxxmyVht97oFZZEahteCuNMDS8RbBBzmLugjYAy")
        // await expect(sdk.getFilePdpRecordList(str2hexstr("SeNKDywBHnxxmyVht97oFZZEahteCuNMDS8RbBBzmLugjYAd"))).resolves.toBeDefined()
    }, testTimeout);

    test('test sdk challenge file', async () => {
        await init()
        await sdk.challenge("SeNKDywBHnxxmyVht97oFZZEahteCuNMDS8RbBBzmLugjYAd", "ALQ6RWJENsELE7ATuzHz4zgHrq573xJsnM")
        // await expect().resolves.toBeUndefined()
    }, testTimeout);

    test('test sdk get file challenge list', async () => {
        await init()
        await sdk.getChallengeList("SeNKDywBHnxxmyVht97oFZZEahteCuNMDS8RbBBzmLugjYAd")
        // await expect().resolves.toBeUndefined()
    }, testTimeout);



})