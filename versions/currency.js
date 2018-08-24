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

currency.ready = wrap(currency.ready, wrappedReady)
currency.save = wrap(currency.save, wrappedSave)
currency.flush = flush

function flush () {
  cache.del(key)
}

async function wrappedReady (ready) {
  const cached = cache.get(key)
  if (!cached) {
    return ready.call(currency)
  }
  const {
    lastUpdated,
    payload
  } = cached
  const bigNumbered = dualMap(payload, deserialize)
  const minuteAgo = (new Date()) - (60 * 1000)
  const minuteAgoISO = (new Date(minuteAgo)).toISOString()
  if (lastUpdated > minuteAgoISO) {
    await currency.save(lastUpdated, bigNumbered, true)
  } else {
    return ready.call(currency)
  }
}

async function wrappedSave (save, lastUpdated, payload, noSave) {
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
