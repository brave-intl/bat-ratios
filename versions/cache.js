const redis = require('redis')
const _ = require('lodash')
const { loggers } = require('$/debug')

class Temp {
  constructor (options = {}) {
    const {
      limit = 100,
      expiry = 60 * 5
    } = options
    this.limit = limit
    this.expiry = expiry || 0
    this.hash = {}
    this.counter = 0
    this.timestamp = {}
  }

  get (key) {
    return this.hash[key]
  }

  set (key, value) {
    this.hash[key] = value
    this.timestamp[key] = (new Date()).toISOString()
    this.counter += 1
    if (this.counter > this.limit) {
      // should not have more than 90 configurations (more likely 5)
      // and should not exist more than 5 minutes at a time
      loggers.handling('odd cache state %o', { count: this.counter })
    }
    return setTimeout(() => {
      this.counter -= 1
      if (this.hash[key] !== value) {
        return
      }
      delete this.hash[key]
      delete this.timestamp[key]
    }, this.expiry)
  }
}

module.exports = {
  create,
  Temp
}

const mock = {
  get: () => {},
  set: () => {},
  del: () => {}
}

// increase to 5 min cache
function create (expiry = 60 * 5, options) {
  const tmp = new Temp({
    limit: 20,
    expiry: expiry * 1000
  })
  const optionsIsClient = options instanceof redis.RedisClient
  const rClient = optionsIsClient ? options : (options.url ? redis.createClient(options) : mock)
  return async (key, runner, refresh) => {
    if (refresh) {
      if (process.env.DEBUG) {
        loggers.io('refresh %o', { key })
      }
      await rClient.del(key)
    }
    let result = await rClient.get(key)
    if (_.isString(result)) {
      if (process.env.DEBUG) {
        loggers.io('using redis cache %o', { key })
      }

      let payload = {}
      try {
        payload = JSON.Parse(result)
      } catch (err) {
        if (process.env.DEBUG) {
          loggers.io('error parsing json: ', { err })
        }
      }

      return {
        payload: payload,
        lastUpdated: tmp.timestamp[key]
      }
    }
    let promise = refresh ? null : tmp.get(key)
    if (promise) {
      if (process.env.DEBUG) {
        loggers.io('using temp cache %o', { key })
      }
      return {
        payload: await promise,
        lastUpdated: tmp.timestamp[key]
      }
    }
    if (process.env.DEBUG) {
      loggers.io('fetching %o', { key })
    }
    promise = runner()
    if (process.env.DEBUG) {
      loggers.io('caching %o', { key })
    }
    tmp.set(key, promise)
    result = await promise
    await rClient.set(key, JSON.stringify(result), 'EX', expiry)
    return {
      payload: result,
      lastUpdated: tmp.timestamp[key]
    }
  }
}
