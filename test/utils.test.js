module.exports = {
  status,
  timeout
}

function status (expectation) {
  return function (res) {
    if (!res) {
      throw new Error('no response object')
    }
    const { status, body, request } = res
    if (status !== expectation) {
      const { url, method } = request
      return new Error(JSON.stringify({
        method,
        url,
        expectation,
        status,
        body
      }, null, 2).replace(/\\n/g, '\n'))
    }
  }
}

function timeout (ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
