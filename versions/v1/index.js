const { Router } = require('express')
const functions = require('./functions')
const available = require('./available')
const router = new Router()
const schemas = require('../schemas')
const checkers = require('../middleware/joi')

module.exports = router

const objectOfNumbersResponse = checkers.response(schemas.objectOfNumbers)
const numberResponse = checkers.response(schemas.number)
const listResponse = checkers.response(schemas.listOfStrings)
const ratesResponse = checker.response(schemas.rates)
const listOfStringsResponse = checker.response(schemas.listOfStrings)

router.use('/:group1/:a/:group2/:b', numberResponse, functions.known)
router.use('/available', listOfStringsResponse, available)
router.use('/rates', ratesResponse, functions.rates)
router.use('/fiats', objectOfNumbersResponse, functions.fiats)
router.use('/alts', objectOfNumbersResponse, functions.alts)
router.use('/:a/:b', numberResponse, functions.unknown)
router.use('/', objectOfNumbersResponse, functions.all)
