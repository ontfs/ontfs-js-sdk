# OntFs SDK JS Api

## 介绍
本文档是OntFs Sdk的JS接口文档

```javascript
<!-- ontfs-js-sdk 浏览器端使用引用 -->
<script type="text/javascript" src="./dist/ontfs-js-sdk.js"></script>
```

## SDK接口列表
| Method | Parameters | Description | Note |
| :---| :---| :---| :---|
| [startsdk](#0-startsdk) | sdk_option,account | 启动sdk服务 | sdk_option参数见文件上传选项定义 |
| [uploadfile](#1-uploadfile) | upload_option | 上传文件 | upload_option参数见文件上传选项定义 |
| [downloadfile](#2-downloadfile) | download_option | 下载文件 | download_option参数文件下载选项定义 |
| [resumetask](#3-resumetask) | task_id | 恢复任务 |  |
| [deletetask](#4-deletetask) | task_id | 删除任务 |  |
| [getuploadtaskinfobyid](#5-getuploadtaskinfobyid) | task_id | 查询上传任务信息 |  |
| [getdownloadtaskinfobyid](#6-getdownloadtaskinfobyid) | task_id | 查询下载任务信息 |  |
| [getalluploadtasklist](#7-getalluploadtasklist) | | 查询全部上传任务列表 |  |
| [getalldownloadtasklist](#8-getalldownloadtasklist) | | 查询全部下载任务列表 |  |
| [decryptfile](#9-decryptfile) | decrypt_option | 解密文件 | decrypt_option参数文件解密选项定义 |
| [renewfile](#10-renewfile) | file_hash,add_time | 文件续费 |  |
| [deletefiles](#11-deletefiles) | [file_hash1,file_hash2] | 批量删除文件 |  |
| [getfileinfo](#12-getfileinfo) | file_hash | 查询单个已上传的文件信息 |  |
| [getfilelist](#13-getfilelist) | | 查询单用户所有文件列表 |  |
| [changefileowner](#14-changefileowner) | file_hash,new_owner | 更改文件所有权 |  |
| [getfilereadpledge](#15-getfilereadpledge) | file_hash | 查询下载文件在合约中的质押情况 |  |
| [cancelfilereadpledge](#16-cancelfilereadpledge) | file_hash | 从下载文件合约质押中提款 |  | 
| [getfilepdpinfolist](#17-getfilepdpinfolist) | file_hash | 查询文件的pdp证明记录信息 |  |
| [challenge](#18-challenge) | file_hash,node_addr | 向文件的指定存储节点发起挑战 |  |
| [judge](#19-judge) | file_hash,node_addr | 请求执行挑战判定 |  |
| [getchallengelist](#20-getchallengelist) | file_hash | 查询用户对指定文件发起过的挑战列表(可能对一个文件的多个节点发起了挑战) |  |
| [getspaceinfo](#21-getspaceinfo) | |获取用户空间信息 |  |
| [createspace](#22-createspace) | volume,copy_num,time_expired | 创建用户空间 |  |
| [deletespace](#23-deletespace) | | 删除用户空间 |  |
| [updatespace](#24-updatespace) | volume,time_expired | 更新用户空间 |  |
| [getfsnodeslist](#25-getfsnodeslist) | limit | 获取存储节点信息列表 |  |


### 0. startsdk

```javascript
const sdk_option = {
    walletPwd: password,
    chainRpcAddr: rpcAddr,
    gasPrice: 500,
    gasLimit: 400000,
    pdpVersion: 1
}
const s = await ontfs.SDK.initSdk(sdk_option, account)
ontfs.SDK.setGlobalSdk(s)
await s.start()
```

#### 启动sdk选项 sdk_option 定义

| 参数名              | 类型      | 是否必须  | 说明                                        |
| ------------------ | -------- | -------- | ------------------------------------------ |
| ChainRpcAddr       | string   | required | 本体rpc地址                                 |
| WalletPath         | string   | required | 钱包文件目录                                 |
| WalletPwd          | string   | required | 钱包密码                                    |
| GasPrice           | number   | required | GasPrice                                  |
| GasLimit           | number   | required | GasLimit                                  |
| PdpVersion         | number   | required | PDP版本号                                  |
| P2pProtocol        | string   | required | p2p协议类型                                 |
| P2pListenAddr      | string   | required | p2p协议监听地址                              |
| P2pNetworkId       | number   | required | p2p网络标示ID，P2pNetworkId应当与ontfs网络的network id保持一致 |
| BlockConfirm       | number   | required | 等待区块确认数                               |

### 1. uploadfile

```javascript
const upload_option = new ontfs.Types.TaskUploadOption()
upload_option.filePath = document.getElementById('desc').value// file path of the file
upload_option.fileContent = evt.target.result// ArrayBuffer of file content
upload_option.fileDesc = document.getElementById('desc').value // file name or file description
upload_option.fileSize = evt.total // file real size
upload_option.storageType = parseInt(document.getElementById('storeType').value) // file store type
upload_option.copyNum = parseInt(document.getElementById('copyNum').value) // file copy number
upload_option.firstPdp = document.getElementById('firstPdp').value == 'true' // first pdp or not
upload_option.timeExpired = parseInt(Date.parse(document.getElementById('timeExpired').value) / 1000)  // file expired timestamp
upload_option.encPassword = document.getElementById('encPassword').value // encrypt password
const taskID = await ontfs.TaskManage.globalTaskMgr().addTask(upload_option).catch((e) => {console.log('e', e)})
```

#### 上传文件选项 upload_option 定义：

| 参数名              | 类型      | 是否必须  | 说明    |
| ------------------ | -------- | -------- | ------- |
| filePath           | string   | required | 文件目录 |
| fileContent        | ArrayBuffer| required | 文件内容AB |
| fileDesc           | string   | required | 文件描述 |
| fileSize           | number   | required | 文件真实大小 |
| timeExpired        | number   | required | 文件过期时间，unix时间戳 |
| firstPdp           | bool     | required | 是否需要等待存储节点提交一次PDP, 才允许下载; default: true |
| PdpInterval        | number   | required | Pdp证明提交间隔，建议为4 * 60 * 60 即4小时，如果网络内所有存储节点的MinPdpInterval都小于此值，则无法找到可用服务器 |
| copyNum            | number   | required | 文件备份数量 |
| storageType        | number   | required | 存储类型：0表示租户模式; 1表示文件租用模式 |
| encPassword    | string   | required | 加密密码 |

### 2. downloadfile

```javascript
const download_option = new ontfs.Types.TaskDownloadOption()
download_option.fileHash = hash // file hash to download
download_option.inOrder = true // in order or not, only support true now
download_option.maxPeerCnt = parseInt(document.getElementById("maxPeerCnt").value) // max peer for download
download_option.decryptPwd = document.getElementById("decryptPwd").value // decrypt password
/* 
* receive block callback
* {ArrayBuffer} data: block data
* {number} block data length
* {number} block data position offset of file
*/
const datas = []
let totalLen = 0
let offsetByIndex = {}
download_option.receiveBlock = (data, length, position) => {
    offsetByIndex[datas.length] = position
    const ab = new Uint8Array(data, position, data.length)
    datas.push(ab)
    totalLen += ab.byteLength
}
const taskID = await ontfs.TaskManage.globalTaskMgr().addTask(download_option).catch((e) => {console.log('e', e)})
```

#### 文件下载选项 download_option 定义
| 参数名      | 类型   | 是否必须 | 说明                                         |
| ----------- | ------ | -------- | -----------------------------------------|
| fileHash    | string | required | 文件哈希                                  |
| inOrder     | bool   | required | 是否按文件块顺序下载，暂只支持true            |
| maxPeerCnt  | number | required | 下载文件的最多存储节点源数量                  |
| decryptPwd  | string | required | 解密密码                                  |
| receiveBlock| callback| required| 文件块接收回调处理函数                      |

### 3. resumetask

恢复任务

```javascript
const task = ontfs.TaskManage.globalTaskMgr().resumeTask(taskID)
```

### 4. deletetask

删除任务

```javascript
const task = ontfs.TaskManage.globalTaskMgr().delTask(taskID)
```

### 5. getuploadtaskinfobyid

查询上传任务信息

```javascript
const task = ontfs.TaskManage.globalTaskMgr().getUploadTaskByTaskId(taskID)
```

#### 单一上传任务task字段描述
| 参数名                        | 类型      | 说明    |
| ---------------------------- | -------- | ------- |
| TaskOption.FilePath          | string   | 文件路径 |
| TaskOption.FileDesc          | string   | 文件描述 |
| TaskOption.FileSize          | number   | 文件大小 |
| TaskOption.StorageType       | number   | 存储模式，0:空间租赁 1:按文件 |
| TaskOption.CopyNum           | number   | 文件备份数 |
| TaskOption.FirstPdp          | bool   | 是否需要等待存储节点提交一次PDP, 才允许下载; default: true |
| TaskOption.PdpInterval       | number   | PDP提交间隔，单位秒; default: 14400 |
| TaskOption.TimeExpired       | number   | 文件过期时间的unix时间戳 |
| TaskOption.EncPassword       | string   | 文件加密密码 |
| TaskBaseInfo.TaskID          | string   | 任务ID |
| TaskBaseInfo.Status          | number   | [上传任务状态](#上传任务状态) |
| TaskBaseInfo.Progress        | number   | [上传任务进度](#上传任务进度) |
| TaskBaseInfo.ErrorInfo       | string   | 错误信息 |
| TaskBaseInfo.BlockCount      | number   | 文件块数 |
| TaskBaseInfo.BlockHashes     | []string | 文件块哈希数组 |
| TaskBaseInfo.FileHash        | string   | 文件哈希 |
| TaskBaseInfo.FilePrefix      | string   | 文件前缀 |
| TaskBaseInfo.PdpHashData     | string   | PDP哈希数据 |
| TaskBaseInfo.StoreTxHash     | string   | 文件信息上链合约交易哈希 |
| TaskBaseInfo.StoreTxHeight   | number   | 文件信息上链合约交易块高 |
| TaskBaseInfo.FileReceivers   | object   | 存储节点接收者信息，map: {peerNetAddr: peerWalletAddr} |
| TaskBaseInfo.AllOffset       | string   | 所有文件块偏移量 |
| TaskSendDetails              | object   | 文件发送详情，map: {peerNetAddr: {Index, PeerWalletAddr}} |

#### 上传任务状态
|值|内容|含义|
|---|---|---|
0|TaskStart|开始
1|TaskPause|暂停
2|TaskFinish|完成

#### 上传任务进度
|值|内容|含义|
|---|---|---|
0|Upload_AddTask|开启任务
1|Upload_FsAddFile|文件分块
2|Upload_FsGetPdpHashData|生成PDP证明信息
3|Upload_ContractStoreFiles|在合约中记录文件信息
4|Upload_FindReceivers|寻找文件接收节点
5|Upload_FilePreTransfer|预传输
6|Upload_FileTransferBlocks|传块中
7|Upload_WaitPdpRecords|等待存储节点的PDP证明记录
8|Upload_Done|上传完成
9|Upload_Error|上传错误

### 6. getdownloadtaskinfobyid

查询下载任务信息

```javascript
const task = ontfs.TaskManage.globalTaskMgr().getDownloadTaskByTaskId(taskID)
```

#### 单一下载任务task字段描述
| 参数名                                 | 类型      | 说明     |
| ------------------------------------- | -------- | -------- |
| TaskOption.FileHash                   | string   | 文件哈希 |
| TaskOption.InOrder                    | bool     | 是否按文件块顺序下载 |
| TaskOption.MaxPeerCnt                 | number   | 寻找下载源限制的最大存储节点数 |
| TaskOption.OutFilePath                | string   | 下载文件存放目录 |
| TaskOption.DecryptPwd                 | string   | 文件解密密码 |
| TaskBaseInfo.TaskID                   | string   | 任务ID |
| TaskBaseInfo.Status                   | number   | [下载任务状态](#下载任务状态) |
| TaskBaseInfo.Progress                 | number   | [下载任务进度](#下载任务进度) |
| TaskBaseInfo.ErrorInfo                | string   | 错误信息 |
| TaskBaseInfo.ReadPlanTx               | string   | 下载质押交易哈希 |
| TaskBaseInfo.FileDesc                 | string   | 文件描述 |
| TaskBaseInfo.FilePrefix               | string   | 文件前缀 |
| TaskBaseInfo.PdpHashData              | string   | 文件PDP哈希数据 |
| TaskBaseInfo.FileBlockHashes          | string   | 文件块哈希列表 |
| TaskBaseInfo.FileBlockCount           | number   | 文件块数 |
| TaskBaseInfo.FileServerNetAddrs       | object   | 寻找到的存储节点网络地址列表 |
| TaskBaseInfo.AllOffset                | string   | 所有文件块偏移量 |
| TaskDownloadInfo.NextIndex            | number   | 已下载文件块索引 |
| TaskDownloadInfo.BlockReceiveDetails  | object   | 已接收文件块详情，具体字段见下面描述 |
| TaskDownloadInfo.BlockReceiveDetails[peerNetAddr].StartIndex  | number   | ？ |
| TaskDownloadInfo.BlockReceiveDetails[peerNetAddr].CurrReqSliceCount  | number   | ？ |
| TaskDownloadInfo.BlockReceiveDetails[peerNetAddr].TotalReqSliceCount  | number   | ？ |
| TaskDownloadInfo.BlockReceiveDetails[peerNetAddr].PeerWallet  | string   | 下载文件源存储节点钱包地址 |

#### 下载任务状态
|值|内容|含义|
|---|---|---|
0|TaskStart|开始
1|TaskPause|暂停
2|TaskFinish|完成

#### 下载任务进度
|值|内容|含义|
|---|---|---|
0|Download_AddTask|开启任务
1|Download_FsFoundFileServers|寻找可下载文件的存储节点
2|Download_FsReadPledge|下载质押
3|Download_FsBlocksDownloadOver|文件块下载完成
4|Download_Done|下载完成
5|Download_Error|下载错误

### 7. getalluploadtasklist

查询全部上传任务列表

### 8. getalldownloadtasklist

查询全部下载任务列表

### 9. decryptfile

解密文件

```javascript
const tx = await ontfs.SDK.globalSdk().decryptDownloadedFile(fileContent, decryptPwd)
```

### 10. renewfile

文件续费

```javascript
const tx = await ontfs.SDK.globalSdk().renewFile(fileHash, addTime)
```

#### 接口请求字段解析:
| 参数名              | 类型      | 是否必须  | 说明                                       |
| ------------------ | -------- | -------- | ----------------------------------------- |
| FileHash           | string   | required | 文件哈希                                   |
| AddTime            | number   | required | 续费增加时间，单位秒                         |

### 11. deletefiles

批量删除文件

```javascript
const tx = await ontfs.SDK.globalSdk().deleteFiles([fileHash])
```

### 12. getfileinfo

查询单个已上传的文件信息

```javascript
const fileInfo = await ontfs.SDK.globalSdk().getFileInfo(fileHash)
```

#### 文件信息fileInfo字段解析
| 参数名                | 类型      | 说明                                        |
| -------------------- | -------- | ------------------------------------------- |
| FileHash             | string   | 文件哈希                                     |
| FileOwner            | string   | 文件所有者钱包地址                             |
| FileDesc             | string   | 文件描述                                     |
| FileBlockCount       | number   | 文件块数                                     |
| RealFileSize         | string   | 真实文件大小                                  |
| CopyNumber           | number   | 文件备份数                                   |
| PayAmount            | string   | ?                                          |
| RestAmount           | string   | ?                                          |
| FileCost             | string   | ?                                          |
| PdpInterval          | number   | PDP间隔，单位秒                              |
| TimeStart            | string   | 文件存储开始时间                              |
| TimeExpired          | string   | 文件存储过期时间                              |
| PdpParam             | string   | 文件PDP参数                                  |
| ValidFlag            | bool     | 是否有效                                     |
| StorageType          | number   | 存储模式，0:空间租赁 1:按文件                   |

### 13. getfilelist

查询单用户所有文件列表

```javascript
const fileHashes = await ontfs.SDK.globalSdk().getFileList()
```

### 14. changefileowner

更改文件所有权

```javascript
const tx = await ontfs.SDK.globalSdk().changeOwner(fileHash, newOwner)
```

#### 接口请求字段解析:
| 参数名              | 类型        | 是否必须  | 说明                                       |
| ------------------ | ---------- | -------- | ----------------------------------------- |
| FileHash           | string     | required | 文件哈希                                    |
| NewOwner         | string     | required | 新文件所有者钱包地址                         |

### 15. getfilereadpledge

查询下载文件在合约中的质押情况

```javascript
const readPledge = await ontfs.SDK.globalSdk().getFileReadPledge(fileHash)
```

#### 接口响应readPledge字段解析
| 参数名                         | 类型       | 说明                                       |
| ----------------------------- | ---------- | ----------------------------------------- |
| FileHash                      | string     | 文件哈希                                    |
| Downloader                    | string     | 下载质押者钱包地址                            |
| BlockHeight                   | number     | 质押开始块高                                 |
| ExpireHeight                  | number     | 质押过期块高                                 |
| RestMoney                     | number     | 质押剩余金额                                 |
| ReadPlans                     | []object   | 质押计划                                   |
| ReadPlans[n].NodeAddr         | string     | 存储节点钱包地址                            |
| ReadPlans[n].MaxReadBlockNum  | number     | ?                                         |
| ReadPlans[n].HaveReadBlockNum | number     | ?                                         |

### 16. cancelfilereadpledge

从下载文件合约质押中提款

```javascript
const tx = await ontfs.SDK.globalSdk().cancelFileRead(fileHash)
```

### 17. getfilepdpinfolist

查询文件的pdp证明记录信息

```javascript
const pdpRecordList = await ontfs.SDK.globalSdk().getFilePdpRecordList(fileHash)
```

#### 接口响应pdpRecordList字段解析
| 参数名                         | 类型        | 说明                                       |
| ----------------------------- | ---------- | ----------------------------------------- |
| [n].NodeAddr                  | string     | 存储节点钱包地址                             |
| [n].FileHash                  | string     | 文件哈希                                    |
| [n].FileOwner                 | string     | 文件所有者钱包地址                            |
| [n].PdpCount                  | number     | PDP提交次数                                 |
| [n].LastPdpTime               | string     | 上次PDP提交时间                              |
| [n].NextHeight                | number     | 下次PDP提交块高                              |
| [n].SettleFlag                | bool       | 是否已清算                                   |

### 18. challenge

向文件的指定存储节点发起挑战

```javascript
const tx = await ontfs.SDK.globalSdk().challenge(fileHash, walletAddr)
```

#### 接口请求字段解析:
| 参数名              | 类型        | 是否必须  | 说明                                       |
| ------------------ | ---------- | -------- | ----------------------------------------- |
| FileHash           | string     | required | 指定挑战文件存在性证明的文件哈希                |
| WalletAddr         | string     | required | 指定挑战文件存在性证明的节点地址                |

### 19. judge

当节点未在规定时间内响应挑战时，请求合约执行挑战结果判定


```javascript
const tx = await ontfs.SDK.globalSdk().judge(fileHash, walletAddr)
```
#### 接口请求字段解析:
| 参数名              | 类型        | 是否必须  | 说明                                       |
| ------------------ | ---------- | -------- | ----------------------------------------- |
| FileHash           | string     | required | 指定挑战文件存在性证明的文件哈希                |
| WalletAddr         | string     | required | 指定挑战文件存在性证明的节点地址                |

### 20. getchallengelist

查询用户对指定文件发起过的挑战列表(可能对一个文件的多个节点发起了挑战)

```javascript
const challengeList = await ontfs.SDK.globalSdk().getFileChallengeList(fileHash)
```

#### 接口响应challengeList字段解析
| 参数名              | 类型      | 说明                                       |
| ------------------ | -------- | ----------------------------------------- |
| [n].FileHash       | string   | 文件哈希                                    |
| [n].FileOwner      | string   | 文件所有者钱包地址                            |
| [n].NodeAddr       | string   | 挑战存储节点钱包地址                          |
| [n].ChallengeHeight| number   | 挑战时的区块高度                             |
| [n].Reward         | number   | 挑战奖励                                    |
| [n].ExpiredTime    | number   | 挑战过期的unix时间戳                          |
| [n].State          | number   | [与挑战相关的几个状态](#与挑战相关的几个状态)     |

#### 与挑战相关的几个状态

|值|内容|含义|
|---|---|---|
0   |Judged             | 因节点没有在规定期限内响应challenge，sdk要求合约做出判定后的状态
1   |NoReplyAndValid    | 未到规定期限，但节点也还没有响应challenge
2   |NoReplyAndExpire    |已到规定期限，节点还未对challenge做出响应
3   |RepliedAndSuccess   |节点对challenge做出相应并且验证成功
4   |RepliedButVerifyError  |节点对challenge做出响应但验证失败
5   |FileProveSuccess    |节点之前对challenge未做出响应或响应失败后，节点按期提交的pdp证明成功，表示文件依然存储正常

### 21. getspaceinfo

```javascript
const spaceInfo = await ontfs.SDK.globalSdk().getSpaceInfo()
```

#### 接口响应spaceInfo字段解析
| 参数名              | 类型      | 说明                                       |
| ------------------ | -------- | ----------------------------------------- |
| SpaceOwner         | string   | 空间所有者地址                               |
| Volume             | string   | 空间大小                                    |
| RestVol            | string   | 空间剩余大小                                 |
| CopyNumber         | number   | 空间内文件的备份数                            |
| PdpInterval        | number   | PDP证明间隔                                 |
| PayAmount          | string   | 支付金额                                    |
| RestAmount         | string   | 剩余金额                                    |
| TimeStart          | string   | 开始时间                                    |
| TimeExpired        | string   | 过期时间                                    |
| ValidFlag          | bool     | 是有有效                                    |

### 22. createspace

```javascript
const spaceInfo = await ontfs.SDK.globalSdk().createSpace(volume, copyNum, timeExpired)
```

#### 接口请求字段解析
| 参数名              | 类型        | 是否必须  | 说明                                       |
| ------------------ | ---------- | -------- | ----------------------------------------- |
| Volume             | number     | required | 空间大小                                    |
| CopyNum            | number     | required | 空间内文件备份数                             |
| TimeExpired        | number     | required | 空间过期的unix时间戳                         |

#### 接口响应spaceInfo字段解析
| 参数名              | 类型      | 说明                                       |
| ------------------ | -------- | ----------------------------------------- |
| SpaceOwner         | string   | 空间所有者地址                               |
| Volume             | string   | 空间大小                                    |
| RestVol            | string   | 空间剩余大小                                 |
| CopyNumber         | number   | 空间内文件的备份数                            |
| PdpInterval        | number   | PDP证明间隔                                 |
| PayAmount          | string   | 支付金额                                    |
| RestAmount         | string   | 剩余金额                                    |
| TimeStart          | string   | 开始时间                                    |
| TimeExpired        | string   | 过期时间                                    |
| ValidFlag          | bool     | 是有有效                                    |

### 23. deletespace

```javascript
const tx = await ontfs.SDK.globalSdk().deleteSpace()
```

### 24. updatespace

```javascript
const tx = await ontfs.SDK.globalSdk().createSpace(volume, timeExpired)
```

#### 接口请求字段解析:
| 参数名              | 类型        | 是否必须  | 说明                                       |
| ------------------ | ---------- | -------- | ----------------------------------------- |
| Volume             | number     | required | 空间大小                                    |
| TimeExpired        | number     | required | 空间过期的unix时间戳                         |


### 25. getfsnodeslist

```javascript
const fsNodesList = await ontfs.SDK.globalSdk().getFsNodesList(limit)
```

#### 接口请求字段解析:
| 参数名              | 类型        | 是否必须  | 说明                                       |
| ------------------ | ---------- | -------- | ----------------------------------------- |
| Limit              | number     | option   | 限制最大返回记录条数                         |

#### 接口响应fsNodesList字段解析
| 参数名              | 类型      | 说明                                       |
| ------------------ | -------- | ----------------------------------------- |
| [n].Pledge         | number   | 存储节点质押金额                             |
| [n].Profit         | number   | 存储节点利润金额                             |
| [n].Volume         | string   | 存储节点空间容量                             |
| [n].RestVol        | string   | 存储节点剩余空间容量                          |
| [n].ServiceTime    | string   | 存储节点服务过期时间                          |
| [n].MinPdpInterval | number   | 存储节点最小PDP间隔                          |
| [n].NodeAddr       | []object | 存储节点钱包地址                             |
| [n].NodeNetAddr    | string   | 存储节点网络地址                             |


### 错误代码

|错误码|内容|含义|
|---|---|---|
0|SUCCESS               |成功
41001|SESSION_EXPIRED   |无效或超时的会话
41002|SERVICE_CEILING   |达到服务上限
41003|ILLEGAL_DATAFORMAT|不合法的数据格式
41004|INVALID_VERSION   |无效的版本号
42001|INVALID_METHOD        |无效的方法
42002|INVALID_PARAMS        |无效的参数
42003|INVALID_PARAMS_LENGTH |参数长度不正确
43001|INVALID_CONFIG_TYPE           |配置文件类型不正确
43002|INVALID_FILEHASH_TYPE         |文件类型错误
43003|INVALID_UPLOAD_OPTION_TYPE    |上传参数错误
43004|INVALID_DOWNLOAD_OPTION_TYPE  |下载参数错误
43005|INVALID_FILE_URL_TYPE         |文件url类型错误
43006|INVALID_FILEHASHES_TYPE       |文件Hash列表类型错误
43007|INVALID_ADD_TIME_TYPE         |新增时间类型错误
43008|INVALID_OWNER_TYPE            |所有权拥有者类型错误
43009|INVALID_LIMIT_TYPE            |最大限制类型错误
43010|INVALID_VOLUME_TYPE           |容量类型错误
43011|INVALID_COPY_NUM_TYPE         |文件备份数量类型错误
43012|INVALID_TIME_EXPIRED_TYPE     |过期时间类型错误
44001|INTERNAL_ERROR        |内部错误
44002|INVOKE_CONTRACT_ERROR |智能合约执行错误
45001|SDK_NOT_STARTED       |sdk没有初始化
45002|SDK_ALREADY_STARTED   |sdk已经完成初始化