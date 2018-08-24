const app = require('../')
const Currency = require('@brave-intl/currency')
const currency = Currency.global()

app().then(() => {
  return currency.update()
})