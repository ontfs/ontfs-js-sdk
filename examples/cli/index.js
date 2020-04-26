const accountCmd = require("./account")
const spaceCmd = require("./space")
const fileCmd = require("./file")
const nodeCmd = require("./fsnode")

require('yargs')
    .usage('Usage: $0 <cmd> [options]')
    .command(accountCmd)
    .command(fileCmd)
    .command(spaceCmd)
    .command(nodeCmd)
    .option('h', {
        alias: 'help',
        description: 'display help message'
    })
    .help('help').argv

