const redis = require('redis')
const _ = require('lodash')
const { loggers } = require('$/debug')

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
  return async (key, runner, refresh) => {
    if (refresh) {
      loggers.handling('refresh %o', { key })
      await rClient.del(key)
    }
    let result = await rClient.get(key)
    if (_.isString(result)) {
      loggers.handling('using redis cache %o', { key })
      console.log('result', result)
      return JSON.parse(result)
    }
    let promise = tmp.get(key)
    if (promise) {
      loggers.handling('using temp cache %o', { key })
      return promise
    }
    loggers.handling('fetching %o', { key })
    promise = runner()
    loggers.handling('caching %o', { key })
    tmp.set(key, promise)
    result = await promise
    await rClient.set(key, JSON.stringify(result), 'EX', expiry)
    return result
  }
}
