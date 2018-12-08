const Joi = require('joi')
const _ = require('lodash')
const regexp = require('./regexp')
const categories = require('./categories')

const {
  numberWithUnit,
  intOrDecimal
} = regexp

const string = Joi.string()
const numberAsString = string.regex(intOrDecimal)
// needs to allow null otherwise first
// request if refresh always fails
const timestamp = Joi.date().iso().allow(null)
const object = Joi.object()
const boolean = Joi.boolean()

const currencyRatios = object.pattern(numberWithUnit, numberAsString.required()).min(1)
const nestedCurrencyRatios = object.pattern(numberWithUnit, currencyRatios).min(1)

const numberCurrencyRatios = object.pattern(numberWithUnit, numberAsString.required()).min(1)
const nestedNumberCurrencyRatios = object.pattern(numberWithUnit, numberCurrencyRatios.required()).min(1)

const stringOrBoolean = Joi.alternatives().try(
  string,
  boolean
)

const fxrates = object.keys({
  disclaimer: string.required(),
  license: string.required(),
  timestamp: Joi.number().required(),
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
const refresh = Joi.object().keys({
  success: boolean,
  previousUpdate: timestamp
}).required()

const wrappedNumberAsString = payloadWrap(numberAsString)
const wrappedListOfStrings = payloadWrap(listOfStrings)
const wrappedCurrencyRatios = payloadWrap(currencyRatios)
const wrappedTimestamp = payloadWrap(timestamp)
const wrappedStringOrBoolean = payloadWrap(stringOrBoolean)
const wrappedStringAsListOrList = payloadWrap(stringAsListOrList)
const wrappedRefresh = payloadWrap(refresh)

module.exports = {
  rates,
  knownGroupsOnly,
  numberAsString,
  currencyRatios,
  timestamp,
  refresh,
  nestedCurrencyRatios,
  listOfStrings,
  stringAsListOrList,
  payloadWrap,
  wrapped: {
    listOfStrings: wrappedListOfStrings,
    currencyRatios: wrappedCurrencyRatios,
    timestamp: wrappedTimestamp,
    refresh: wrappedRefresh,
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
