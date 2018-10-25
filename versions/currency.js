const Currency = require('@brave-intl/currency')
const {
  wrap,
  mapValues
} = require('lodash')
const NodeCache = require('node-cache')
const debug = require('../debug')
const { version } = require('../package')

const currency = Currency.global()

module.exports = currency

const key = `currency-v${version}`
const cache = new NodeCache({
  stdTTL: 60 // seconds
})

currency.update = wrap(currency.update, wrappedUpdate)
currency.save = wrap(currency.save, wrappedSave)
currency.flush = flush

function flush () {
  return new Promise((resolve, reject) => {
    cache.del(key, (e) => e ? reject(e) : resolve())
  })
}

async function wrappedUpdate (update) {
  const cached = cache.get(key)
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
  debug('saving')
  await save.call(currency, lastUpdated, payload)
  if (noSave) {
    return
  }
  debug('caching', lastUpdated)
  const serialized = dualMap(payload, serialize)
  cache.set(key, {
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
