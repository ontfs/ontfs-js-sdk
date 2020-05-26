const utils = require("../../utils")
const { MESSAGE_VERSION, MSG_TYPE_FILE, MSG_TYPE_BLOCK_FLIGHTS, MSG_TYPE_PAYMENT } = require("./const")
const BSON = require('bson');
const Buffer = require('buffer/').Buffer

const encodeMsg = (msg, msgType) => {
    const msgId = BSON.Long.fromNumber(utils.randomInt())
    const header = {
        Version: MESSAGE_VERSION,
        Type: msgType,
        MsgLength: 0,
    }
    // const payload = utils.str2base64(JSON.stringify(msg))
    const payload = new BSON.Binary(BSON.serialize(msg))
    const encoded = {
        MessageId: msgId,
        Header: header,
        Payload: payload,
        Sig: {
            SigData: new BSON.Binary(),
            PublicKey: new BSON.Binary(),
        },
        Error: {
            Code: 0,
            Message: "",
        }
    }
    const req = BSON.serialize(encoded)
    if (msgType == MSG_TYPE_FILE) {
        // console.log('hex', req.toString('hex'))
    }
    // return BSON.serialize(encoded)
    return req
}

const decodeMsg = (resp) => {
    // console.log('decode msg str 2 ab', typeof resp)
    if (typeof resp == 'string') {
        resp = Buffer.from(resp)
    }
    // console.log('resp++++', Buffer.from(resp).toString('hex'))
    const msg = BSON.deserialize(Buffer.from(resp))
    // console.log('decode msg done')
    // if (typeof msg == "string") {
    //     msg = JSON.parse(msg)
    // }
    if (!msg) {
        console.log('bson deserialize msg failed')
        return
    }
    const messageId = msg.MessageId
    const header = {
        version: msg.Header.Version,
        type: msg.Header.Type,
        msgLength: msg.Header.MsgLength,
    }
    const payload = msg.Payload ? msg.Payload.buffer : null
    // console.log("msg.payload ", msg.Payload, payload)
    const payloadObj = BSON.deserialize(payload)
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
                prefix: payloadObj.Prefix && payloadObj.Prefix && payloadObj.Prefix.buffer
                    ? payloadObj.Prefix.buffer.toString() : '',
                totalBlockCount: payloadObj.TotalBlockCount,
                blocksRoot: payloadObj.BLocksRoot,
            }
            if (payloadObj.Payinfo) {
                fileMsg.payInfo = {
                    walletAddress: payloadObj.Payinfo.WalletAddress,
                    latestPayment: payloadObj.Payinfo.LatestPayment && payloadObj.Payinfo.LatestPayment
                        ? payloadObj.Payinfo.LatestPayment.toString() : '',
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
                    }
                    if (b.Data && b.Data.buffer) {
                        blk.data = b.Data.buffer
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
                data: payloadObj.Data ? payloadObj.Data.buffer : null,
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
        Prefix: new BSON.Binary(Buffer.from(prefix)),
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
            Height: BSON.Long.fromNumber(height),
        }
    }
}

const withBlocksRoot = (blocksRoot) => {
    return {
        BLocksRoot: blocksRoot
    }
}

const withTotalBlockCount = (totalBlockCount) => {
    const cnt = {
        TotalBlockCount: BSON.Long.fromNumber(totalBlockCount),
    }
    return cnt
}

const newFileMsg = (fileHash, operation, options) => {
    let payload = {
        SessionId: '',
        Hash: fileHash,
        BlockHashes: null,
        Operation: operation,
        Prefix: new BSON.Binary(),
        Payinfo: null,
        Tx: null,
        Breakpoint: null,
        TotalBlockCount: BSON.Long.fromNumber(0),
        ChainInfo: null,
        BLocksRoot: ''
    }
    for (let opt of options) {
        const optKeys = Object.keys(opt)
        const key = optKeys[0]
        if (!payload[key]) {
            Object.assign(payload, opt)
            continue
        }
        Object.assign(payload[key], opt[key])
    }
    console.log('build new file msg payload', payload, options)
    return encodeMsg(payload, MSG_TYPE_FILE)
}


const newBlockFlightMsg = (msg) => {
    const flight = {
        SessionId: msg.SessionId,
        FileHash: msg.FileHash,
        Operation: msg.Operation,
        Blocks: null,
        Payment: null
    }
    if (msg.Blocks) {
        const blocks = []
        for (let blk of msg.Blocks) {
            const block = {
                Index: blk.Index,
                Hash: blk.Hash,
                Offset: BSON.Long.fromNumber(blk.Offset),
                Data: null,
            }
            if (blk.Data) {
                block.Data = new BSON.Binary(blk.Data)
            }
            blocks.push(block)
        }
        flight.Blocks = blocks
    }
    if (msg.Payment) {
        const payment = {
            Sender: msg.Payment.Sender,
            Receiver: msg.Payment.Receiver,
            PaymentId: msg.Payment.PaymentId,
            BlockHashes: null,
        }
        if (msg.Payment.BlockHashes) {
            payment.BlockHashes = msg.Payment.BlockHashes
        }
        flight.Payment = payment
    }
    return encodeMsg(flight, MSG_TYPE_BLOCK_FLIGHTS)
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
        const optKeys = Object.keys(opt)
        const key = optKeys[0]
        if (!payload[key]) {
            Object.assign(payload, opt)
            continue
        }
        Object.assign(payload[key], opt[key])
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
        Data: new BSON.Binary(Buffer.from(JSON.stringify(paymentData))),
    }
    for (let opt of options) {
        const optKeys = Object.keys(opt)
        const key = optKeys[0]
        if (!payload[key]) {
            Object.assign(payload, opt)
            continue
        }
        Object.assign(payload[key], opt[key])
    }
    console.log('payload', payload, options)
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