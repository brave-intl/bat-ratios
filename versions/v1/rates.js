const _ = require('lodash')
const Currency = require('@brave-intl/currency')
const currency = Currency.global()
const altList = [
  'ETH',
  'LTC',
  'BAT',
  'BTC'
]
const fiatList = [
  'USD',
  'EUR'
]
const altratesList = altList.concat(fiatList)

module.exports = rates

function rates () {
  const fiat = currency.sharedGet('fiat')
  const rates = _.mapValues(fiat, (val) => val.toNumber())
  const timestamp = currency.lastUpdated()
  const fxrateWrapper = {
    disclaimer: 'Usage subject to terms: https://openexchangerates.org/terms',
    license: 'https://openexchangerates.org/license',
    timestamp,
    base: 'USD',
    rates
  }
  const altratesReduced = backfillRatioObject(altratesList)
  const ratesReduced = backfillRatioObject(altList)
  return {
    fxrates: fxrateWrapper,
    altrates: altratesReduced,
    rates: ratesReduced
  }
}

function backfillRatioObject (list) {
  return _.reduce(list, (memo, item) => {
    memo[item] = _.reduce(altratesList, (memo, sub) => {
      if (sub !== item) {
        memo[sub] = currency.ratio(item, sub).toNumber()
      }
      return memo
    }, {})
    return memo
  }, {})
}
