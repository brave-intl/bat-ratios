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
  singleDate: crossCopySingle(between),
  relativeCurrency,
  between
}

function crossCopySingle (fn) {
  return async (opts) => {
    const rows = await fn(Object.assign({}, opts, {
      until: opts.from
    }))
    return rows[0]
  }
}

async function relativeCurrency ({
  group1,
  a,
  group2,
  b,
  from,
  until
}) {
  validate(from, until)
  const {
    rows
  } = await queries.findOneBetween([
    group1,
    fit(a),
    group2,
    fit(b),
    currency.byDay(from),
    currency.byDay(until)
  ])
  return rows.map(({
    price,
    updated_at: lastUpdated,
    date
  }) => ({
    lastUpdated,
    date,
    price
  }))
}

async function between ({
  from,
  until,
  a,
  group1
}) {
  const fromDate = currency.byDay(from)
  const untilDate = currency.byDay(until || latestDate())
  console.log('fromData', fromDate)
  console.log('untilDate', untilDate)
  validate(fromDate, untilDate)
  const args = [fromDate, untilDate]
  const {
    rows
  } = await queries.findDataBetween(args)
  // "a" is base
  const base = fit(a)
  const opts = {
    base,
    group1
  }
  console.log('base', base)
  return rows.map((object) => relateToBase(opts, object))
}

function relateToBase ({
  base,
  group1
}, {
  prices,
  date,
  updated_at: lastUpdated
}) {
  const relation = prices[group1][base]
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
