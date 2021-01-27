const app = require('$/server')
const Currency = require('@brave-intl/currency')
const currency = Currency.global()
const { loggers } = require('$/debug')

currency.update()
  .then(() => app())
  .catch(loggers.exception)
