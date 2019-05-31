const app = require('src/server')
const Currency = require('@brave-intl/currency')
const currency = Currency.global()
const { loggers } = require('src/utils/debug')
const fetchAndInsert = require('src/workers/fetch-and-insert')
const {
  DAY
} = require('src/versions/backfill')

currency.update()
  .then(() => app())
  .then(backfill)
  .catch(loggers.exception)

async function backfill () {
  await fetchAndInsert()
  setTimeout(backfill, DAY / 6)
}
