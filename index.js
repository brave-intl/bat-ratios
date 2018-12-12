const app = require('./server')
const Currency = require('@brave-intl/currency')
const currency = Currency.global()
const debug = require('./debug')
const runBackward = require('./run-backward')
const {
  DAY
} = require('./versions/backfill')

app().then(() => {
  return currency.update()
}).catch((e) => debug(e))
  .then(backfill)

async function backfill () {
  await runBackward()
  setTimeout(backfill, DAY / 6)
}
