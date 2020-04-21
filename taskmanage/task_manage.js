const types = require("../types")
const taskentity = require("../taskentity")
const utils = require("../utils")

const getTaskId = () => {
    return utils.randomInt()
}

class TaskMgr {
    constructor(_uploadTaskHub, _downloadTaskHub) {
        this.uploadTaskHub = _uploadTaskHub
        this.downloadTaskHub = _downloadTaskHub
    }
    async addTask(taskOption) {
        const taskID = getTaskId()
        switch (taskOption.constructor) {
            case types.TaskUploadOption: {
                try {
                    const task = await taskentity.newTaskUpload(taskID, taskOption)
                    this.uploadTaskHub[taskID] = task
                    await task.start()
                } catch (e) {
                    throw e
                }
                break
            }
            case types.TaskDownloadOption: {
                try {
                    const task = await taskentity.newTaskDownload(taskID, taskOption)
                    this.downloadTaskHub[taskID] = task
                    task.start()
                } catch (e) {
                    throw e
                }
                break
            }
            default: {
                throw new Error(`[AddTask] task type error`)
            }
        }
        return taskID
    }

    getUploadTaskByTaskId(taskId) {
        const task = this.uploadTaskHub[taskId]
        if (task) {
            return task
        }
        throw new Error(`[GetUploadTaskByTaskId] task (id: ${taskId})is not exist`)
    }

    getDownloadTaskByTaskId(taskId) {
        const task = this.downloadTaskHub[taskId]
        if (task) {
            return task
        }
        throw new Error(`[GetDownloadTaskByTaskId] task (id: ${taskId})is not exist`)
    }

    getAllUploadTask() {
        return this.uploadTaskHub
    }

    getAllDownloadTask() {
        return this.downloadTaskHub
    }

    async delTask(id) {
        const task = this.getTaskById(id)
        if (task) {
            try {
                await task.clean()
                this.delTaskById(id)
            } catch (e) {
                throw e
            }
        } else {
            throw new Error(`[DelTask] task (id: ${id})is not exist`)
        }
    }

    async resumeTask(id) {
        const task = this.getTaskById(id)
        if (task) {
            try {
                await task.resume()
            } catch (e) {
                throw e
            }
        } else {
            throw new Error(`[ResumeTask] task (id: ${id})is not exist`)
        }
    }

    async stopTask(id) {
        const task = this.getTaskById(id)
        if (task) {
            try {
                await task.stop()
            } catch (e) {
                throw e
            }
        } else {
            throw new Error(`[StopTask] task (id: ${id})is not exist`)
        }
    }

    getTaskById(id) {
        let task = this.uploadTaskHub[id]
        if (task) {
            return task
        }
        task = this.downloadTaskHub[id]
        if (task) {
            return task
        }
        return
    }

    delTaskById(id) {
        let task = this.uploadTaskHub[id]
        if (task) {
            delete this.uploadTaskHub[id]
            return
        }
        task = this.downloadTaskHub[id]
        if (task) {
            delete this.downloadTaskHub[id]
        }
    }
}

var Global = {}

const initTaskManage = () => {
    const taskMgr = new TaskMgr({}, {})
    Global['taskMgr'] = taskMgr
    return taskMgr
}

const globalTaskMgr = () => {
    return Global["taskMgr"]
}

module.exports = {
    TaskMgr,
    initTaskManage,
    globalTaskMgr,
}