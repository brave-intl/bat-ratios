const app = require('../')
const Currency = require('@brave-intl/currency')
const currency = Currency.global()
const debug = require('../debug')

app().then(() => {
  return currency.update()
}).catch((e) => debug(e))
