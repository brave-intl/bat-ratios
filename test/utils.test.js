module.exports = {
  status,
  timeout
}

function status (expected) {
  return function ({ status, body }) {
    if (status !== expected) {
      console.log(`${status} was not ${expected}`)
      return new Error(JSON.stringify(body))
    }
  }
}

function timeout (ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
