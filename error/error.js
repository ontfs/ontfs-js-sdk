
class SDKError {
    constructor(_code, _message, _cause) {
        this.Code = _code
        this.Message = _message
        this.Cause = _cause
    }
    Error() {
        return `code: ${this.Code}, message: ${this.Message}`
    }
}

/**
 * init a SDKError
 *
 * @param {number} code: error code
 * @param {string} msg : error msg
 * @returns {SDKError}
 */
const init = (code, msg) => {
    let cause = new Error(msg)
    let err = new SDKError(code, msg, cause)
    return err
}

/**
 * init a SDKError with error
 *
 * @param {number} code
 * @param {error} error
 * @returns {SDKError}
 */
const newWithError = (code, error) => {
    let errMsg = ""
    if (error) {
        errMsg = error.toString()
    }
    let err = new SDKError(code, errMsg, error)
    return err
}

module.exports = {
    SDKError,
    init,
    newWithError
}