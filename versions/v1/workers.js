const _ = require('lodash')
const Currency = require('@brave-intl/currency')
const currency = Currency.global()
const rates = require('./rates')
const categories = require('../categories')

module.exports = {
  all,
  rates,
  rate,
  key,
  alt,
  fiat,
  available,
  relative: pickRelative,
  relativeUnknown: pickRelative
}

function all () {
  return _.assign(fiat(), alt())
}

function key ({
  key
}) {
  return currency.key(key.trim()) || ''
}

function rate ({
  fromGroup,
  fromCurrency,
  toGroup,
  toCurrency
}) {
  if (!currency.has(fromCurrency) || !currency.has(toCurrency)) {
    return
  }
  let rate = null
  if (fromGroup && toGroup) {
    rate = currency.ratioFromKnown(fromGroup, fromCurrency, toGroup, toCurrency)
  } else {
    rate = currency.ratio(fromCurrency, toCurrency)
  }
  if (rate) {
    return toValue(rate)
  }
}

function pickRelative (props, {
  currency: currencyFilter
}) {
  let list = null
  if (_.isArray(currencyFilter)) {
    list = currencyFilter
  } else if (currencyFilter && _.isString(currencyFilter)) {
    list = currencyFilter.split(',')
  }
  const result = props.fromGroup ? relative(props) : relativeUnknown(props)
  if (!result) {
    return
  }
  if (!list || !list.length) {
    return result
  }
  return _.reduce(list, (memo, fromCurrency) => {
    if (!memo) {
      return
    }
    const accessor = key({ key: fromCurrency })
    if (!accessor) {
      return
    }
    memo[fromCurrency] = result[accessor]
    return memo
  }, {})
}

function relativeUnknown ({
  fromCurrency
}) {
  const { FIAT, ALT } = categories
  if (currency.get([ALT, fromCurrency])) {
    return relative({ fromGroup: ALT, fromCurrency })
  } else if (currency.get([FIAT, fromCurrency])) {
    return relative({ fromGroup: FIAT, fromCurrency })
  }
}

function relative ({
  fromGroup,
  fromCurrency
}) {
  const baseRatio = currency.get([fromGroup, fromCurrency])
  if (!baseRatio) {
    return
  }
  const mapper = (num) => num.dividedBy(baseRatio)
  const fiat = mapAllValues(currency.get(categories.FIAT), mapper)
  const alt = mapAllValues(currency.get(categories.ALT), mapper)
  return _.assign(fiat, alt)
}

function available ({
  fromGroup
}) {
  const values = {}
  if (fromGroup) {
    Object.assign(values, currency.get(fromGroup))
  } else {
    Object.assign(values, currency.get(categories.FIAT), currency.get(categories.ALT))
  }
  return mapAllValues(values)
}

function alt () {
  return mapAllValues(currency.get(categories.ALT))
}

function fiat () {
  return mapAllValues(currency.get(categories.FIAT))
}

function mapAllValues (values, mapper = (item) => item) {
  return _.mapValues(values, (item) => toValue(mapper(item)))
}

function toValue (number) {
  return number.toString()
}
