const uploadType = require("./type_upload")
const downloadType = require("./type_download")

module.exports = {
    ...uploadType,
    ...downloadType,
}