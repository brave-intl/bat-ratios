const _ = require('lodash')
const Currency = require('@brave-intl/currency')
const currency = Currency.global()
const rates = require('./rates')
const { time } = currency
const FIATS = 'fiats'
const ALTS = 'alts'

module.exports = {
  all,
  unknown,
  known,
  rates,
  fiats,
  alts,
  constants: {
    FIATS,
    ALTS
  }
}

function keys(fn) {
  return function () {
    return fn(...arguments)
  }
}

function all() {
  return _.assign(fiats(), alts())
}

function unknown({
  a,
  b
}) {
  if (!currency.has(a) || !currency.has(b)) {
    return
  }
  const ratio = currency.ratio(a, b)
  return ratio.toNumber()
}

function known({
  group1,
  a,
  group2,
  b
}) {
  if (!currency.has(a) || !currency.has(b)) {
    return
  }
  const ratio = currency.ratioFromKnown(group1, a, group2, b)
  if (ratio) {
    return ratio.toNumber()
  }
}

function fiats () {
  return mapAllValues(FIATS)
}

function alts () {
  return mapAllValues(ALTS)
}

function mapAllValues (key, mapper = (item) => item) {
  return _.mapValues(currency.shared[key], (item) => {
    return mapper(item).toNumber()
  })
}
