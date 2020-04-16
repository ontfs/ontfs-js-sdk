const utils = require("../utils")


describe('task upload test', () => {
    test('test asyn-await', async () => {
        const f = async () => {
            await utils.sleep(3000)
            throw new Error("!23")
        }
        const f2 = async () => {
            while (true) {
                await utils.sleep(1000)
                console.log('sleep...')
                try {
                    await f()
                } catch (e) {
                    console.log('catch e thro')
                    break
                    throw e
                }
            }
            console.log("brek while")
        }
        try {
            console.log("awaiting...")
            await f2()
            console.log("awaiting...done")

        } catch (e) {
            console.log('here')
        }
        await utils.sleep(5000)
    }, 300000);
})