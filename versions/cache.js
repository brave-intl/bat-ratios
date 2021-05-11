const redis = require('redis')

module.exports = {
  create,
  Temp
}

class Temp {
  constructor(expiry) {
    this.expiry = expiry || 0
    this.hash = {}
  }
  get(key) {
    return this.hash[key]
  }
  set(key, value) {
    this.hash[key] = value
    return setTimeout(() => {
      delete this.hash[key]
    }, expiry)
  }
}

function create (expiry = 60, options) {
  const tmp = new Temp(expiry * 1000)
  const optionsIsClient = options instanceof redis.RedisClient
  const rClient = optionsIsClient ? options : redis.createClient(options)
  return (key, runner) => {
    let result = await rClient.getAsync(key)
    if (result) {
      return result
    }
    let promise = tmp.get(key)
    if (promise) {
      return promise
    }
    promise = runner()
    tmp.set(key, promise)
    result = await promise
    await rClient.setAsync(key, result, 'EX', expiry)
    return result
  }
}
