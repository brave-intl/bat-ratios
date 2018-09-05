const { Router } = require('express')
const joiToJSONSchema = require('joi-to-json-schema')
const functions = require('./functions')
const { available } = functions
const schemas = require('../schemas')
const checkers = require('../middleware/joi')
const swagger = require('./swagger')
const router = new Router()

module.exports = router

const {
  knownGroupsOnly,
  rates,
  wrapped,
  stringAsListOrList
} = schemas

const {
  listOfStrings,
  currencyRatios,
  positiveNumber,
  timestamp,
  stringOrBoolean
} = wrapped

const currencyRatiosResponse = checkers.response(currencyRatios)
const numberResponse = checkers.response(positiveNumber)
const timestampResponse = checkers.response(timestamp)
const listResponse = checkers.response(listOfStrings)
const ratesResponse = checkers.response(rates)
const listOfStringsResponse = checkers.response(listOfStrings)
const stringOrBooleanResponse = checkers.response(stringOrBoolean)

const groupParams = checkers.params(knownGroupsOnly)
const queryCurrencySplit = checkers.query({
  currency: stringAsListOrList
})

router.get('/refresh', timestampResponse, functions.refresh)
swagger.document('/refresh', 'get', {
  tags: ['util'],
  summary: 'Wipe the cached currencies',
  description: 'Deletes the cached currencies and fetches new ones.',
  responses: {
    '200': {
      description: 'Successfully refreshed and recached currencies',
      schema: joiToJSONSchema(timestamp)
    }
  }
})

router.get('/available/fiat',
  listOfStringsResponse,
  listResponse,
  available.fiat
)
swagger.document('/available/fiat', 'get', {
  tags: ['supported'],
  summary: 'List of available fiat currencies',
  description: 'Gets the tickers of all available fiat currencies',
  responses: {
    '200': {
      description: 'Tickers were found',
      schema: joiToJSONSchema(listOfStrings)
    }
  }
})

router.get('/available/alt',
  listOfStringsResponse,
  listResponse,
  available.alt
)
swagger.document('/available/alt', 'get', {
  tags: ['supported'],
  summary: 'List of available alt currencies',
  description: 'Gets the tickers of all available alt currencies',
  responses: {
    '200': {
      description: 'Tickers were found',
      schema: joiToJSONSchema(listOfStrings)
    }
  }
})

router.get('/available',
  listOfStringsResponse,
  listResponse,
  available.all
)
swagger.document('/available', 'get', {
  tags: ['supported'],
  summary: 'List of available fiat and alt currencies',
  description: 'Gets the tickers of all available fiat and alt currencies',
  responses: {
    '200': {
      description: 'Tickers were found',
      schema: joiToJSONSchema(listOfStrings)
    }
  }
})

router.get(
  '/:group1/:a/:group2/:b',
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
    '200': {
      description: 'Found each currency and created a valid trade ratio estimate.',
      schema: joiToJSONSchema(positiveNumber)
    }
  }
})

router.get(
  '/relative/:group1/:a',
  groupParams,
  queryCurrencySplit,
  currencyRatiosResponse,
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
    '200': {
      description: 'The ratios were correctly computed.',
      schema: joiToJSONSchema(currencyRatios)
    }
  }
})

router.get(
  '/relative/:a',
  queryCurrencySplit,
  currencyRatiosResponse,
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
    '200': {
      description: 'The ratios were correctly computed.',
      schema: joiToJSONSchema(currencyRatios)
    }
  }
})

router.get('/rates', ratesResponse, functions.rates)
swagger.document('/rates', 'get', {
  tags: ['rates'],
  summary: 'Previously supported rates endpoint',
  responses: {
    '200': {
      description: 'All rates correctly computed and wrapped.',
      schema: joiToJSONSchema(rates)
    }
  }
})

router.get('/fiat', currencyRatiosResponse, functions.fiat)
swagger.document('/fiat', 'get', {
  tags: ['ratios'],
  summary: 'All fiat ratios',
  description: '',
  responses: {
    '200': {
      description: 'All fiat ratios computed correctly.',
      schema: joiToJSONSchema(currencyRatios)
    }
  }
})

router.get('/alt', currencyRatiosResponse, functions.alt)
swagger.document('/alt', 'get', {
  tags: ['ratios'],
  summary: 'A list of alt ratios',
  description: 'All alt ratios',
  responses: {
    '200': {
      description: 'All alt ratios computed correclty.',
      schema: joiToJSONSchema(currencyRatios)
    }
  }
})

router.get('/key/:a', stringOrBooleanResponse, functions.key)
swagger.document('/key/{a}', 'get', {
  tags: ['ratios'],
  summary: 'A key exists for this currency',
  description: 'Get the key holding this currency',
  parameters: [
    swagger.param.currency('a', 'USD')
  ],
  responses: {
    '200': {
      description: 'A ratio is known for this currency under the return value',
      schema: joiToJSONSchema(stringOrBoolean)
    }
  }
})

router.get('/:a/:b', numberResponse, functions.unknown)
swagger.document('/{a}/{b}', 'get', {
  tags: ['ratios'],
  summary: 'A ratio between two currencies',
  description: 'Get a ratio between a and b',
  parameters: [
    swagger.param.currency('a', 'USD'),
    swagger.param.currency('b', 'BAT')
  ],
  responses: {
    '200': {
      description: 'A ratio relative from A to B has been computed successfully',
      schema: joiToJSONSchema(positiveNumber)
    }
  }
})

router.get('/', currencyRatiosResponse, functions.all)
swagger.document('/', 'get', {
  tags: ['ratios'],
  summary: 'All ratios',
  description: 'Calculates all ratios relative to the base.',
  responses: {
    '200': {
      description: 'All of the ratios relative to usd have been computed',
      schema: joiToJSONSchema(currencyRatios)
    }
  }
})
