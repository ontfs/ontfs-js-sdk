const { FsService, MAX_PREFIX_LENGTH } = require('./fsservice')
const fs = require("./fs")
module.exports = {
    MAX_PREFIX_LENGTH,
    FsService,
    ...fs
}
