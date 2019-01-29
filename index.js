const app = require('./server')
const Currency = require('@brave-intl/currency')
const currency = Currency.global()
const { loggers } = require('./debug')
const fetchAndInsert = require('./fetch-and-insert')
const {
  DAY
} = require('./versions/backfill')

currency.update()
  .then(() => app())
  .then(backfill)
  .catch(loggers.exception)

async function backfill () {
  await fetchAndInsert()
  setTimeout(backfill, DAY / 6)
}
