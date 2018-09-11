const _ = require('lodash')
const Currency = require('@brave-intl/currency')
const workers = require('./workers')
const currency = Currency.global()
const {
  time
} = currency

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
const refresh = basicHandler({
  run: access(() => {
    return currency.update().then(() => {
      return date(currency.lastUpdated())
    })
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

async function defaultSetup () {
  await currency.ready()
  if (currency.lastUpdated() < _.now() - time.MINUTE) {
    await currency.update()
  }
}

function basicHandler ({
  setup = defaultSetup,
  run,
  respond = defaultPayload
}) {
  return async (...args) => {
    const [req, res, next] = args // eslint-disable-line
    await setup()
    const lastUpdate = currency.lastUpdated()
    const value = await run(...args)
    if (!value) {
      next(res.boom.notFound())
    } else {
      const json = respond(lastUpdate, value)
      res.sendValidJson(json)
    }
  }
}

function date (value) {
  return (new Date(value)).toISOString()
}

function defaultPayload (lastUpdated, payload) {
  return {
    lastUpdated: date(lastUpdated),
    payload
  }
}

function keyed (fn) {
  return access((...args) => {
    return _.keys(fn(...args)).sort()
  })
}
