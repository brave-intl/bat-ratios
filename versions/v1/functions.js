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
const against = basicHandler({
  run: access(workers.against)
})
const refresh = basicHandler({
  run: access(() => {
    return currency.update().then(() => {
      return currency.lastUpdated()
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
  against,
  refresh
}

function access(fn) {
  if (!fn) {
    throw new Error('fn is required')
  }
  return async (req, res, next) => {
    let value = null
    const { params } = req
    try {
      value = fn(params)
    } catch (err) {
      return next(err)
    }
    return value
  }
}

async function defaultSetup() {
  await currency.ready()
  if (currency.lastUpdated() < _.now() - time.MINUTE) {
    await currency.update()
  }
}

function basicHandler({
  setup = defaultSetup,
  run,
  respond = defaultPayload
}) {
  return async (...args) => {
    const [req, res, next] = args
    await defaultSetup()
    const lastUpdate = currency.lastUpdated()
    const value = await run(...args)
    if (!value) {
      next(boom.notFound())
    } else {
      res.sendValidJson(respond(lastUpdate, value))
    }
  }
}

function defaultPayload(lastUpdated, value) {
  return {
    lastUpdated,
    value
  }
}

function keyed (fn) {
  return access((...args) => _.keys(fn(...args)).sort())
}
