const { Router } = require('express')
const expressRequestCSV = require('express-request-csv')
const csvConfig = require('../middleware/csv-configs')
const { handlingRequest } = require('../../debug')
const joiToJSONSchema = require('joi-to-json-schema')
const functions = require('./functions')
const { history } = functions
const schemas = require('../schemas')
const checkers = require('../middleware/joi')
const swagger = require('./swagger')
const router = new Router()

module.exports = router

const {
  knownGroupsOnly,
  altOrFiat,
  rates,
  wrapped,
  listOfStates,
  stateObject,
  dateOptionalUntil,
  currency,
  priceDate,
  listOfPriceDate,
  stringAsListOrList
} = schemas

const {
  numberCurrencyRatios,
  listOfStrings,
  numberAsString,
  refresh,
  stringAllowEmpty
} = wrapped

const priceDateResponse = checkers.response(priceDate)
const listOfPriceDateResponse = checkers.response(listOfPriceDate)
const numberCurrencyRatiosResponse = checkers.response(numberCurrencyRatios)
const numberResponse = checkers.response(numberAsString)
const refreshResponse = checkers.response(refresh)
const listResponse = checkers.response(listOfStrings)
const ratesResponse = checkers.response(rates)
const listOfStringsResponse = checkers.response(listOfStrings)
const stringAllowEmptyResponse = checkers.response(stringAllowEmpty)
const listOfStatesResponse = checkers.response(listOfStates)
const stateObjectResponse = checkers.response(stateObject)
const dateFromGroup = dateOptionalUntil.keys({
  fromGroup: altOrFiat,
  fromCurrency: currency
})
const dateFromGroupToGroup = dateFromGroup.keys({
  toGroup: altOrFiat,
  toCurrency: currency
})
const dateParamsFromGroup = checkers.params(dateFromGroup)
const dateParamsFromGroupToGroup = checkers.params(dateFromGroupToGroup)
const groupParams = checkers.params(knownGroupsOnly)
const queryCurrencySplit = checkers.query({
  currency: stringAsListOrList
})

const deepObjectCSV = expressRequestCSV({
  config: csvConfig.deepPriceCurrencies
})
const singleCurrencyCSV = expressRequestCSV({
  config: csvConfig.priceCurrency
})

router.get('/refresh', log, refreshResponse, functions.refresh)
swagger.document('/refresh', 'get', {
  tags: ['util'],
  summary: 'Wipe the cached currencies',
  description: 'Deletes the cached currencies and fetches new ones.',
  responses: {
    200: {
      description: 'Successfully refreshed and recached currencies',
      schema: joiToJSONSchema(refresh)
    }
  }
})

router.get(
  '/relative/history/single/:fromGroup/:fromCurrency/:toGroup/:toCurrency/:start',
  log,
  dateParamsFromGroupToGroup,
  priceDateResponse,
  history.singleRelativeCurrency
)
swagger.document('/relative/history/single/{fromGroup}/{fromCurrency}/{toGroup}/{toCurrency}/{start}', 'get', {
  tags: ['history'],
  summary: 'Historical data exists for this currency on this day relative to the base given',
  description: 'Get the historical data for this currency on the given day relative to the base given',
  parameters: [
    swagger.param.group('fromGroup', 'fiat'),
    swagger.param.currency('fromCurrency', 'USD'),
    swagger.param.group('toGroup', 'alt'),
    swagger.param.currency('toCurrency', 'BAT'),
    swagger.param.date('start', {
      allowEmptyValue: false
    })
  ],
  responses: {
    200: {
      description: 'A ratio is known for this currency under the return value',
      schema: joiToJSONSchema(priceDate)
    }
  }
})

router.get(
  '/relative/history/single/:fromCurrency/:toCurrency/:start',
  log,
  dateParamsFromGroupToGroup,
  priceDateResponse,
  history.singleRelativeCurrency
)
swagger.document('/relative/history/single/{fromCurrency}/{toCurrency}/{start}', 'get', {
  tags: ['history'],
  summary: 'Historical data exists for this currency on this day relative to the base given',
  description: 'Get the historical data for this currency on the given day relative to the base given',
  parameters: [
    swagger.param.currency('fromCurrency', 'USD'),
    swagger.param.currency('toCurrency', 'BAT'),
    swagger.param.date('start', {
      allowEmptyValue: false
    })
  ],
  responses: {
    200: {
      description: 'A ratio is known for this currency under the return value',
      schema: joiToJSONSchema(priceDate)
    }
  }
})

router.get(
  '/relative/history/:fromGroup/:fromCurrency/:toGroup/:toCurrency/:start/:until',
  log,
  singleCurrencyCSV,
  dateParamsFromGroupToGroup,
  listOfPriceDateResponse,
  history.relativeCurrency
)
swagger.document('/relative/history/{fromGroup}/{fromCurrency}/{toGroup}/{toCurrency}/{start}/{until}', 'get', {
  tags: ['history'],
  summary: 'Historical data exists for this currency relative to the base given',
  description: 'Get the historical data for this currency relative to the base given',
  parameters: [
    swagger.param.group('fromGroup', 'fiat'),
    swagger.param.currency('fromCurrency', 'USD'),
    swagger.param.group('toGroup', 'alt'),
    swagger.param.currency('toCurrency', 'BAT'),
    swagger.param.date('start', {
      allowEmptyValue: false
    }),
    swagger.param.date('until')
  ],
  responses: {
    200: {
      description: 'A ratio is known for this currency under the return value',
      schema: joiToJSONSchema(listOfPriceDate)
    }
  }
})

router.get(
  '/relative/history/:fromCurrency/:toCurrency/:start/:until',
  log,
  singleCurrencyCSV,
  dateParamsFromGroupToGroup,
  listOfPriceDateResponse,
  history.relativeCurrency
)
swagger.document('/relative/history/{fromCurrency}/{toCurrency}/{start}/{until}', 'get', {
  tags: ['history'],
  summary: 'Historical data exists for this currency relative to the base given',
  description: 'Get the historical data for this currency relative to the base given',
  parameters: [
    swagger.param.currency('fromCurrency', 'USD'),
    swagger.param.currency('toCurrency', 'BAT'),
    swagger.param.date('start', {
      allowEmptyValue: false
    }),
    swagger.param.date('until')
  ],
  responses: {
    200: {
      description: 'A ratio is known for this currency under the return value',
      schema: joiToJSONSchema(listOfPriceDate)
    }
  }
})

router.get(
  '/history/single/:fromGroup/:fromCurrency/:start',
  log,
  dateParamsFromGroup,
  stateObjectResponse,
  history.singleBetween
)
swagger.document('/history/single/{fromGroup}/{fromCurrency}/{start}', 'get', {
  tags: ['history'],
  summary: 'Historical data exists for this currency',
  description: 'Get the historical data for this currency',
  parameters: [
    swagger.param.group('fromGroup', 'fiat'),
    swagger.param.currency('fromCurrency', 'USD'),
    swagger.param.date('start', {
      allowEmptyValue: false
    })
  ],
  responses: {
    200: {
      description: 'A ratio is known for this currency under the return value.',
      schema: joiToJSONSchema(listOfStates)
    }
  }
})

router.get(
  '/history/:fromGroup/:fromCurrency/:start/:until',
  log,
  deepObjectCSV,
  dateParamsFromGroup,
  listOfStatesResponse,
  history.between
)
swagger.document('/history/{fromGroup}/{fromCurrency}/{start}/{until}', 'get', {
  tags: ['history'],
  summary: 'Historical data exists for this currency',
  description: 'Get the historical data for this currency',
  parameters: [
    swagger.param.group('fromGroup', 'fiat'),
    swagger.param.currency('fromCurrency', 'USD'),
    swagger.param.date('start', {
      allowEmptyValue: false
    }),
    swagger.param.date('until')
  ],
  responses: {
    200: {
      description: 'A ratio is known for this currency under the return value',
      schema: joiToJSONSchema(listOfStates)
    }
  }
})

router.get('/available/:fromGroup?',
  log,
  listOfStringsResponse,
  listResponse,
  functions.available
)
swagger.document('/available/{fromGroup}', 'get', {
  tags: ['supported'],
  summary: 'List of available fiat currencies',
  description: 'Gets the tickers of all available currencies under a group or omit for all',
  parameters: [
    swagger.param.group('fromGroup', '')
  ],
  responses: {
    200: {
      description: 'Tickers were found',
      schema: joiToJSONSchema(listOfStrings)
    }
  }
})

router.get(
  '/:fromGroup/:fromCurrency/:toGroup/:toCurrency',
  log,
  groupParams,
  numberResponse,
  functions.rate
)
swagger.document('/{fromGroup}/{fromCurrency}/{toGroup}/{toCurrency}', 'get', {
  tags: ['ratios'],
  summary: 'Access a specific fiat or alt ratio or any combination of the two',
  description: 'Accesses each currency (a and b) in their respective groups and divides b by a to answer the question, how many b\'s can i buy with 1 a?',
  parameters: [
    swagger.param.group('fromGroup', 'fiat'),
    swagger.param.currency('fromCurrency', 'USD'),
    swagger.param.group('toGroup', 'alt'),
    swagger.param.currency('toCurrency', 'BAT')
  ],
  responses: {
    200: {
      description: 'Found each currency and created a valid trade ratio estimate.',
      schema: joiToJSONSchema(numberAsString)
    }
  }
})

router.get(
  '/relative/:fromGroup/:fromCurrency',
  log,
  groupParams,
  queryCurrencySplit,
  numberCurrencyRatiosResponse,
  functions.relative
)
swagger.document('/relative/{fromGroup}/{fromCurrency}', 'get', {
  tags: ['ratios'],
  summary: 'Compute ratios relative to a given currency (a)',
  description: 'What are the prices of all other currencies relative to the price of the given currency under a specified group.',
  parameters: [
    swagger.param.group('fromGroup', 'fiat'),
    swagger.param.currency('fromCurrency', 'EUR'),
    swagger.query.list('currency')
  ],
  responses: {
    200: {
      description: 'The ratios were correctly computed.',
      schema: joiToJSONSchema(numberCurrencyRatios)
    }
  }
})

router.get(
  '/relative/:fromCurrency',
  log,
  queryCurrencySplit,
  numberCurrencyRatiosResponse,
  functions.relativeUnknown
)
swagger.document('/relative/{fromCurrency}', 'get', {
  tags: ['ratios'],
  summary: 'Compute ratios relative to a given currency (a)',
  description: 'What are the prices of all other currencies relative to the price of the given currency.',
  parameters: [
    swagger.param.currency('fromCurrency', 'EUR'),
    swagger.query.list('currency')
  ],
  responses: {
    200: {
      description: 'The ratios were correctly computed.',
      schema: joiToJSONSchema(numberCurrencyRatios)
    }
  }
})

router.get('/rates',
  log,
  ratesResponse,
  functions.rates
)
swagger.document('/rates', 'get', {
  tags: ['rates'],
  summary: 'Previously supported rates endpoint',
  responses: {
    200: {
      description: 'All rates correctly computed and wrapped.',
      schema: joiToJSONSchema(rates)
    }
  }
})

router.get('/fiat',
  log,
  numberCurrencyRatiosResponse,
  functions.fiat
)
swagger.document('/fiat', 'get', {
  tags: ['ratios'],
  summary: 'All fiat ratios',
  description: '',
  responses: {
    200: {
      description: 'All fiat ratios computed correctly.',
      schema: joiToJSONSchema(numberCurrencyRatios)
    }
  }
})

router.get('/alt',
  log,
  numberCurrencyRatiosResponse,
  functions.alt
)
swagger.document('/alt', 'get', {
  tags: ['ratios'],
  summary: 'A list of alt ratios',
  description: 'All alt ratios',
  responses: {
    200: {
      description: 'All alt ratios computed correclty.',
      schema: joiToJSONSchema(numberCurrencyRatios)
    }
  }
})

router.get('/key/:key',
  log,
  stringAllowEmptyResponse,
  functions.key
)
swagger.document('/key/{key}', 'get', {
  tags: ['ratios'],
  summary: 'A key exists for this currency',
  description: 'Get the key holding this currency',
  parameters: [
    swagger.param.currency('fromCurrency', 'USD')
  ],
  responses: {
    200: {
      description: 'A ratio is known for this currency under the return value',
      schema: joiToJSONSchema(stringAllowEmpty)
    }
  }
})

router.get('/:fromCurrency/:toCurrency',
  log,
  numberResponse,
  functions.rate
)
swagger.document('/{fromCurrency}/{toCurrency}', 'get', {
  tags: ['ratios'],
  summary: 'A ratio between two currencies',
  description: 'Get a ratio between a and b',
  parameters: [
    swagger.param.currency('fromCurrency', 'USD'),
    swagger.param.currency('toCurrency', 'BAT')
  ],
  responses: {
    200: {
      description: 'A ratio relative from A to B has been computed successfully',
      schema: joiToJSONSchema(numberAsString)
    }
  }
})

router.get('/',
  log,
  numberCurrencyRatiosResponse,
  functions.all
)
swagger.document('/', 'get', {
  tags: ['ratios'],
  summary: 'All ratios',
  description: 'Calculates all ratios relative to the base.',
  responses: {
    200: {
      description: 'All of the ratios relative to usd have been computed',
      schema: joiToJSONSchema(numberCurrencyRatios)
    }
  }
})

function log (req, res, next) {
  handlingRequest(req)
  next()
}
