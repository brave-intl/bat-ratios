const _ = require('lodash')
const {
  loggers
} = require('../../debug')
const Sentry = require('../../sentry')
const workers = require('./workers')
const currency = require('../currency')
const stored = require('./stored')

const rates = basicHandler({
  run: access(workers.rates),
  respond: noWrapping
})
const rate = basicHandler({
  run: access(workers.rate)
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
  success: () => true
})
const refresh = basicHandler({
  setup: () => {},
  run: access(currency.refresh)
})
const available = basicHandler({
  run: keyed(workers.available)
})

const history = {
  between: historyHandler({
    run: access(stored.between)
  }),
  singleBetween: historyHandler({
    run: access(stored.singleBetween)
  }),
  relativeCurrency: historyHandler({
    run: access(stored.relativeCurrency)
  }),
  singleRelativeCurrency: historyHandler({
    run: access(stored.singleRelativeCurrency)
  })
}

module.exports = {
  history,
  rates,
  rate,
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

function historyHandler (opts) {
  return basicHandler(Object.assign({
    respond: noWrapping
  }, opts))
}

function access (fn) {
  if (!fn) {
    throw new Error('fn is required')
  }
  return async (req, res, next, setup) => {
    const {
      params,
      query
    } = req
    return fn(params, query, setup)
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
      const finishedSetup = await setup(...args)
      const value = await run(...args, finishedSetup)
      const lastUpdate = currency.lastUpdated()
      if (success(value)) {
        const json = respond(lastUpdate, value)
        res.json(json)
      } else {
        res.boom.notFound()
      }
      return
    } catch (ex) {
      Sentry.captureException(ex)
      const info = JSON.stringify(req.info)
      loggers.exception(`failed to complete request: ${info}`, ex)
      next(ex)
    }
  }
}

function noWrapping (lastUpdated, value) {
  return value
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
