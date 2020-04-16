const uploadTask = require("./task_upload")
const downloadTask = require("./task_download")
module.exports = {
    ...uploadTask,
    ...downloadTask
}