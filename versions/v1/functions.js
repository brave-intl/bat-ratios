const _ = require('lodash')
const debug = require('../../debug')
const workers = require('./workers')
const currency = require('../currency')

const rates = basicHandler({
  run: access(workers.rates),
  respond: (lastUpdated, value) => value
})
const known = basicHandler({
  run: access(workers.known)
})
const unknown = basicHandler({
  run: access(workers.unknown)
})
const fiat = basicHandler({
  run: access(workers.fiat)
})
const alt = basicHandler({
  run: access(workers.alt)
})
const all = basicHandler({
  run: access(workers.all)
})
const relative = basicHandler({
  run: access(workers.relative)
})
const relativeUnknown = basicHandler({
  run: access(workers.relativeUnknown)
})
const key = basicHandler({
  run: access(workers.key),
  success: (result) => true
})
const refresh = basicHandler({
  setup: () => {},
  run: access(async () => {
    // force subsequent requests
    // to wait for price updates
    await currency.reset()
    // update prices
    await currency.update()
    return currency.lastUpdated()
  })
})

const available = {
  all: basicHandler({
    run: keyed(workers.all)
  }),
  alt: basicHandler({
    run: keyed(workers.alt)
  }),
  fiat: basicHandler({
    run: keyed(workers.fiat)
  })
}

module.exports = {
  rates,
  known,
  unknown,
  fiat,
  alt,
  all,
  available,
  keyed,
  access,
  relative,
  relativeUnknown,
  key,
  refresh
}

function access (fn) {
  if (!fn) {
    throw new Error('fn is required')
  }
  return async (req, res, next) => {
    let value = null
    const { params, query } = req
    try {
      value = fn(params, query)
    } catch (err) {
      return next(err)
    }
    return value
  }
}

function basicHandler ({
  setup = () => currency.update(),
  run,
  success = (a) => a,
  respond = defaultPayload
}) {
  return async (...args) => {
    const [req, res, next] = args // eslint-disable-line
    try {
      await setup()
      const lastUpdate = currency.lastUpdated()
      const value = await run(...args)
      if (success(value)) {
        const json = respond(lastUpdate, value)
        res.sendValidJson(json)
      } else {
        res.boom.notFound()
      }
      return
    } catch (e) {
      debug(e)
      next(e)
    }
  }
}

function defaultPayload (lastUpdated, payload) {
  return {
    lastUpdated,
    payload
  }
}

function keyed (fn) {
  return access((...args) => {
    return _.keys(fn(...args)).sort()
  })
}
