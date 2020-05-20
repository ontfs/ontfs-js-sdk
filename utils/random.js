/**
 * generate random 
 *
 * @returns
 */
const randomInt = () => {
    return Math.floor(100000000 + Math.random() * 10000000000000000000)
}

/**
 * generate random hex string
 *
 * @param {number} size: hex string length
 */
const randomHex = size => [...Array(size)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');

module.exports = {
    randomInt,
    randomHex
}