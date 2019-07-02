const {
  log
} = require('../debug')
module.exports = {
  status,
  timeout
}

function status (expected) {
  return function (res) {
    if (!res) {
      throw new Error('no response object')
    }
    const { url, method, status, body } = res
    if (status !== expected) {
      log(`${status} was not ${expected}`)
      return new Error(JSON.stringify({
        method,
        url,
        status,
        body
      }, null, 2))
    }
  }
}

function timeout (ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
