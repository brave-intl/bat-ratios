const _ = require('lodash')
const Currency = require('@brave-intl/currency')
const currency = Currency.global()
const rates = require('./rates')
const categories = require('../categories')

module.exports = {
  all,
  unknown,
  known,
  rates,
  fiat,
  alt,
  key,
  relative: pickRelative,
  relativeUnknown: pickRelative
}

function all () {
  return _.assign(fiat(), alt())
}

function key ({
  a
}) {
  return currency.key(a)
}

function unknown ({
  a,
  b
}) {
  if (!currency.has(a) || !currency.has(b)) {
    return
  }
  const ratio = currency.ratio(a, b)
  return toValue(ratio)
}

function known ({
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
    return toValue(ratio)
  }
}

function pickRelative (props, {
  currency
}) {
  let list = null
  if (_.isArray(currency)) {
    list = currency
  } else if (currency && _.isString(currency)) {
    list = currency.split(',')
  }
  const result = props.group1 ? relative(props) : relativeUnknown(props)
  if (result) {
    return list ? _.pick(result, list) : result
  }
}

function relativeUnknown ({
  a
}) {
  const { FIAT, ALT } = categories
  if (currency.deepGet(FIAT, a)) {
    return relative({ group1: FIAT, a })
  } else if (currency.deepGet(ALT, a)) {
    return relative({ group1: ALT, a })
  }
}

function relative ({
  group1,
  a
}) {
  const baseRatio = currency.deepGet(group1, a)
  if (!baseRatio) {
    return
  }
  const mapper = (num) => num.dividedBy(baseRatio)
  const fiat = mapAllValues(categories.FIAT, mapper)
  const alt = mapAllValues(categories.ALT, mapper)
  return _.assign(fiat, alt)
}

function fiat () {
  return mapAllValues(categories.FIAT)
}

function alt () {
  return mapAllValues(categories.ALT)
}

function mapAllValues (key, mapper = (item) => item) {
  return _.mapValues(currency.sharedGet(key), (item) => {
    return toValue(mapper(item))
  })
}

function toValue (number) {
  return number.toString()
}
