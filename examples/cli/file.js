const flags = require("./flags")
const { globalSdk } = require("../../sdk")
const api = require("../apis")

const startSDK = async (argv) => {
    return api.startSDK(argv)
}

const uploadFile = async (argv) => {
    // start sdk
    const success = await startSDK(argv)
    if (!success) {
        console.log('start sdk failed')
        return
    }
    await api.uploadFile(argv)

    await globalSdk().stop().catch((err) => {
        console.log('stop err', err.toString())
    })
}


const downloadFile = async (argv) => {
    // start sdk
    const success = await startSDK(argv)
    if (!success) {
        console.log('start sdk failed')
        return
    }
    await api.downloadFile(argv)

    await globalSdk().stop().catch((err) => {
        console.log('stop err', err.toString())
    })
}


const deleteFile = async (argv) => {
    // start sdk
    const success = await startSDK(argv)
    if (!success) {
        console.log('start sdk failed')
        return
    }
    await api.deleteFile(argv)
    await globalSdk().stop().catch((err) => {
        console.log('stop err', err.toString())
    })
}

const getFileList = async (argv) => {
    // start sdk
    const success = await startSDK(argv)
    if (!success) {
        console.log('start sdk failed')
        return
    }
    await api.getFileList(argv)

    await globalSdk().stop().catch((err) => {
        console.log('stop err', err.toString())
    })
}

const decryptFile = async (argv) => {
    // start sdk
    const success = await startSDK(argv)
    if (!success) {
        console.log('start sdk failed')
        return
    }
    await api.decryptFile(argv)
}



const renewFile = async (argv) => {
    // start sdk
    const success = await startSDK(argv)
    if (!success) {
        console.log('start sdk failed')
        return
    }
    await api.renewFile(argv)

    await globalSdk().stop().catch((err) => {
        console.log('stop err', err.toString())
    })
}


const getFileInfo = async (argv) => {
    // start sdk
    const success = await startSDK(argv)
    if (!success) {
        console.log('start sdk failed')
        return
    }

    await api.getFileInfo(argv)

    await globalSdk().stop().catch((err) => {
        console.log('stop err', err.toString())
    })
}


const changeFileOwner = async (argv) => {
    // start sdk
    const success = await startSDK(argv)
    if (!success) {
        console.log('start sdk failed')
        return
    }
    await api.changeFileOwner(argv)

    await globalSdk().stop().catch((err) => {
        console.log('stop err', err.toString())
    })
}



const getFileInfoReadPledge = async (argv) => {
    // start sdk
    const success = await startSDK(argv)
    if (!success) {
        console.log('start sdk failed')
        return
    }
    await api.getFileInfoReadPledge(argv)
    await globalSdk().stop().catch((err) => {
        console.log('stop err', err.toString())
    })
}

const pledge = async (argv) => {
    // start sdk
    const success = await startSDK(argv)
    if (!success) {
        console.log('start sdk failed')
        return
    }

    await api.pledge(argv)
    await globalSdk().stop().catch((err) => {
        console.log('stop err', err.toString())
    })
}


const cancelFileReadPledge = async (argv) => {
    // start sdk
    const success = await startSDK(argv)
    if (!success) {
        console.log('start sdk failed')
        return
    }
    await api.cancelFileReadPledge(argv)
    await globalSdk().stop().catch((err) => {
        console.log('stop err', err.toString())
    })
}



const getFilePdpInfoList = async (argv) => {
    // start sdk
    const success = await startSDK(argv)
    if (!success) {
        console.log('start sdk failed')
        return
    }
    await api.getFilePdpInfoList(argv)
    await globalSdk().stop().catch((err) => {
        console.log('stop err', err.toString())
    })
}


const challenge = async (argv) => {
    // start sdk
    const success = await startSDK(argv)
    if (!success) {
        console.log('start sdk failed')
        return
    }
    await api.challenge(argv)
    await globalSdk().stop().catch((err) => {
        console.log('stop err', err.toString())
    })
}


const judge = async (argv) => {
    // start sdk
    const success = await startSDK(argv)
    if (!success) {
        console.log('start sdk failed')
        return
    }
    await api.judge(argv)
    await globalSdk().stop().catch((err) => {
        console.log('stop err', err.toString())
    })
}


const getChallengeList = async (argv) => {
    // start sdk
    const success = await startSDK(argv)
    if (!success) {
        console.log('start sdk failed')
        return
    }
    await api.getChallengeList(argv)
    await globalSdk().stop().catch((err) => {
        console.log('stop err', err.toString())
    })
}


const uploadFileCmd = {
    command: 'upload',
    desc: 'upload a file',
    builder: (yargs) => yargs
        .option(flags.filePath.name, flags.filePath)
        .option(flags.fileDesc.name, flags.fileDesc)
        .option(flags.firstPdp.name, flags.firstPdp)
        .option(flags.timeExpired.name, flags.timeExpired)
        .option(flags.copyNum.name, flags.copyNum)
        .option(flags.storeType.name, flags.storeType)
        .option(flags.encryptPwd.name, flags.encryptPwd)
    ,
    handler: async (argv) => {
        argv._handled = true
        await uploadFile(argv)
    }
}


const downloadFileCmd = {
    command: 'download',
    desc: 'download a file',
    builder: (yargs) => yargs
        .option(flags.fileHash.name, flags.fileHash)
        // .option(flags.inorder.name, flags.inorder)
        // .option(flags.decryptPwd.name, flags.decryptPwd)
        .option(flags.maxPeerCnt.name, flags.maxPeerCnt)
        .option(flags.outFilePath.name, flags.outFilePath)
    ,
    handler: async (argv) => {
        await downloadFile(argv)
        argv._handled = true
    }
}

const deleteFileCmd = {
    command: 'delete',
    desc: 'delete a file',
    builder: (yargs) => yargs
        .option(flags.fileHash.name, flags.fileHash)
    ,
    handler: async (argv) => {
        argv._handled = true
        await deleteFile(argv)
    }
}


const listFileCmd = {
    command: 'list',
    desc: 'list upload files',
    builder: (yargs) => yargs
    ,
    handler: async (argv) => {
        argv._handled = true
        await getFileList(argv)
    }
}



const decryptFileCmd = {
    command: 'decrypt',
    desc: 'decrypt file from local encrypted file',
    builder: (yargs) => yargs
        .option(flags.filePath.name, flags.filePath)
        .option(flags.outFilePath.name, flags.outFilePath)
        .option(flags.decryptPwd.name, flags.decryptPwd)
    ,
    handler: async (argv) => {
        argv._handled = true
        await decryptFile(argv)
    }
}



const renewFileCmd = {
    command: 'renew',
    desc: 'renew file on ontology file system',
    builder: (yargs) => yargs
        .option(flags.fileHash.name, flags.fileHash)
        .option(flags.addTime.name, flags.addTime)
    ,
    handler: async (argv) => {
        argv._handled = true
        await renewFile(argv)
    }
}



const getFileInfoCmd = {
    command: 'info',
    desc: 'get file info',
    builder: (yargs) => yargs
        .option(flags.fileHash.name, flags.fileHash)
    ,
    handler: async (argv) => {
        argv._handled = true
        await getFileInfo(argv)
    }
}



const changeFileOwnerCmd = {
    command: 'changeowner',
    desc: 'change file owner on ontology file system',
    builder: (yargs) => yargs
        .option(flags.fileHash.name, flags.fileHash)
        .option(flags.walletAddr.name, flags.walletAddr)
    ,
    handler: async (argv) => {
        argv._handled = true
        await changeFileOwner(argv)
    }
}



const pledgeFileCmd = {
    command: 'pledge',
    desc: 'file read pledge on ontology file system',
    builder: (yargs) => yargs
        .option(flags.fileHash.name, flags.fileHash)
        .option(flags.walletAddr.name, flags.walletAddr)
        .option(flags.maxReadBlockNum.name, flags.maxReadBlockNum)
        .option(flags.haveReadBlockNum.name, flags.haveReadBlockNum)
    ,
    handler: async (argv) => {
        argv._handled = true
        await pledge(argv)
    }
}



const getFileReadPledgeCmd = {
    command: 'getfilereadpledge',
    desc: 'get file read pledge on ontology file system',
    builder: (yargs) => yargs
        .option(flags.fileHash.name, flags.fileHash)
    ,
    handler: async (argv) => {
        argv._handled = true
        await getFileInfoReadPledge(argv)
    }
}



const cancelReadPledgeFileCmd = {
    command: 'cancelreadpledge',
    desc: 'cancel file read pledge on ontology file system',
    builder: (yargs) => yargs
        .option(flags.fileHash.name, flags.fileHash)
    ,
    handler: async (argv) => {
        argv._handled = true
        await cancelFileReadPledge(argv)
    }
}



const getFilePdpInfoCmd = {
    command: 'pdpinfo',
    desc: 'get file pdp info list on ontology file system',
    builder: (yargs) => yargs
        .option(flags.fileHash.name, flags.fileHash)
    ,
    handler: async (argv) => {
        argv._handled = true
        await getFilePdpInfoList(argv)
    }
}



const challengeFileCmd = {
    command: 'challenge',
    desc: 'detects the presence of a specified file on a node',
    builder: (yargs) => yargs
        .option(flags.fileHash.name, flags.fileHash)
        .option(flags.nodeAddr.name, flags.nodeAddr)
    ,
    handler: async (argv) => {
        argv._handled = true
        await challenge(argv)
    }
}



const judgeFileCmd = {
    command: 'judge',
    desc: 'judge the challenge of a specified file on a node',
    builder: (yargs) => yargs
        .option(flags.fileHash.name, flags.fileHash)
        .option(flags.nodeAddr.name, flags.nodeAddr)
    ,
    handler: async (argv) => {
        argv._handled = true
        await judge(argv)
    }
}



const getChallengeListFileCmd = {
    command: 'getChallengeList',
    desc: 'get challenge info list from contract',
    builder: (yargs) => yargs
        .option(flags.fileHash.name, flags.fileHash)
    ,
    handler: async (argv) => {
        argv._handled = true
        await getChallengeList(argv)
    }
}



const fileCmd = {
    command: 'file',
    desc: 'file command',
    builder: (yargs) => yargs
        .command(uploadFileCmd)
        .command(downloadFileCmd)
        .command(decryptFileCmd)
        .command(deleteFileCmd)
        .command(renewFileCmd)
        .command(listFileCmd)
        .command(getFileInfoCmd)
        .command(changeFileOwnerCmd)
        // .command(pledgeFileCmd)
        .command(getFileReadPledgeCmd)
        .command(cancelReadPledgeFileCmd)
        .command(getFilePdpInfoCmd)
        .command(challengeFileCmd)
        .command(judgeFileCmd)
        .command(getChallengeListFileCmd)
    ,
    handler: (argv) => {
        argv._handled = true
    }
}

module.exports = fileCmd