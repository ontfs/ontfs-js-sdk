const axios = require('axios');
const CancelToken = axios.CancelToken;
const {
  HTTP_REQ_TIMEOUT,
  HTTP_REQ_RETRY
} = require('../http_common.js')
const {
  SECOND
} = require('../../utils/time')

/**
 * 
 * @param {string} address  host server address
 * @param {any} data  message to be sent
 * 
 */

const httpSend = async (address, data) => {

  try {
    const options = {
      method: 'POST',
      url: address,
      data,
      timeout: HTTP_REQ_TIMEOUT * SECOND,
      headers: {
        'content-type': 'application/form-data'
      }
    }
    return await axios(options);
  } catch (error) {
    return error;
  }

}


/**
 * 
 * @param {any} msg  message to be sent
 * @param {string} peer host server address
 * @param {number} retry number of retries
 * @param {number} timeout Time-out time (milliseconds)
 */

const httpSendWithRetry = async (msg = "", peer, retry = HTTP_REQ_RETRY, timeout = HTTP_REQ_TIMEOUT) => {

  let result = null;
  const options = {
    method: 'POST',
    url: peer,
    data: msg,
    timeout: timeout * SECOND,
    headers: {
      'content-type': 'application/form-data'
    }
  }
  for (let index = 0; index < retry; index++) {
    try {
      result = await axios(options);
      return result
    } catch (error) {
      console.log(`network error for ${index + 1} times`)
      result = error;
    }
  }

  throw new Error(result)

}

/**
 * 
 * @param {*} address 
 * @param {*} data 
 * @param {*} needReply 
 * @param {func(data,string)} action  // return boolean (action maybe Promise)
 * @return {Promise} // res:{addr,err}
 */

const httpBroadcast = async (address, data, needReply = false, action) => {

  const cancelLists = [];
  const promisTaskLists = []; // return []Promise  

  for (let i = 0; i < address.length; i++) {

    const options = {
      method: 'POST',
      url: address[i],
      data: data,
      timeout: HTTP_REQ_TIMEOUT * SECOND,
      cancelToken: new CancelToken((cancel) => {
        cancelLists.push(cancel);
      })
    }
    const promisTask = new Promise((resolve) => {
      try {
        axios(options).then(async res => {
          // if (needReply) {
          const finished = await action(res, options.url);
          if (finished) {
            cancelLists.map(cancel => { // if no need to request peer (finished === true) , return current result and cancel all request
              cancel();
            })
          } else {
            resolve({
              addr: options.url,
              err: null
            });
          }
          // }
        }).catch((err) => {
          resolve({
            addr: options.url,
            err: err
          })
        })
      } catch (error) { // Catch exception in js code
        resolve({
          addr: options.url,
          err: error
        })
      }
    })
    promisTaskLists.push(promisTask);

  }

  return await Promise.all(promisTaskLists);

}

module.exports = {
  httpSend,
  httpSendWithRetry,
  httpBroadcast
}