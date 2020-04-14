const types = require("../types")
const taskentity = {}
const GlobalTaskMgr

const initTaskManage = () => {
    const taskMgr = {
        uploadTaskHub: {},
        downloadTaskHub: {},
    }
    GlobalTaskMgr = taskMgr
}

const getTaskId = () => {
    Math.floor(100000000 + Math.random() * 10000000000000000000)
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
                    await task.start()
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
        return this.uploadTaskHub[taskId]
    }

    getDownloadTaskByTaskId(taskId) {
        return this.downloadTaskHub[taskId]
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

module.exports = {
    initTaskManage,
    TaskMgr
}