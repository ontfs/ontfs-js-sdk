const {
  SECOND
} = require('../utils/time')

module.exports = {
  HTTP_REQ_TIMEOUT: 10 * SECOND,
  HTTP_REQ_RETRY: 5 // http request retries
}