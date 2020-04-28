## OntFS-JS-SDK

> fs js sdk in node env.

### Dependency

- node.js >= 10
- npm >= 6.9.0
- yarn >= 1.15.2

### Install

```shell
$ cd ontfs-js-sdk
$ yarn install (or npm install)
```


#### Build project

##### config file is webpack.config.js

```shell
$ npm run build
```

> The project code will be integrated into the directory named dist


#### Examples on browser

> see details in `examples/browser`


#### Examples on node.js



##### Upload file

```javascript
// start sdk
const fs = require("fs")

// startSDK. start SDK 
const startSDK = async () => {
    // init config
    const password = 'pwd' // wallet password
    const rpcAddr = 'http://127.0.0.1:20336' // chain rpc address
    const walletObj = JSON.parse(fs.readFileSync("./wallet.dat").toString())
    const defAccountObj = walletObj.accounts[0]
    const { error, result } = OntSDK.importAccountWithWallet(
        defAccountObj.label,
        defAccountObj.key,
        defAccountObj.address,
        defAccountObj.salt,
        password)
    if (error != 0) {
        console.log('import account failed ', error)
        return false
    }
    const sdkCfg = {
        walletPwd: password,
        chainRpcAddr: rpcAddr,
        gasPrice: 500,
        gasLimit: 4000000,
        pdpVersion: 1
    }
    config.DaemonConfig = {
        fsRepoRoot: "./test/Fs", // fs repo path
        fsFileRoot: "./test/Download", // fs download file path
        fsType: 0
    }
    // init global task manager
    initTaskManage()

    const account = Account.parseJson(result)
    // init global sdk
    const s = await initSdk(sdkCfg, account)
    setGlobalSdk(s)
    await s.start()
    return true
}

 const success = await startSDK()
 if (!success) {
     console.log('start sdk failed')
     return
 }

 // init upload option
 const option = new types.TaskUploadOption()
 option.filePath = "./test.zip" // file path of the file
 option.fileContent = fs.readFileSync(option.filePath) // ArrayBuffer of file content
 option.fileDesc = "test.zip" // file name or file description
 const stat = fs.statSync(option.filePath) 
 option.fileSize = stat.size // file real size
 option.storageType = 1 // file store type
 option.copyNum = 1 // file copy number
 option.firstPdp = true // first pdp or not
 const nowTimeStamp = parseInt(new Date().getTime() / 1000)
 option.timeExpired = nowTimeStamp + 86400 // file expired timestamp
 option.encPassword =  "" // encrypt password

 // add task
 const taskID = await globalTaskMgr().addTask(option).catch((e) => {
     console.log('e', e)
 })
 console.log('add upload task success, taskID', taskID)
 // poll check if node has store the file commit PDP prove
 while (true) {
     await utils.sleep(1000)
     const task = globalTaskMgr().getUploadTaskByTaskId(taskID)
     if (!task.baseInfo.fileHash) {
         console.log("task not found", task.baseInfo)
         continue
     }
     const pdpRecordList = await globalSdk().ontFs.getFilePdpRecordList(task.baseInfo.fileHash).catch((err) => {})
     if (pdpRecordList && pdpRecordList.pdpRecords && pdpRecordList.pdpRecords.length) {
         console.log(`storage node has store the file ${task.baseInfo.fileHash}`, pdpRecordList)
         break
     } else {
         console.log(`storage node have not stored the file ${task.baseInfo.fileHash}`)
     }
 }

 // stop sdk
 await globalSdk().stop().catch((err) => {
     console.log('stop err', err.toString())
 })
```



##### Download file

```javascript
// start sdk
const fs = require("fs")

// startSDK. start SDK 
const startSDK = async () => {
    // init config
    const password = 'pwd' // wallet password
    const rpcAddr = 'http://127.0.0.1:20336' // chain rpc address
    const walletObj = JSON.parse(fs.readFileSync("./wallet.dat").toString())
    const defAccountObj = walletObj.accounts[0]
    const { error, result } = OntSDK.importAccountWithWallet(
        defAccountObj.label,
        defAccountObj.key,
        defAccountObj.address,
        defAccountObj.salt,
        password)
    if (error != 0) {
        console.log('import account failed ', error)
        return false
    }
    const sdkCfg = {
        walletPwd: password,
        chainRpcAddr: rpcAddr,
        gasPrice: 500,
        gasLimit: 4000000,
        pdpVersion: 1
    }
    config.DaemonConfig = {
        fsRepoRoot: "./test/Fs", // fs repo path
        fsFileRoot: "./test/Download", // fs download file path
        fsType: 0
    }
    // init global task manager
    initTaskManage()

    const account = Account.parseJson(result)
    // init global sdk
    const s = await initSdk(sdkCfg, account)
    setGlobalSdk(s)
    await s.start()
    return true
}

const success = await startSDK()
if (!success) {
    console.log('start sdk failed')
    return
}


// init upload option
const option = new types.TaskDownloadOption()
option.fileHash = 'Qme2mnhZPYM8y9pSjZPGpnMeqhJ858JDyo69if2ehRWNya' // file hash to download
option.inOrder = true // in order or not, only support true now
option.maxPeerCnt = 1 // max peer for download
option.outFilePath = './Downloads/file1' // out put file path
option.decryptPwd = '' // decrypt password
const stream = fs.createWriteStream(option.outFilePath, { mode: 0o666 });
stream.close()
const file = fs.openSync(option.outFilePath, 'r+', 0o666)
console.log("open success", option.outFilePath)
if (!file) {
    throw new Error(`[Combine] createDownloadFile error file is nil`)
}

/* 
* receive block callback
* {ArrayBuffer} data: block data
* {number} block data length
* {number} block data position offset of file
*/ 
option.receiveBlock = (data, length, position) => {
    fs.writeSync(file, data, 0, length, position)
}
console.log('option', option)
// add task
const taskID = await globalTaskMgr().addTask(option).catch((e) => {
    console.log('e', e)
})
console.log('add download task success, taskID', taskID)
// poll check if file has downloaded
while (true) {
    await utils.sleep(1000)
    const task = globalTaskMgr().getDownloadTaskByTaskId(taskID)
    if (task && task.baseInfo.progress == 4) {
        console.log(`file ${hash} download success`)
        break
    }
}
console.log(`done`)

await globalSdk().stop().catch((err) => {
    console.log('stop err', err.toString())
})
```





#### CLI Usage



##### Create wallet

```shell
$ cd ./examples/cli
$ node index.js account create --password=pwd
```

##### Upload files

```shell
$ cd ./examples/cli
$ node index.js file upload --filePath=./test.dat --desc=test -copyNum=1 --timeExpired="2020-04-25 00:00:00" --firstPdp=true --storeType=1
```

**batch upload files**

```shell
$ cd ./examples/cli
$ node index.js file upload --filePath=./test1.dat --desc="1" --firstPdp=true --timeExpired="2020-04-30 00:00:00" --copyNum=1 --storeType=1 --filePath=./test2.dat --desc="2" --firstPdp=true --timeExpired="2020-04-30 00:00:00" --copyNum=1 --storeType=1
```

##### Download file

```shell
$ cd ./examples/cli
$ node index.js file download --fileHash=bafkreih7wrw5icnbfq2cxl2jcpplgdwgxyxte4hnreg2i5qcxnzyr6xlma --outFilePath=./Downloads/test.dat
```

**batch download files**

```shell
$ cd ./examples/cli
$ node index.js file download --fileHash=bafkreih7wrw5icnbfq2cxl2jcpplgdwgxyxte4hnreg2i5qcxnzyr6xlma --outFilePath=./Downloads/test.dat --fileHash=bafkreicy6su74alclhq6fczi7ma6fysiaxq7yargmuqmyxwr2lafw3mx5y --outFilePath=./Downloads/test2.dat
```
