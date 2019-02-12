const currency = require('./versions/currency')
const {
  queries
} = require('./postgres')
const { loggers } = require('./debug')
const {
  DAY,
  latestDate,
  validate
} = require('./versions/backfill')
const {
  EARLIEST_BACKFILL,
  LATEST_BACKFILL
} = require('./env')
module.exports = fetchAndInsert

async function fetchAndInsert () {
  const defaultLatest = latestDate() - (DAY / 2)
  let truncated = new Date(LATEST_BACKFILL || defaultLatest)
  const earliestDate = new Date(EARLIEST_BACKFILL)
  const earliestNum = +earliestDate
  const args = [earliestDate, truncated]
  const {
    rows
  } = await queries.findDatesBetween(args)
  const hash = objectifyDates(rows)
  loggers.history('start', new Date(truncated))
  loggers.history('until', new Date(earliestNum))
  while (earliestNum < truncated) {
    // minus day first so you don't get bad data
    const truncDate = new Date(truncated)
    validate(truncDate, truncDate)
    const checker = currency.byDay(truncated)
    if (!hash[checker]) {
      try {
        await fetch(checker)
      } catch (ex) {
        // no more to do
        loggers.history('erred on', truncated)
        loggers.history(ex)
        truncated = 0
      }
      // wait so we don't piss anyone off
      await timeout(5000)
    }
    truncated -= DAY
  }
  loggers.history('finished', new Date(truncated))
}

async function fetch (date) {
  loggers.history('checking\t', date)
  const prices = await currency.prices({
    date
  })
  loggers.history('inserting\t', date)
  await queries.insertPricehistory([date, prices])
  loggers.history('inserted\t', date)
}

function objectifyDates (rows) {
  return rows.reduce((memo, row) => {
    const day = currency.byDay(row.date)
    memo[day] = true
    return memo
  }, {})
}

function timeout (ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}