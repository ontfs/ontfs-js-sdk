const humanize = require("./humanize/bytes.js")
const BigNumber = require('bignumber.js');

var VERSION = ""
const PRECISION_ONG = 9

/**
 * format a volume size(KB) to string
 *
 * @param {number} volumeInKb
 * @returns {string} e.g '1MB'
 */
const formatVolumeStringFromKb = (volumeInKb) => {
    return formatVolumeStringFromByteNum(volumeInKb * 1024)
}

/**
 * format a volume size(B) to string
 *
 * @param {number} byteNum
 * @returns {string} e.g '1MB'
 */
const formatVolumeStringFromByteNum = (byteNum) => {
    return humanize.bytes(byteNum)
}

/**
 * format a timestamp to Date 
 *
 * @param {number} timestamp
 * @returns {Date}
 */
const formatTimeStringFromUnixTime = (timestamp) => {
    let timestampLen = timestamp.toString().length
    if (timestampLen == 10) {
        return new Date(timestamp * 1000)
    }
    return new Date(timestamp)
}

/**
 * parse a volume string to byte size
 *
 * @param {string} volume
 * @returns {number}
 */
const parseVolumeStringToByteNum = (volume) => {
    let sizeInByte = humanize.parseBytes(volume)
    return sizeInByte
}

/**
 * convert a asset amount to string
 *
 * @param {number} amount
 * @param {number} precision
 * @returns
 */
const formatAssetAmount = (amount, precision) => {
    let bn = new BigNumber(amount).dividedBy(Math.pow(10, precision))
    return bn.toString()
}

/**
 * parse a asset amount to big number
 *
 * @param {number} amount
 * @param {number} precision
 * @returns
 */
const parseAssetAmount = (amount, precision) => {
    let bn = new BigNumber(amount).multipliedBy(Math.pow(10, precision))
    return bn
}

/**
 * format ong asset amount
 *
 * @param {number} amount
 * @returns {string}
 */
const formatOng = (amount) => {
    let result = formatAssetAmount(amount, PRECISION_ONG)
    return `${result} ONG`
}


/**
 * parse ong asset 
 *
 * @param {number} rawAmount 
 * @returns {BigNumber}
 */
const parseOng = (rawAmount) => {
    let result = parseAssetAmount(rawAmount, PRECISION_ONG)
    return result
}

/**
 * reverse a hex string
 *
 * @param {string} hex
 * @returns {string} revered_hex
 */
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


/**
 * get a TCP host addr from node net address
 *
 * @param {string} nodeNetAddr
 * @returns {string}
 */
const getTcpAddrFromNodeNetAddr = (nodeNetAddr) => {
    const addrs = nodeNetAddr.split(";")
    for (let addr of addrs) {
        if (addr.indexOf("tcp://") != -1) {
            return addr
        }
    }
    return ""
}


/**
 * get a HTTP host addr from node net address
 *
 * @param {string} nodeNetAddr
 * @returns {string}
 */
const getHTTPAddrFromNodeNetAddr = (nodeNetAddr) => {
    const addrs = nodeNetAddr.split(";")
    for (let addr of addrs) {
        if (addr.indexOf("http://") != -1) {
            return addr
        }
    }
    return ""
}

/**
 * format a date string to locale string
 *
 * @param {Date} date
 * @returns {string}
 */
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
    return str
}

module.exports = {
    VERSION,
    PRECISION_ONG,
    formatVolumeStringFromKb,
    formatVolumeStringFromByteNum,
    parseVolumeStringToByteNum,
    formatTimeStringFromUnixTime,
    formatAssetAmount,
    parseAssetAmount,
    formatOng,
    parseOng,
    toArrayReverse,
    getTcpAddrFromNodeNetAddr,
    getHTTPAddrFromNodeNetAddr,
    formatDateLocaleString,
}