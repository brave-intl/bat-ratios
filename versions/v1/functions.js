const _ = require('lodash')
const {
  handlingRequest,
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
    const previousUpdate = currency.lastUpdated()
    // force subsequent requests
    // to wait for price updates
    const success = await currency.update(true)
    return {
      success,
      previousUpdate
    }
  })
})

const history = {
  all: basicHandler({
    setup: () => {},
    run: access(stored.all),
    respond: noWrapping
  }),
  single: basicHandler({
    setup: () => {},
    run: access(stored.single),
    respond: noWrapping
  })
}

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
  history,
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
    handlingRequest(req)
    try {
      const finishedSetup = await setup(...args)
      const value = await run(...args, finishedSetup)
      const lastUpdate = currency.lastUpdated()
      if (success(value)) {
        const json = respond(lastUpdate, value)
        res.sendValidJson(json)
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
