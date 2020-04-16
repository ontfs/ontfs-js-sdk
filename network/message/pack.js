const utils = require("../../utils")
const { MESSAGE_VERSION, MSG_TYPE_FILE, MSG_TYPE_BLOCK_FLIGHTS } = require("./const")



const encodeMsg = (msg, msgType) => {
    const msgId = utils.randomInt()
    const header = {
        Version: MESSAGE_VERSION,
        Type: msgType
    }
    const payload = utils.str2base64(JSON.stringify(msg))
    const encoded = {
        MessageId: msgId,
        Header: header,
        Payload: payload,
    }
    return encoded
}

const decodeMsg = (msg) => {
    if (typeof msg == "string") {
        msg = JSON.parse(msg)
    }
    const messageId = msg.MessageId
    const header = {
        version: msg.Header.Version,
        type: msg.Header.Type,
        msgLength: msg.Header.MsgLength,
    }
    const payload = utils.base64str2str(msg.Payload)
    return {
        messageId,
        header,
        payload: JSON.parse(payload),
    }
}

const withSessionId = (sessionId) => {
    return { SessionId: sessionId }
}

const withWalletAddress = (walletAddr) => {
    return {
        Payinfo: {
            WalletAddress: walletAddr,
        }
    }
}

const withBlockHashes = (blockHashes) => {
    return {
        BlockHashes: blockHashes
    }
}

const withPrefix = (prefix) => {
    return {
        Prefix: utils.str2base64(prefix),
    }
}

const withTxHash = (txHash) => {
    return {
        Tx: {
            Hash: txHash,
        }

    }
}

const withTxHeight = (height) => {
    return {
        Tx: {
            Height: height,
        }
    }
}

const withBlocksRoot = (blocksRoot) => {
    return {
        BLocksRoot: blocksRoot
    }
}

const withTotalBlockCount = (totalBlockCount) => {
    return {
        TotalBlockCount: totalBlockCount,
    }
}

const newFileMsg = (fileHash, operation, options) => {
    let payload = {
        Hash: fileHash,
        Operation: operation
    }
    for (let opt of options) {
        const payloadKeys = Object.keys(payload)
        const optKeys = Object.keys(opt)
        if (payloadKeys && optKeys && payloadKeys.length && optKeys.length && payloadKeys.indexOf(optKeys[0]) != -1) {
            Object.assign(opt[optKeys[0]], payload[optKeys[0]])
        }
        Object.assign(payload, opt)
    }
    console.log(`new file msg`, payload)
    return encodeMsg(payload, MSG_TYPE_FILE)
}


const newBlockFlightMsg = (flights) => {
    return encodeMsg(flights, MSG_TYPE_BLOCK_FLIGHTS)
}

module.exports = {
    encodeMsg,
    decodeMsg,
    withSessionId,
    withWalletAddress,
    withBlockHashes,
    withPrefix,
    withTxHash,
    withTxHeight,
    withBlocksRoot,
    withTotalBlockCount,
    newFileMsg,
    newBlockFlightMsg,
}