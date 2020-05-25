const message = require("../network/message")
const axios = require("axios")
const BSON = require('bson');
const utils = require("../utils")
const Buffer = require('buffer/').Buffer

describe('network test', () => {
    test('test encode/decode msg', () => {
        const msg1 = `{
            "Hash": "SeNKDywBHnxxmyVht97oFZZEahteCuNMDS8RbBBzmLugjYAy",
            "Operation": 1000,
            "BlockHashes": [
                "SeNKDywBHnxxmyVht97oFZZEahteCuNMDS8RbBBzmLugjYAy"
            ],
            "Prefix": "MDEwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDBlNDAxMDAwMDAwMDAwMDAwMDAwMDAwMDA=",
            "Payinfo": {
                "WalletAddress": "ALZXN8VKuN63xassAUE29SG1vKHTf3WuVF"
            },
            "Tx": {
                "Height": 21167,
                "Hash": "43fa5d92fd636ada75d5f74498760a56d687f82a0057c590f2eacdf189781809"
            }
        }`

        const msg2 = `{
            "MessageId": 10645522441420474711,
            "Header": {
                "Version": "1",
                "Type": "file",
                "MsgLength": 303
            },
            "Payload": "eyJTZXNzaW9uSWQiOiIiLCJIYXNoIjoiU2VOS0R5d0JIbnh4bXlWaHQ5N29GWlpFYWh0ZUN1Tk1EUzhSYkJCem1MdWdqWUF5IiwiQmxvY2tIYXNoZXMiOm51bGwsIk9wZXJhdGlvbiI6MTAwMSwiUHJlZml4IjpudWxsLCJQYXlpbmZvIjp7IldhbGxldEFkZHJlc3MiOiJBTFE2UldKRU5zRUxFN0FUdXpIejR6Z0hycTU3M3hKc25NIiwiTGF0ZXN0UGF5bWVudCI6bnVsbH0sIlR4IjpudWxsLCJCcmVha3BvaW50IjpudWxsLCJUb3RhbEJsb2NrQ291bnQiOjAsIkNoYWluSW5mbyI6eyJIZWlnaHQiOjIzNjE5fSwiQkxvY2tzUm9vdCI6IiJ9",
            "Sig": null,
            "Error": null
        }`

        console.log("encoded", message.encodeFileMsg(msg1))
        console.log("decoded", message.decodeFileMsg(msg2))
    })


    test('test pack msg', () => {
        const msg1 = message.newFileMsg("SeNKDywBHnxxmyVht97oFZZEahteCuNMDS8RbBBzmLugjYAy", 1000,
            [
                message.withSessionId("123"),
                message.withWalletAddress("456"),
                message.withBlockHashes(["SeNKDywBHnxxmyVht97oFZZEahteCuNMDS8RbBBzmLugjYAy"]),
                message.withPrefix("10"),
                message.withTxHeight(10),
                message.withTxHash("!23123")
            ])
        console.log(msg1)
    })


    test('test send bson msg', async () => {
        try {
            const msg = message.newFileMsg("bafkreiddoznq4lpkdaa5hq3tpu4xjwcw4n3wgixkhaxx334updfm4zbb2q", message.FILE_OP_UPLOAD_ASK, [
                message.withSessionId("3815639632350695400_http://127.0.0.1:30337_upload"),
                message.withBlockHashes(["bafkreiddoznq4lpkdaa5hq3tpu4xjwcw4n3wgixkhaxx334updfm4zbb2q"]),
                message.withWalletAddress("AHTP7bg2aJYhTw2nJxBtAQaUk8poJKAW2Z"),
                message.withTxHash("cfe12cd4e2e13830c9c1d8e2bae05bab467aeb0d9bceeaaed194aac614c5474f"),
                message.withTxHeight(10805),
            ])

            console.log('bsonData', msg)
            const resp = await axios({
                method: 'post',
                url: 'http://127.0.0.1:30337',
                responseType: 'arraybuffer',
                headers: {
                    'Content-Type': 'application/octet-stream',
                    // 'Accept': 'application/octet-stream',

                },
                data: msg
            })
            console.log('resp', resp)
            console.log('resp', resp.data)
            console.log('hex', Buffer.from(resp.data))
            let ack = BSON.deserialize(Buffer.from(resp.data))
            // console.log("post resp", typeof resp.MessageId)
            console.log("post resp", ack)


        } catch (e) {
            console.log(e)
        }
    })

    test('test send big int', async () => {
        try {
            let total = 1
            let cnt = {
                Total: BSON.Long.fromNumber(total)
            }
            console.log('cnt', cnt)


        } catch (e) {
            console.log(e)
        }
    })

})
