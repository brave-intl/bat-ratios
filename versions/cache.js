const redis = require('redis')

class Temp {
  constructor (expiry) {
    this.expiry = expiry || 0
    this.hash = {}
  }

  get (key) {
    return this.hash[key]
  }

  set (key, value) {
    this.hash[key] = value
    return setTimeout(() => {
      delete this.hash[key]
    }, this.expiry)
  }
}

module.exports = {
  create,
  Temp
}

function create (expiry = 60, options) {
  const tmp = new Temp(expiry * 1000)
  const optionsIsClient = options instanceof redis.RedisClient
  const rClient = optionsIsClient ? options : redis.createClient(options)
  return async (key, runner) => {
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
