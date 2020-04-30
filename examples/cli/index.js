const accountCmd = require("./account")
const spaceCmd = require("./space")
const fileCmd = require("./file")
const nodeCmd = require("./fsnode")
const fs = require("fs")
const path = require("path")
const logDir = path.join(__dirname, "Logs")
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir)
}
const formatDateLocaleString = (date) => {
    let str = date.toLocaleString('zh', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    })
    str = str.replace(/\//g, '-')
    str = str.replace(/ /g, '_')
    str = str.replace(/\:/g, '.')
    return str
}
const now = formatDateLocaleString(new Date())
const logPath = path.join(logDir, `${now}.log`)
fs.writeFileSync(logPath, `[${formatDateLocaleString(new Date())}]: start log...\n`)
const log = console.log;
console.log = (...args) => {
    for (let arg of args) {
        let logText = ''
        if (typeof arg == 'object' || Array.isArray(arg)) {
            logText = JSON.stringify(arg)
        } else {
            logText = arg
        }
        fs.appendFileSync(logPath, `[${formatDateLocaleString(new Date())}]: ${logText}\n`)
    }
    log.apply(console, args);
}

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

