const boom = require('boom')
const _ = require('lodash')
const Currency = require('@brave-intl/currency')
const workers = require('./workers')
const currency = Currency.global()
const {
  time
} = currency

const rates = access(workers.rates)
const known = access(workers.known)
const unknown = access(workers.unknown)
const fiats = access(workers.fiats)
const alts = access(workers.alts)
const all = access(workers.all)

const available = {
  all: keyed(workers.all),
  alts: keyed(workers.alts),
  fiats: keyed(workers.fiats)
}

module.exports = {
  rates,
  known,
  unknown,
  fiats,
  alts,
  all,
  available,
  keyed,
  access
}

function access(fn) {
  return async (req, res, next) => {
    const { params } = req
    await currency.ready()
    if (currency.lastUpdated() < _.now() - time.MINUTE) {
      await currency.update()
    }
    let result
    try {
      result = fn(params)
    } catch (err) {
      return next(err)
    }
    if (!result) {
      next(boom.notFound())
    } else {
      res.sendValidJson(result)
    }
  }
}

function keyed (fn) {
  return access((...args) => _.keys(fn(...args)))
}
