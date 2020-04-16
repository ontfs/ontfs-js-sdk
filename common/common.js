const fs = require("fs")
const path = require("path")
const humanize = require(path.join(__dirname, "./humanize/bytes.js"))
const BigNumber = require('bignumber.js');

var VERSION = ""
const PRECISION_ONG = 9

const pathExisted = (path) => {
    return fs.existsSync(path)
}

const createDirIfNeed = (folder) => {
    if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder, { recursive: true });
    }
}

const formatVolumeStringFromKb = (volumeInKb) => {
    return formatVolumeStringFromByteNum(volumeInKb * 1024)
}


const formatVolumeStringFromByteNum = (byteNum) => {
    return humanize.bytes(byteNum)
}

const formatTimeStringFromUnixTime = (timestamp) => {
    let timestampLen = timestamp.toString().length
    if (timestampLen == 10) {
        return new Date(timestamp * 1000)
    }
    return new Date(timestamp)
}

const parseVolumeStringToByteNum = (volume) => {
    let sizeInByte = humanize.parseBytes(volume)
    return sizeInByte
}

const formatAssetAmount = (amount, precision) => {
    let bn = new BigNumber(amount).dividedBy(Math.pow(10, precision))
    return bn.toString()
}

const parseAssetAmount = (amount, precision) => {
    let bn = new BigNumber(amount).multipliedBy(Math.pow(10, precision))
    return bn
}

const formatOng = (amount) => {
    let result = formatAssetAmount(amount, PRECISION_ONG)
    return `${result} ONG`
}

const parseOng = (rawAmount) => {
    let result = parseAssetAmount(rawAmount, PRECISION_ONG)
    return result
}

const toArrayReverse = (hex) => {
    if (hex.length % 2 !== 0) {
        throw new Error(`Incorrect Length: ${hex}`);
    }
    let out = '';
    for (let i = hex.length - 2; i >= 0; i -= 2) {
        out += hex.substr(i, 2);
    }
    return out;
}


module.exports = {
    VERSION,
    PRECISION_ONG,
    pathExisted,
    createDirIfNeed,
    formatVolumeStringFromKb,
    formatVolumeStringFromByteNum,
    parseVolumeStringToByteNum,
    formatTimeStringFromUnixTime,
    formatAssetAmount,
    parseAssetAmount,
    formatOng,
    parseOng,
    toArrayReverse
}