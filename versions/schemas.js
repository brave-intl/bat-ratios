const Joi = require('joi')
const _ = require('lodash')
const regexp = require('./regexp')
const categories = require('./categories')

const {
  numberWithUnit,
  intOrDecimal
} = regexp

const string = Joi.string()
const positiveNumber = Joi.number().positive().precision(18)
const numberAsString = string.regex(intOrDecimal)
const timestamp = Joi.date().iso()
const object = Joi.object()

const currencyRatios = object.pattern(numberWithUnit, numberAsString.required()).min(1)
const nestedCurrencyRatios = object.pattern(numberWithUnit, currencyRatios)

const numberCurrencyRatios = object.pattern(numberWithUnit, positiveNumber.required()).min(1)
const nestedNumberCurrencyRatios = object.pattern(numberWithUnit, numberCurrencyRatios.required()).min(1)

const stringOrBoolean = Joi.alternatives().try(
  string,
  Joi.boolean()
)

const fxrates = object.keys({
  disclaimer: string.required(),
  license: string.required(),
  timestamp: positiveNumber.required(),
  base: string.required(),
  rates: numberCurrencyRatios.required()
}).required()

const rates = object.keys({
  fxrates,
  altrates: nestedNumberCurrencyRatios.required(),
  rates: nestedNumberCurrencyRatios.required()
}).required()

const listOfStrings = Joi.array().items(string).min(1)

const stringAsListOrList = Joi.alternatives().try(
  listOfStrings,
  string.allow(null).allow('')
)

const altOrFait = Joi.string().valid(_.values(categories))
const knownGroupsOnly = object.keys({
  group1: altOrFait,
  group2: altOrFait
}).unknown(true)

const wrappedNumberAsString = payloadWrap(numberAsString)
const wrappedListOfStrings = payloadWrap(listOfStrings)
const wrappedCurrencyRatios = payloadWrap(currencyRatios)
const wrappedPositiveNumber = payloadWrap(positiveNumber)
const wrappedTimestamp = payloadWrap(timestamp)
const wrappedStringOrBoolean = payloadWrap(stringOrBoolean)
const wrappedStringAsListOrList = payloadWrap(stringAsListOrList)

module.exports = {
  rates,
  timestamp,
  knownGroupsOnly,
  positiveNumber,
  currencyRatios,
  nestedCurrencyRatios,
  listOfStrings,
  stringAsListOrList,
  payloadWrap,
  numberAsString,
  wrapped: {
    listOfStrings: wrappedListOfStrings,
    currencyRatios: wrappedCurrencyRatios,
    positiveNumber: wrappedPositiveNumber,
    timestamp: wrappedTimestamp,
    stringOrBoolean: wrappedStringOrBoolean,
    numberAsString: wrappedNumberAsString,
    stringAsListOrList: wrappedStringAsListOrList
  }
}

function payloadWrap (payload) {
  return object.keys({
    lastUpdated: timestamp.required(),
    payload
  })
}
