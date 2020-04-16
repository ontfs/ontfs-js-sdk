const { RpcClient } = require("ontology-ts-sdk")

describe('chain test', () => {
    test('test get block height by tx', async () => {
        const rpc = new RpcClient("http://127.0.0.1:20336")
        const result = await rpc.getBlockHeightByTxHash("43fa5d92fd636ada75d5f74498760a56d687f82a0057c590f2eacdf189781809").catch((e) => {
            console.log("catch", e)
        })
        console.log("result", result)
    })
})