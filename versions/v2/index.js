const { Router } = require('express')
const { handlingRequest } = require('$/debug')
const joiToJSONSchema = require('joi-to-json-schema')
const functions = require('$/versions/v2/functions')
const {
  history
} = functions
const schemas = require('$/versions/schemas')
const checkers = require('$/versions/middleware/joi')
const swagger = require('$/versions/v2/swagger')
const router = new Router()

module.exports = router

const {
  coingeckoPriceData
} = schemas

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
      allowEmptyValue: false
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
  '/coingecko/passthrough',
  log,
  // no response check
  history.coingeckoPassthrough
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
