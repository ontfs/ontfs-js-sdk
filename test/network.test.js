const message = require("../network/message")

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



})
