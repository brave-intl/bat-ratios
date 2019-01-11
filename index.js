const app = require('./server')
const Currency = require('@brave-intl/currency')
const currency = Currency.global()
const debug = require('./debug')
const runBackward = require('./run-backward')
const {
  DAY
} = require('./versions/backfill')

currency.update()
  .then(() => app())
  .then(backfill)
  .catch(debug)

async function backfill () {
  await runBackward()
  setTimeout(backfill, DAY / 6)
}
