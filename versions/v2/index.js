const { Router } = require('express')
const { handlingRequest } = require('$/debug')
const joiToJSONSchema = require('joi-to-json-schema')
const functions = require('$/versions/v2/functions')
const {
  rates,
  history
} = functions
const schemas = require('$/versions/schemas')
const checkers = require('$/versions/middleware/joi')
const swagger = require('$/versions/v2/swagger')
const router = new Router()

module.exports = router

const {
  coingeckoSpotPrice,
  coingeckoPriceData
} = schemas.wrapped

router.get(
  '/history/coingecko/:a/:b/:from/:until?',
  log,
  checkers.response(coingeckoPriceData),
  history.coingeckoRates
)
swagger.document('/history/coingecko/{a}/{b}/{from}/{until}', 'get', {
  tags: ['history'],
  summary: 'Historical data from coingecko',
  description: 'Get the historical data for this currency',
  parameters: [
    swagger.param.currency('a', 'basic-attention-token'),
    swagger.param.currency('b', 'usd'),
    swagger.param.date('from', {
      allowEmptyValue: false,
      oneOfExtra: [{
        type: 'string',
        enum: ['live', '1d', '1w', '1m', '3m', '1y', 'all']
      }]
    }),
    swagger.param.date('until'),
    swagger.query.string('refresh')
  ],
  responses: {
    200: {
      description: 'a response was received from coingecko',
      schema: joiToJSONSchema(coingeckoPriceData)
    }
  }
})

router.get(
  '/relative/provider/:provider/:a/:b',
  log,
  // no response check
  checkers.response(coingeckoSpotPrice),
  rates.coingeckoSpotPrice
)
swagger.document('/relative/provider/{provider}/{a}/{b}', 'get', {
  tags: ['ratios'],
  summary: 'get currency from coingecko',
  description: 'get currency from coingecko',
  parameters: [
    swagger.param.string('provider', 'coingecko'),
    swagger.param.currency('a', 'basic-attention-token'),
    swagger.param.currency('b', 'usd'),
    swagger.query.string('refresh')
  ],
  responses: {
    200: {
      description: 'a response was received from coingecko',
      schema: joiToJSONSchema(coingeckoSpotPrice)
    }
  }
})

router.get(
  '/coingecko/passthrough',
  log,
  // no response check
  rates.coingeckoPassthrough
)
swagger.document('/coingecko/passthrough', 'get', {
  tags: ['history'],
  summary: 'get any path from coingecko, imposes a rate limit',
  description: 'get any path from coingecko, imposes a rate limit',
  parameters: [
    swagger.param.currency('passthrough')
  ]
})

function log (req, res, next) {
  handlingRequest(req)
  next()
}
