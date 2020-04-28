const Bytes = require('bytes')

const Byte = 1 << (0 * 10)
const KByte = 1 << (1 * 10)
const MByte = 1 << (2 * 10)
const GByte = 1 << (3 * 10)
const TByte = 1 << (4 * 10)
const PByte = 1 << (5 * 10)
const EByte = 1 << (6 * 10)

var bytesSizeTable = {
    "b": Byte,
    "kb": KByte,
    "mb": MByte,
    "gb": GByte,
    "tb": TByte,
    "pb": PByte,
    "eb": EByte,
    "": Byte,
    "k": KByte,
    "m": MByte,
    "g": GByte,
    "t": TByte,
    "p": PByte,
    "e": EByte,
}

const logn = (n, b) => {
    return Math.log(n) / Math.log(b)
}

const humanateBytes = (s, base, sizes) => {
    if (s < 10) {
        return `${s} B`
    }
    let e = Math.floor(logn(parseFloat(s), base))
    let suffix = sizes[parseInt(e)]
    let val = math.Floor(parseFloat(s) / Math.pow(base, e) * 10 + 0.5) / 10
    if (val < 10) {
        return `${val.toFixed(1)} ${suffix}`
    }
    return `${val.toFixed(0)} ${suffix}`
}

/**
 * convert size to humanize readable bytes
 *
 * @param {number} s
 * @returns {string}: e.g '1MB' 
 */
const bytes = (s) => {
    return Bytes(s, { unitSeparator: ' ', decimalPlaces: 1 })
}

const parseBytes = (s) => {
    return Bytes.parse(s)
}

module.exports = {
    Byte,
    MByte,
    GByte,
    TByte,
    PByte,
    EByte,
    KByte,
    bytes,
    parseBytes
}