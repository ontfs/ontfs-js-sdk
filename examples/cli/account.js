
const { Account, Wallet, Crypto } = require("ontology-ts-sdk")
const fs = require("fs")
const path = require("path")
const flags = require("./flags")

const createWallet = async (label, password) => {
    if (!password || !password.length) {
        console.log('create account failed, missing password')
        return
    }
    const wallet = await Wallet.create('')
    const privateKey = Crypto.PrivateKey.random()
    var account = Account.create(privateKey, password, label)
    wallet.addAccount(account)
    const walletPath = path.join(__dirname, "./wallet.dat")
    fs.writeFileSync(walletPath, JSON.stringify(wallet.toWalletFile()))
    console.log('create wallet success at ', walletPath)
}
const createAccountCmd = {
    command: 'create',
    desc: 'create a account',
    builder: (yargs) => yargs
        .option(flags.password.name, flags.password)
        .option(flags.label.name, flags.label),
    handler: async (argv) => {
        argv._handled = true
        await createWallet(argv.label, argv.password)
    }
}


const accountCmd = {
    command: 'account',
    desc: 'account command',
    builder: (yargs) => yargs
        .command(createAccountCmd)
    ,
    handler: (argv) => {
        argv._handled = true
    }
}

module.exports = accountCmd