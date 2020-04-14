const sdk = require("./sdk")
const ontFs = require("./ontfs")
module.exports = {
    ...sdk,
    ...ontFs
}