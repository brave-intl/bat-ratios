const { Router } = require('express')
const expressRequestCSV = require('express-request-csv')
const csvConfig = require('../middleware/csv-configs')
const { handlingRequest } = require('../../debug')
const joiToJSONSchema = require('joi-to-json-schema')
const functions = require('./functions')
const {
  available,
  history
} = functions
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
  stringOrBoolean
} = wrapped

const priceDateResponse = checkers.response(priceDate)
const listOfPriceDateResponse = checkers.response(listOfPriceDate)
const numberCurrencyRatiosResponse = checkers.response(numberCurrencyRatios)
const numberResponse = checkers.response(numberAsString)
const refreshResponse = checkers.response(refresh)
const listResponse = checkers.response(listOfStrings)
const ratesResponse = checkers.response(rates)
const listOfStringsResponse = checkers.response(listOfStrings)
const stringOrBooleanResponse = checkers.response(stringOrBoolean)
const listOfStatesResponse = checkers.response(listOfStates)
const stateObjectResponse = checkers.response(stateObject)
const dateGroupA = dateOptionalUntil.keys({
  group1: altOrFiat,
  a: currency
})
const dateGroupAB = dateGroupA.keys({
  group2: altOrFiat,
  b: currency
})
const dateParamsGroupA = checkers.params(dateGroupA)
const dateParamsGroupAB = checkers.params(dateGroupAB)
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
  '/relative/history/single/:group1/:a/:group2/:b/:from',
  log,
  dateParamsGroupAB,
  priceDateResponse,
  history.singleRelativeCurrency
)
swagger.document('/relative/history/single/{group1}/{a}/{group2}/{b}/{from}', 'get', {
  tags: ['history'],
  summary: 'Historical data exists for this currency on this day relative to the base given',
  description: 'Get the historical data for this currency on the given day relative to the base given',
  parameters: [
    swagger.param.group('group1', 'fiat'),
    swagger.param.currency('a', 'USD'),
    swagger.param.group('group2', 'alt'),
    swagger.param.currency('b', 'BAT'),
    swagger.param.date('from', {
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
  '/relative/history/:group1/:a/:group2/:b/:from/:until',
  log,
  singleCurrencyCSV,
  dateParamsGroupAB,
  listOfPriceDateResponse,
  history.relativeCurrency
)
swagger.document('/relative/history/{group1}/{a}/{group2}/{b}/{from}/{until}', 'get', {
  tags: ['history'],
  summary: 'Historical data exists for this currency relative to the base given',
  description: 'Get the historical data for this currency relative to the base given',
  parameters: [
    swagger.param.group('group1', 'fiat'),
    swagger.param.currency('a', 'USD'),
    swagger.param.group('group2', 'alt'),
    swagger.param.currency('b', 'BAT'),
    swagger.param.date('from', {
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
  '/history/single/:group1/:a/:from',
  log,
  dateParamsGroupA,
  stateObjectResponse,
  history.singleDate
)
swagger.document('/history/single/{group1}/{a}/{from}', 'get', {
  tags: ['history'],
  summary: 'Historical data exists for this currency',
  description: 'Get the historical data for this currency',
  parameters: [
    swagger.param.group('group1', 'fiat'),
    swagger.param.currency('a', 'USD'),
    swagger.param.date('from', {
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
  '/history/:group1/:a/:from/:until',
  log,
  deepObjectCSV,
  dateParamsGroupA,
  listOfStatesResponse,
  history.between
)
swagger.document('/history/{group1}/{a}/{from}/{until}', 'get', {
  tags: ['history'],
  summary: 'Historical data exists for this currency',
  description: 'Get the historical data for this currency',
  parameters: [
    swagger.param.group('group1', 'fiat'),
    swagger.param.currency('a', 'USD'),
    swagger.param.date('from', {
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

router.get('/available/fiat',
  log,
  listOfStringsResponse,
  listResponse,
  available.fiat
)
swagger.document('/available/fiat', 'get', {
  tags: ['supported'],
  summary: 'List of available fiat currencies',
  description: 'Gets the tickers of all available fiat currencies',
  responses: {
    200: {
      description: 'Tickers were found',
      schema: joiToJSONSchema(listOfStrings)
    }
  }
})

router.get('/available/alt',
  log,
  listOfStringsResponse,
  listResponse,
  available.alt
)
swagger.document('/available/alt', 'get', {
  tags: ['supported'],
  summary: 'List of available alt currencies',
  description: 'Gets the tickers of all available alt currencies',
  responses: {
    200: {
      description: 'Tickers were found',
      schema: joiToJSONSchema(listOfStrings)
    }
  }
})

router.get('/available',
  log,
  listOfStringsResponse,
  listResponse,
  available.all
)
swagger.document('/available', 'get', {
  tags: ['supported'],
  summary: 'List of available fiat and alt currencies',
  description: 'Gets the tickers of all available fiat and alt currencies',
  responses: {
    200: {
      description: 'Tickers were found',
      schema: joiToJSONSchema(listOfStrings)
    }
  }
})

router.get(
  '/:group1/:a/:group2/:b',
  log,
  groupParams,
  numberResponse,
  functions.known
)
swagger.document('/{group1}/{a}/{group2}/{b}', 'get', {
  tags: ['ratios'],
  summary: 'Access a specific fiat or alt ratio or any combination of the two',
  description: 'Accesses each currency (a and b) in their respective groups and divides b by a to answer the question, how many b\'s can i buy with 1 a?',
  parameters: [
    swagger.param.group('group1', 'fiat'),
    swagger.param.currency('a', 'USD'),
    swagger.param.group('group2', 'alt'),
    swagger.param.currency('b', 'BAT')
  ],
  responses: {
    200: {
      description: 'Found each currency and created a valid trade ratio estimate.',
      schema: joiToJSONSchema(numberAsString)
    }
  }
})

router.get(
  '/relative/:group1/:a',
  log,
  groupParams,
  queryCurrencySplit,
  numberCurrencyRatiosResponse,
  functions.relative
)
swagger.document('/relative/{group1}/{a}', 'get', {
  tags: ['ratios'],
  summary: 'Compute ratios relative to a given currency (a)',
  description: 'What are the prices of all other currencies relative to the price of the given currency under a specified group.',
  parameters: [
    swagger.param.group('group1', 'fiat'),
    swagger.param.currency('a', 'EUR'),
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
  '/relative/:a',
  log,
  queryCurrencySplit,
  numberCurrencyRatiosResponse,
  functions.relativeUnknown
)
swagger.document('/relative/{a}', 'get', {
  tags: ['ratios'],
  summary: 'Compute ratios relative to a given currency (a)',
  description: 'What are the prices of all other currencies relative to the price of the given currency.',
  parameters: [
    swagger.param.currency('a', 'EUR'),
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

router.get('/key/:a',
  log,
  stringOrBooleanResponse,
  functions.key
)
swagger.document('/key/{a}', 'get', {
  tags: ['ratios'],
  summary: 'A key exists for this currency',
  description: 'Get the key holding this currency',
  parameters: [
    swagger.param.currency('a', 'USD')
  ],
  responses: {
    200: {
      description: 'A ratio is known for this currency under the return value',
      schema: joiToJSONSchema(stringOrBoolean)
    }
  }
})

router.get('/:a/:b',
  log,
  numberResponse,
  functions.unknown
)
swagger.document('/{a}/{b}', 'get', {
  tags: ['ratios'],
  summary: 'A ratio between two currencies',
  description: 'Get a ratio between a and b',
  parameters: [
    swagger.param.currency('a', 'USD'),
    swagger.param.currency('b', 'BAT')
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
