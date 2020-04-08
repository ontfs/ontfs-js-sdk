const address = require("./address")
const crypto = require("./crypto")
const prefix = require("./prefix")
module.exports = {
    ...address,
    ...crypto,
    ...prefix
}