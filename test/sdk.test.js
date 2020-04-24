const { initSdk, Sdk } = require('../sdk')
const OntSDK = require("ontology-ts-sdk").SDK
const { Account } = require("ontology-ts-sdk")
const { Address, Signature } = require("ontology-ts-sdk").Crypto
const { hexstr2str, str2hexstr } = require("ontology-ts-sdk").utils
const { Passport } = require("ontology-ts-sdk/fs")
describe('sdk test', () => {
    const wif = "KxYkAszCkUhfnx2goy5wxSiUrbMcCFgjK87dgAvDxnwiq7hKymNL"
    const label = 'pwd'
    const password = 'pwd'
    const rpcAddr = 'http://127.0.0.1:20336'
    let sdk
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
            gasLimit: 40000000
        }
        sdk = await initSdk(testCfg, account)
    }
    beforeAll(async () => {
        await init()
    })
    test('test sdk get node lists', async () => {
        const nodeList = await sdk.getFsNodesList(3)
        console.log('nodeList', nodeList)
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
            fileHash: "QmZJAtkatZ4Xyhtkytgq9nD77KVJAiNvfEoBeLpZf9dSwE",
            fileDesc: "uploadfile.tar",
            fileBlockCount: 129,
            realFileSize: 33331200,
            copyNumber: 1,
            firstPdp: true,
            pdpInterval: 14400,
            timeExpired: 1587744000,
            pdpParam: "0100000000000000260025935afa5ef84526404f2d461961ce7d26ec309d63ae4941ce6cfa6ba46471743de98b1fef075859cfdbf91d6600efab863e848014d8ac67bba7b25d186c0122245550903372157a64dc712b4376c6142f0e820d0b0669578528d5263f68216ea907937aff6a08c79a770ae9bb2d63eb1e340998806aaa7217c6cf14b89e1d7bdb03435b79402e17c838a26a3fd891210822c58ac784aa7ef484ad0403939d9a9f7da43c87fba43b40b678a96db876163300d972f3138850d887c7e5647c07d7738e0e307374e720b24e3f18944dd534ddf9b4512722ea04a7f1ab06a05e15cc811de16ca2687b682971fb467a3d184064637818b656759e14455a67cbca2f553844a33872adabc8f6960b35d6b57439a888ec37e2497825c21f273af86c93a14a9e696ae26cf7d477536cbccce24cb141eb7e2e3c9ee44d70d600c064a7a8d1d767f453127007e2f6d34e657e952b3047d269276d9263f6000f660a8c450bb1af066a882fc513c771c7b4cbc9cbb79c76c28d3562c195eaa7a536e43bf10a33bfc5afe70990576df08c870bff9b4180f5947c56976725428ad77c1a74f6ec067b27271123135b2b77cdb0edfc7225d6845ccb5901413e60e48c75294b989aa6b4c70040a48c5940dade8e739ba4af87eae532e62254e76e6cde6103b327dfe2c8d4544fe9ba622eeb1bdb688f8cd662f9b4c8a2ea8c8447d7103638dffc8097535b91e6f4f039b468142000d0e4ec2d1bae0b553d962a36ed2b3e89fd751faf99b6b54c832f0cb55ab5fa605aa3fb893cdde794a885d11c63f9fce4cb7a8fc1e599e5aec8d5c16726d37eb41eb535eef6e470e067d27c5071e42bbca326b00ded466fc9f7c628aba7a7e41d24095e1deed6b3a5aa086760e9166844caca0aec9a46ff9b23b745b975dc83d7e76cc4598a9ba02488ea6f0da4ab9783b120af8752c47d99766ded0adf1b3e3b35213d94d171c8cea6f59c1fd01983d685ea9b0a858e6d38e886de84a4e43dd4b2cc2d8204fbcd1b2d3d3a130d843144bd25037fec687b533446ac24996db0042ef6517b323051bb530c7744eea0bcb0713dc002cd19cd41901c2f768ca9b0571b315b142c4cf4d8018d0e303c3083257ec9aa79c4c03176c8e7bf93c5685217d7cc90c94f934cfa6968dea21bc2dff02d048c2933b15c28a00e8696a90854e9d0ce019c1b348155836bfc52d093e01be16c3ae9bab55a84d381fb2ebb138e31f93bb70471b418a59f0d72b3677a7ad2a2e9962391474aafe3baf1927d577c82f563999ed6df4b0389da017701085f5a90105582303932759dfa126d5974a4da0f1cc817c91992b139ecae93fef074712061eee832138df1ae3461cc593f8fb16be8e0b11b439fcc578816965898b1402d56ebbcbc6e4dfebd414a68739f72295e65d106cea6f993d66161daf5859ab19c2562957d3614602b652cd454448d22670d920b10fa90da3a2a0b8edd8c4549b53262957d3614602b652cd454448d22670d920b10fa90da3a2a0b8edd8c4549b53297e840db50ecc1fe09d2753660008442164c7d6259c6fdf839a617bde92b62fa2dec44c086f2b59c43456c7ff5c8a706a75fc4a14341ab04f7b7c4aa43b05c211e9c0caf0dd3032bbda3858f19ba487d9594f6afaa0e10a433d4e822194d2a0762957d3614602b652cd454448d22670d920b10fa90da3a2a0b8edd8c4549b532be4527cdc4532aac877f69183061c1060b0dad474cc13c841fed4584b5855931a7909aab86b155780070beaba9ba8ca939bba9a9404689b5ef03a2f266fd7b7e136bcb7ae6c95ba8d122daaf91b37cc34afc02f480fbebfeee185206cc4418e8e49b4a9ce8085f31678c53c7c3be36a323e1da890ec9c97a6d3f1e190d7b3cd8aa611ccb7ed6954c2c417560ae5e1a380bd695c5fbe21d18a75342bda1185f8431dcdfd5d1aa9a27e7a9317afbfbf61f105c508ac4416f77f18a47642e4871c6139b641b80806a097eb2a860eec1344088df6246da99f87255ade31947415ece2ae80de79cbca896670472a4379eaa25537925321b4c70565e82a0c8c9c30d635a220e23f9d7e2d4720031839f50a28ccfd339b5e40f2e7aae3083d3633a880138b77a498cd0d22202a0380b9cb686eee419d9c145946268ba4366b702e770a991a034033b1f3e7f359dc619726069cf776dbd38960c35494f7e681e256bcd87108952a98a377c2f2a23632729c654d55c476dcd46b7a487c42e1b1a49b0cc60fc8e07abba439846d3b635ef137d791227f5d6f56bfde023019369e2cc47ef42be5f1dc1c4398be8eee36e755b2035ddff450ab3b198f7dd20e3ccb5d3d020b2440c3dd58c5529d72b3fcc2f1d7831c961099bdfdd4bfea2792d90934c41603b088e6832ded148efa4cece546c02d6444056aa735cb3aea6806854e0e7e5e56886bf7ea39b785d706c608f330fc2d843b396bdcedc79b5b1393fa50d139043aa747754f3bb2f7ddfb1814054a5c23305df76958f388b27014916cebac29e54feb2ac519fd57e664368b5894078820868027bac2318ae81d348c500556952049e361e97f3cfac94d8858b13a4bb8567eabe1d24b272a658d229f158223a9f2525b6052d51e4becc7352d0ca03299b11f0186ac44eadc74f1b0ebfc8c6052f84758c30a4a90b999c2b216bd24ca02bcd192aa319f26dd16081af07468e4320501269b778a6266dadd4b0711c2a163ae6c4b7efd1138fb829b5500a24469ac76c2cd957786116771fd7150448e93e2fcd86bfaa84f7d54b4d005d1dae5abe8a2109f6162e1e4ff6de44ac4f1be823cea77498eff6935d13fb97a1a02a2a5ed53c2c8178877545c9835bf914a0fe35a7ad476746a76b5d517446d018e7e0a1cea30ceff139f1b133ea0e6db49178d4d5fb0d3061d7b94de4f90c3adf4608fc8a1251f6d4e627b0888580d10b857e4ad5d7fb7e51b12b8436b9ea6a94dd6ac4635d204fc1fe3eb701730a4be8598e85a7eef1be7619936697b6128e7eab9347ca7bcdc98eb833485718dc7fb23ba9da257632331e4ce70e7ed6244d09886a27cd89e5bb870e15e30757c752725afb10543ac5d4e48a7e555042fa13c7f3e2326c5c2515dd9494773b09a60f0648607f162621cd020b7da60c3d1666338dbc0e9d927a19ad7fa6638124f2421a3972d89a5e523a49d30f5df725d608de863e88e7846a4bd95ae93612bab7794bd6027669dafa93b3d28c0805c22ddf0b1d954b4fa54e6423517fd3728ed47a9d346baa973b2ffa218680c5ad316a054024918da70dd5ffd49c83ed6f9d2652ad8bf84d20619298ed6b12ec941c871335d822aafab8c116634cf5767a464368a902396345cfe6c15598ade8688aa4371b86996617520667bb03bd3f97f114f888b4fe10465a1b4f4ec4df010ef09c93e059d60debd89dfe774be3d15cd32bd25b0806478ffd656350527bea69b21f8ad53353153adce7aec20e67d9611fe669b9f719a4d22a93cc2a7778cd1674a5be39b3d5cde6204f881a12b7134da88ddb56f7f8af00f9f661e1ca902e77af277d8424ff3311a468703ba1af090d3e465ccee2c6ee4706d1d2dbd22f3926b42becb50223af3725b7f12b073c5f06a3ad7ac275bea5c09a0aa7bc4e28f890232b0b25926b88d3dea943f0ab530af911a50d743304d415025c66aa8839c737ea0ac9ce0fab89501027393e383088cdebe72c6c5424bfe4d5ecedd0261e8dbf1212f3eff433271276d29782fa8c674691eec19c421842d252c8eeecef602e36cd8995d469f180f37e6f5d1361ea5f7eb1ea4925edd35a7cbfde1b4f1f01ae0d477b57c1c7ab5d1e047edd33f965c5409039a94fd16f0a94a43a6bbf757200d75f0e2f2a2b4edc18afa0f67a3685fa9b830f67456e13899ef8f45fb22724a06df17af36bc4873bc1b67ab78840197bc6be98f812d937743d069e9882e40c29b2287f0cf7441168a94e42f3243f7b6ac5dd7c02342ba3c01ba8021cbe1f4d624be5f7c38ebb2fc389de0b7fb6890944f06e4910398d2b8e4e1561da615e93e5e67f1ecd6fbc02b039b552e49cf107377be2a4d823c3dad806d75ccd2787b72b34afe43e23dc7af9ef32518ffbe729e87b33b6f9383a9624d9a179d2a759fdbd6804a55769f406749bd8255189b50065f94dfec971955a35fbf32a4dc828bf5ed42726de78b2e57b4cf9b85d35ca88ad91ad2f04d2dfa9b6553d0762870cb3d10e5e1baed54c309b5b2ef8d8c979c4f7dd4389176f4fbb9c3536a8174d8bc7397918af80e9e179691d7ecd78b2c090407d96316486bf5eb147eea7c05b0d4d57e4a15712a0c4218c9907a0e49227da0695bb3151934af5226d970ccef3d23bf1079b66e110ab6f94739723eeb23695be98117e83d74caceb0d13696ad26e0dc67f14a4163ba8b61ee5054eea376e40414918589005a5e8b751b2d863f730c306b5836b1b5006d8184be9a72da1ab6e79379b50bd8ceb246401ab01dc3214513d54bcb323800d0ab1ba318efcfd8a835c5d400464f145b03821c7661871bf6008f96e6f68beb7f1bed7585312a1da8004c23f80e012a78f7252f32bb39f8ca940c1b45b2e915a9bdf55b4a84e7fcc8f944e17820f7b32cec59e548b8c565bc8ff43fda60ce929de203d514814cae83daade95ff5a6b3dfadee550819db2bbd7d48c3d92bcb188358f9e01e32397e7e44f94654c18f6432c65851e710e5020facfa0bf0da2c182425eb97f9aa950e1010418baa7b03a6cab5b5c73aaf20786c8f7788e92e7e190c0b1b28e7571d06c64f3de1c9b29139a655a98d42701031180889710bcae3103fe68b7045bd88bbcb2de864d3cfd3322622b4a98c1922f56634109a73657b81b18915536ce4ba6edae1773d132ffafecdca8608eb6b0d489d860222a3dafc09c4d5a19c3669731b4d45e4a673e1e5f9f2f70da95d8d0ce25a53c67192cb6ec9444e25b1a922dcba9293b31be104f6eada5ca37c1f82b3b10b1ca2edbd04be1bf472a01609e10ecec426cfb5a6c3e4e4aeff6a1544290d6eebca17964ae5488aa3fee772e1aeabc2c0308f4095b75f0120d890aae5eebdd68c00617f48a1875a94e3d232ec31b86a78892563f640009a4020fb0e8510b4602bf2ce6e2de70f4a8a3e93db0fd835680ee5d9a1ad880bd34669fd1fc7bc6367894482a754ce790d3662919312a3f14c5628afc7d447770db8ef97c91d10dbde5cf230b56e67eae84e6367b3e468cb794ae7824dd18ff11389017eb4a4fe2fdb51069fb29b7dd1f1bb4ddf1554889dc100da17f8b14ceee3286fd10b41c61bb7de014ab11991a94be41185f130f960eb3f2f9903d74ee30065b4e66a4766a485948679bd4a70583ac2ff4926170b3c1804d9b2e3578ead2414fe38de3ed8b03edf86d943d8ebb13e85963b4e63cd70810a9adc8ba2a98c3e074099c13f6d43f26e03d7946008d554938420823d8c1eeb32a9c252deaefc99f6b2b1bf46f4d7f0620153bbf456102603e401925acd0664b27cefcf39aa6056c4007cd4fa79490db80616b5410dbb6245d3f851b698643c2e47e74bc382c7bac73340fc315949baa8a45497996fb4b2a9a54c4242802376bd9030c9288a361355c5d56db296d7f9c9f8b107bbaab17a0a492972462471b40440fa82f2a872c44287e886275be977a79f60ec9c8b468919358355d9062957d3614602b652cd454448d22670d920b10fa90da3a2a0b8edd8c4549b532e6774cf82dbfca253183162d8bcdc78b2ac11dbbb436c096b8efce6243a21b43b5a8bcf022a100e0c1b2d3973563f8ed6aa1a0eaa7a05ab9b730bb3139ae018d",
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
        const readPledge = await sdk.ontFs.getFileReadPledge("SeNKDywBHnxxmyVht97oFZZEahteCuNMDS8RbBBzmLugjYAy", sdk.account.address)
        console.log('readPledge', readPledge)
    }, testTimeout);

    test('test sdk cancel read file pledge', async () => {
        await init()
        await expect(sdk.cancelFileRead("SeNKDywBHnxxmyVht97oFZZEahteCuNMDS8RbBBzmLugjYAd")).resolves.toBeUndefined()
    }, testTimeout);


    test('test sdk get file pdp record', async () => {
        await init()
        const pdpList = await sdk.getFilePdpInfoList("SeNKDywBHnxxmyVht97oFZZEahteCuNMDS8RbBBzmLugjYAy")
        console.log('pdpList', pdpList)
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

    test('test sdk get node info', async () => {
        await init()
        const nodeInfo = await sdk.ontFs.getNodeInfo("ALQ6RWJENsELE7ATuzHz4zgHrq573xJsnM")
        console.log('nodeinfo', nodeInfo)
    }, testTimeout);



    test('test sdk gen and verify settle slice', async () => {
        await init()
        const settleSlice = await sdk.ontFs.genFileReadSettleSlice(
            "SeNKDywBHnxxmyVht97oFZZEahteCuNMDS8RbBBzmLugjYAd",
            "ALQ6RWJENsELE7ATuzHz4zgHrq573xJsnM",
            1,
            1
        )
        console.log('settleSlice', settleSlice)
        let newSettle = {
            fileHash: hexstr2str(settleSlice.fileHash),
            payFrom: new Address(settleSlice.payFrom.toBase58()),
            payTo: new Address(settleSlice.payTo.toBase58()),
            sliceId: settleSlice.sliceId,
            pledgeHeight: settleSlice.pledgeHeight,
            sig: settleSlice.sig.serializeHex(),
            pubKey: settleSlice.pubKey.serializeHex(),
        }
        console.log('new settle', newSettle)
        const verified = await sdk.ontFs.verifyFileReadSettleSlice(newSettle)
        console.log("verified", verified)
    }, testTimeout);

})