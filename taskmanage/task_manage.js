const types = require("../types")
const taskentity = require("../taskentity")
const utils = require("../utils")

const getTaskId = () => {
    return utils.randomInt()
}

/**
 * TaskManager for control task life cycle 
 *
 * @class TaskMgr
 */
class TaskMgr {
    constructor(_uploadTaskHub, _downloadTaskHub) {
        this.uploadTaskHub = _uploadTaskHub
        this.downloadTaskHub = _downloadTaskHub
    }
    /**
     * add a task with option, return a taskID if add success
     *
     * @param {Object} taskOption
     * @returns {string} taskID 
     * @memberof TaskMgr
     */
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

    /**
     * get a upload task by taskId
     *
     * @param {string} taskId
     * @returns {Object}
     * @memberof TaskMgr
     */
    getUploadTaskByTaskId(taskId) {
        const task = this.uploadTaskHub[taskId]
        if (task) {
            return task
        }
        throw new Error(`[GetUploadTaskByTaskId] task (id: ${taskId})is not exist`)
    }

    /**
    * get a download task by taskId
    *
    * @param {string} taskId
    * @returns {Object}
    * @memberof TaskMgr
    */
    getDownloadTaskByTaskId(taskId) {
        const task = this.downloadTaskHub[taskId]
        if (task) {
            return task
        }
        throw new Error(`[GetDownloadTaskByTaskId] task (id: ${taskId})is not exist`)
    }

    /**
     * get all upload task
     * 
     * @returns {Object}, key is task ID, value is task object
     * @memberof TaskMgr
     */
    getAllUploadTask() {
        return this.uploadTaskHub
    }

    /**
     * get all download task
     * 
     * @returns {Object}, key is task ID, value is task object
     * @memberof TaskMgr
     */
    getAllDownloadTask() {
        return this.downloadTaskHub
    }

    /**
    * delete a task by taskId
    *
    * @param {string} taskId
    * @memberof TaskMgr
    */
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

    /**
     * resume a task by taskId
     *
     * @param {string} taskId
     * @memberof TaskMgr
     */
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

    /**
    * stop a task by taskId
    *
    * @param {string} taskId
    * @memberof TaskMgr
    */
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

    /**
    * get a task by taskId
    *
    * @param {string} taskId
    * @returns {Object}
    * @memberof TaskMgr
    */
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

    /**
    * delete a task by taskId
    *
    * @param {string} taskId
    * @memberof TaskMgr
    */
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

/**
 * init a task manager and set it to global cache
 *
 * @returns {TaskMgr}
 */
const initTaskManage = () => {
    const taskMgr = new TaskMgr({}, {})
    Global['taskMgr'] = taskMgr
    return taskMgr
}

/**
 * get global task manager
 *
 * @returns {TaskMgr}
 */
const globalTaskMgr = () => {
    return Global["taskMgr"]
}

module.exports = {
    TaskMgr,
    initTaskManage,
    globalTaskMgr,
}