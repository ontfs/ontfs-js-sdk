const utils = require("../../utils")
const { MESSAGE_VERSION, MSG_TYPE_FILE, MSG_TYPE_BLOCK_FLIGHTS, MSG_TYPE_PAYMENT } = require("./const")



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
    if (!msg) {
        return
    }
    const messageId = msg.MessageId
    const header = {
        version: msg.Header.Version,
        type: msg.Header.Type,
        msgLength: msg.Header.MsgLength,
    }
    const payload = utils.base64str2utf8str(msg.Payload)
    // console.log("msg.payload ", msg.Payload, payload)
    const payloadObj = JSON.parse(payload)
    let decoded = {
        messageId,
        header,
    }
    // console.log('payloadObj', payloadObj, msg.Header)
    switch (msg.Header.Type) {
        case MSG_TYPE_FILE: {
            let fileMsg = {
                sessionId: payloadObj.SessionId,
                hash: payloadObj.Hash,
                blockHashes: payloadObj.BlockHashes,
                operation: payloadObj.Operation,
                prefix: payloadObj.Prefix && payloadObj.Prefix.length ? utils.base64str2utf8str(payloadObj.Prefix) : '',
                totalBlockCount: payloadObj.TotalBlockCount,
                blocksRoot: payloadObj.BLocksRoot,
            }
            if (payloadObj.Payinfo) {
                fileMsg.payInfo = {
                    walletAddress: payloadObj.Payinfo.WalletAddress,
                    latestPayment: payloadObj.Payinfo.LatestPayment,
                }
            }
            if (payloadObj.Tx) {
                fileMsg.tx = {
                    hash: payloadObj.Tx.Hash,
                    height: payloadObj.Tx.Height,
                }
            }
            if (payloadObj.Breakpoint) {
                fileMsg.breakpoint = {
                    hash: payloadObj.Breakpoint.Hash,
                    index: payloadObj.Breakpoint.Index,
                }
            }
            if (payloadObj.ChainInfo) {
                fileMsg.chainInfo = {
                    height: payloadObj.ChainInfo.Height,
                }
            }
            decoded.payload = fileMsg
            break
        }
        case MSG_TYPE_BLOCK_FLIGHTS: {
            let blockFlightMsg = {
                sessionId: payloadObj.SessionId,
                fileHash: payloadObj.FileHash,
                operation: payloadObj.Operation,
            }

            if (payloadObj.Blocks) {
                let blocks = []
                for (let b of payloadObj.Blocks) {
                    if (!b) {
                        continue
                    }
                    let blk = {
                        hash: b.Hash,
                        index: b.Index,
                        offset: b.Offset,
                        data: utils.base64str2str(b.Data),
                    }
                    blocks.push(blk)
                }
                blockFlightMsg.blocks = blocks
            }
            if (payloadObj.Payment) {
                blockFlightMsg.payment = {
                    sender: payloadObj.Payment.Sender,
                    receiver: payloadObj.Payment.Receiver,
                    paymentId: payloadObj.Payment.PaymentId,
                    blockHashes: payloadObj.Payment.BlockHashes,
                }
            }
            decoded.payload = blockFlightMsg
            break
        }
        case MSG_TYPE_PAYMENT: {
            let paymentMsg = {}
            paymentMsg = {
                sender: payloadObj.Sender,
                receiver: payloadObj.Receiver,
                operation: payloadObj.Operation,
                paymentId: payloadObj.PaymentId,
                fileHash: payloadObj.FileHash,
                blockHashes: payloadObj.BlockHashes,
                data: payloadObj.Data,
            }
            decoded.payload = paymentMsg
            break
        }
    }
    if (!msg.Error) {
        return decoded
    }
    decoded.error = {
        code: msg.Error.Code,
        message: msg.Error.Message
    }
    return decoded
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
        BlocksRoot: blocksRoot
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
    // console.log(`new file msg`, payload)
    return encodeMsg(payload, MSG_TYPE_FILE)
}


const newBlockFlightMsg = (flights) => {
    return encodeMsg(flights, MSG_TYPE_BLOCK_FLIGHTS)
}

const newBlockFlightsReqMsg = (fileHash, sender, blocks, op, options) => {
    const payload = {
        FileHash: fileHash,
        Blocks: blocks,
        Operation: op,
        Payment: {
            Sender: sender,
        }
    }
    for (let opt of options) {
        const payloadKeys = Object.keys(payload)
        const optKeys = Object.keys(opt)
        if (payloadKeys && optKeys && payloadKeys.length && optKeys.length && payloadKeys.indexOf(optKeys[0]) != -1) {
            Object.assign(opt[optKeys[0]], payload[optKeys[0]])
        }
        Object.assign(payload, opt)
    }
    return newBlockFlightMsg(payload)
}

const newPaymentMsg = (sender, receiver, op, paymentId, fileHash, blockHashes, paymentData, options) => {
    console.log('sliceData', JSON.stringify(paymentData))
    console.log('sliceData', utils.str2base64(JSON.stringify(paymentData)))

    const payload = {
        Sender: sender,
        Receiver: receiver,
        Operation: op,
        PaymentId: paymentId,
        FileHash: fileHash,
        BlockHashes: blockHashes,
        Data: utils.str2base64(JSON.stringify(paymentData)),
    }
    for (let opt of options) {
        const payloadKeys = Object.keys(payload)
        const optKeys = Object.keys(opt)
        if (payloadKeys && optKeys && payloadKeys.length && optKeys.length && payloadKeys.indexOf(optKeys[0]) != -1) {
            Object.assign(opt[optKeys[0]], payload[optKeys[0]])
        }
        Object.assign(payload, opt)
    }
    return encodeMsg(payload, MSG_TYPE_PAYMENT)

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
    newBlockFlightsReqMsg,
    newPaymentMsg,
}