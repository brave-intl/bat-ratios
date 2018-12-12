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
  single,
  all
}

async function single ({
  from,
  base,
  until
}) {
  const rows = await retreiveBetween({
    from,
    until: from,
    base
  })
  return rows[0]
}

function all (options) {
  return retreiveBetween(options)
}

async function retreiveBetween ({
  from,
  until,
  base
}) {
  const fromDate = currency.byDay(from)
  const untilDate = currency.byDay(until || latestDate())
  validate(fromDate, untilDate)
  const args = [fromDate, untilDate]
  const {
    rows
  } = await queries.findDataBetween(args)
  return rows.map((object) => relateToBase(base, object))
}

function relateToBase (base, {
  prices,
  truncated_date: date,
  updated_at: lastUpdated
}) {
  const relation = prices.alt[base] || prices.fiat[base]
  const built = {
    prices,
    date,
    lastUpdated
  }
  if (+relation === 1) {
    return built
  }
  const rel = new currency.BigNumber(relation)
  built.prices = _.mapValues(prices, (group) => _.mapValues(group, (value, key) => {
    const val = new currency.BigNumber(value)
    const result = val.dividedBy(rel)
    return result.toString()
  }))
  return built
}
