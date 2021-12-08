const Currency = require('@brave-intl/currency')
const {
  wrap,
  mapValues
} = require('lodash')
const Sentry = require('$/sentry')
const {
  loggers
} = require('$/debug')
const { version } = require('$/package')

const key = `currency-v${version}`
const oneMin = 1000 * 60
const currency = Currency.global()
currency.cache = Cache()

module.exports = currency

currency.Cache = Cache
currency.save = wrap(currency.save, wrappedSave)
currency.update = wrap(currency.update, wrappedUpdate)

async function wrappedUpdate (update, force) {
  const currency = this
  const cached = currency.cache.get(key)
  if (force || !cached || (cached && new Date(cached.lastUpdated) < (new Date()) - currency.cache.resetDelay)) {
    if (process.env.DEBUG) {
      loggers.io('fetching')
    }
    try {
      await update.call(currency)
      return true
    } catch (e) {
      Sentry.captureException(e)
      loggers.io('failed to update', e)
      if (!cached) {
        return false
      }
    }
  }
  const {
    lastUpdated,
    payload
  } = cached
  if (currency.lastUpdated() === lastUpdated) {
    if (process.env.DEBUG) {
      loggers.io('using cache')
    }
    return !!force
  }
  if (process.env.DEBUG) {
    loggers.io('loading from cache')
  }
  const bigNumbered = dualMap(payload, deserialize)
  await currency.save(lastUpdated, bigNumbered, true)
  return !!force
}

async function wrappedSave (save, lastUpdated, payload, noSave) {
  const currency = this
  if (process.env.DEBUG) {
    loggers.io('setting')
  }
  await save.call(currency, lastUpdated, payload)
  if (noSave) {
    return
  }
  if (process.env.DEBUG) {
    loggers.io('caching', lastUpdated)
  }
  const serialized = dualMap(payload, serialize)
  currency.cache.set(key, {
    lastUpdated,
    payload: serialized
  })
}

function serialize (val) {
  return val.toString()
}

function deserialize (val) {
  return new currency.BigNumber(val)
}

function dualMap (object, mapper) {
  return mapValues(object, (object) => mapValues(object, (val) => mapper(val)))
}

function Cache (state = {}) {
  return {
    resetDelay: oneMin,
    get: (key) => state[key],
    set: (key, value) => {
      state[key] = value
    }
  }
}
