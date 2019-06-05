const _ = require('lodash')
const currency = require('../currency')
const {
  queries
} = require('../../postgres')
const {
  validate,
  latestDate
} = require('../backfill')
module.exports = {
  singleRelativeCurrency: crossCopySingle(relativeCurrency),
  singleBetween: crossCopySingle(between),
  relativeCurrency,
  between
}

function crossCopySingle (fn) {
  return async (opts) => {
    const rows = await fn(Object.assign({}, opts, {
      start: opts.start
    }))
    return rows[0]
  }
}

async function relativeCurrency (options) {
  const {
    fromGroup: fromGroupUnknown,
    fromCurrency,
    toGroup: toGroupUnknown,
    toCurrency,
    start,
    until
  } = options
  validate(start, until)
  const fromGroup = fromGroupUnknown || currency.group(fromCurrency)
  const toGroup = toGroupUnknown || currency.group(toCurrency)
  if (!fromGroup || !toGroup) {
    throw new Error(`parameter combination not recognized: ${JSON.stringify(options)}`)
  }
  const {
    rows
  } = await queries.findOneBetween([
    fromGroup,
    fit(fromCurrency),
    toGroup,
    fit(toCurrency),
    currency.byDay(start),
    currency.byDay(until)
  ])
  return rows
}

async function between (options) {
  const {
    start,
    until,
    fromCurrency,
    fromGroup
  } = options
  const fromDate = currency.byDay(start)
  const untilDate = currency.byDay(until || latestDate())
  validate(fromDate, untilDate)
  const args = [fromDate, untilDate]
  const {
    rows
  } = await queries.findDataBetween(args)
  // "fromCurrency" is base
  const base = fit(fromCurrency)
  const opts = {
    fromCurrency: base,
    fromGroup
  }
  return rows.map((object) => relateToBase(opts, object))
}

function relateToBase ({
  fromCurrency,
  fromGroup
}, {
  prices,
  date,
  lastUpdated
}) {
  const relation = prices[fromGroup][fromCurrency]
  const built = {
    prices,
    date,
    lastUpdated
  }
  if (+relation === 1) {
    return built
  }
  const rel = new currency.BigNumber(relation)
  built.prices = _.mapValues(prices, (group) => _.mapValues(group, alternativeRoot(rel)))
  return built
}

function alternativeRoot (denominator) {
  return (value) => {
    const val = new currency.BigNumber(value)
    const result = val.dividedBy(denominator)
    return result.toString()
  }
}

function fit (string) {
  return string.toUpperCase().trim()
}
