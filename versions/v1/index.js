const { Router } = require('express')
const functions = require('./functions')
const available = require('./available')
const router = new Router()
const schemas = require('../schemas')
const checkers = require('../middleware/joi')

module.exports = router

const {
  payloadWrap,
  currencyRatios,
  positiveNumber,
  listOfStrings,
  knownGroupsOnly,
  rates
} = schemas

const currencyRatiosResponse = checkers.response(payloadWrap(currencyRatios))
const numberResponse = checkers.response(payloadWrap(positiveNumber))
const listResponse = checkers.response(payloadWrap(listOfStrings))
const ratesResponse = checkers.response(rates)
const listOfStringsResponse = checkers.response(payloadWrap(listOfStrings))

const groupParams = checkers.params(knownGroupsOnly)

router.use('/refresh', numberResponse, functions.refresh)
router.use(
  '/:group1/:a/:group2/:b',
  groupParams,
  numberResponse,
  functions.known
)
router.use('/available', listOfStringsResponse, available)
router.use('/rates', ratesResponse, functions.rates)
router.use(
  '/:group1/:a',
  groupParams,
  currencyRatiosResponse,
  functions.against
)
router.use('/fiat', currencyRatiosResponse, functions.fiat)
router.use('/alt', currencyRatiosResponse, functions.alt)
router.use('/:a/:b', numberResponse, functions.unknown)
router.use('/', currencyRatiosResponse, functions.all)
