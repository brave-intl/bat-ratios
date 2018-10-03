const Joi = require('joi')
const _ = require('lodash')
const regexp = require('./regexp')
const categories = require('./categories')

const { numberWithUnit } = regexp

const positiveNumber = Joi.number().positive().precision(18)
const string = Joi.string()
const timestamp = Joi.date().iso()

const currencyRatios = Joi.object().pattern(numberWithUnit, positiveNumber.required()).min(1)
const nestedCurrencyRatios = Joi.object().pattern(numberWithUnit, currencyRatios)

const deepRates = nestedCurrencyRatios.required()

const stringOrBoolean = Joi.alternatives().try(
  string,
  Joi.boolean()
)

const fxrates = Joi.object().keys({
  disclaimer: string.required(),
  license: string.required(),
  timestamp: positiveNumber.required(),
  base: string.required(),
  rates: currencyRatios.required()
})

const rates = Joi.object().keys({
  fxrates,
  altrates: deepRates,
  rates: deepRates
}).required()

const listOfStrings = Joi.array().items(string).min(1)

const stringAsListOrList = Joi.alternatives().try(
  listOfStrings,
  string.allow(null).allow('')
)

const altOrFait = Joi.string().valid(_.values(categories))
const knownGroupsOnly = Joi.object().keys({
  group1: altOrFait,
  group2: altOrFait
}).unknown(true)

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
  wrapped: {
    listOfStrings: wrappedListOfStrings,
    currencyRatios: wrappedCurrencyRatios,
    positiveNumber: wrappedPositiveNumber,
    timestamp: wrappedTimestamp,
    stringOrBoolean: wrappedStringOrBoolean,
    stringAsListOrList: wrappedStringAsListOrList
  }
}

function payloadWrap (payload) {
  return Joi.object().keys({
    lastUpdated: timestamp.required(),
    payload
  })
}
