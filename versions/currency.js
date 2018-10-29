const Currency = require('@brave-intl/currency')
const {
  wrap,
  mapValues
} = require('lodash')
const NodeCache = require('node-cache')
const debug = require('../debug')
const { version } = require('../package')

const key = `currency-v${version}`
const cache = new NodeCache({
  stdTTL: 60 // seconds
})
const currency = Currency.global()
currency.cache = cache

module.exports = currency

currency.save = wrap(currency.save, wrappedSave)
currency.reset = wrap(currency.reset, wrappedReset)
currency.update = wrap(currency.update, wrappedUpdate)

async function wrappedReset (reset) {
  const currency = this
  debug('reseting')
  await new Promise((resolve, reject) => {
    currency.cache.del(key, (e) => e ? reject(e) : resolve())
  })
  reset.call(currency)
}

async function wrappedUpdate (update) {
  const currency = this
  const cached = currency.cache.get(key)
  if (!cached) {
    debug('fetching')
    return update.call(currency)
  }
  const {
    lastUpdated,
    payload
  } = cached
  if (currency.lastUpdated() === lastUpdated) {
    debug('using cache')
    return
  }
  debug('loading from cache')
  const bigNumbered = dualMap(payload, deserialize)
  await currency.save(lastUpdated, bigNumbered, true)
}

async function wrappedSave (save, lastUpdated, payload, noSave) {
  const currency = this
  debug('saving')
  await save.call(currency, lastUpdated, payload)
  if (noSave) {
    return
  }
  debug('caching', lastUpdated)
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
