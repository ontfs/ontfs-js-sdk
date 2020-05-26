const message = require("../network/message")
const axios = require("axios")
const BSON = require('bson');
const utils = require("../utils")
const Buffer = require('buffer/').Buffer

describe('network test', () => {


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

    test('decode msg', async () => {
        try {
            const hex = '84030000124d65737361676549640000e46dea60a9ee400348656164657200320000000256657273696f6e000200000031000254797065000500000066696c6500104d73674c656e677468000000000000055061796c6f616400d802000000d80200000253657373696f6e496400340000003532313339383439343833383235363634305f687474703a2f2f3131372e35302e31372e33393a33323433355f75706c6f6164000248617368003c0000006261666b726569667a66676a79757233726663666e767735667179326f696c7875763578796935716b7976326577613663696f7a35756b33657a6d000a426c6f636b48617368657300104f7065726174696f6e00ea0300000350726566697800cc000000107375625f74797065000000000010706f736974696f6e009e00000005627566666572009e0000000030313030303030303030303030303030303030303030303030303030303030303030303030303430363933623439613831646138303966343434666132303965653739366163303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303064303030303030303030303030303030303030303030300003506179696e666f003b0000000257616c6c65744164647265737300230000004148545037626732614a59685477326e4a784274415161556b38706f4a4b4157325a0000035478007b000000024861736800410000003031333738323866373531663430353438623036616233313036333131363762323635646564313066636663633733333733363931313430613738383339623400034865696768740023000000106c6f7700d90000001068696768000000000008756e7369676e6564000000000a427265616b706f696e740003546f74616c426c6f636b436f756e740023000000106c6f7700010000001068696768000000000008756e7369676e65640000000a436861696e496e666f0002424c6f636b73526f6f74003c0000006261666b726569667a66676a79757233726663666e767735667179326f696c7875763578796935716b7976326577613663696f7a35756b33657a6d00000353696700230000000553696744617461000000000000055075626c69634b657900000000000000034572726f72001d00000010436f64650000000000024d6573736167650001000000000000'
            const data = Buffer.from(hex, 'hex')
            const ret = message.decodeMsg(data)
            console.log(parseInt(ret.payload.totalBlockCount))
        } catch (e) {
            console.log(e)
        }
    })

})
