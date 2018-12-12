const Joi = require('joi')
const _ = require('lodash')
const regexp = require('./regexp')
const categories = require('./categories')

const {
  numberWithUnit,
  intOrDecimal
} = regexp

const string = Joi.string()
const currency = string.regex(numberWithUnit)
const numberAsString = string.regex(intOrDecimal)
// needs to allow null otherwise first
// request if refresh always fails
const iso = Joi.date().iso()
const jsDate = Joi.date().timestamp('javascript')
const isoNullable = iso.allow(null)
const object = Joi.object()
const boolean = Joi.boolean()
const broadDate = Joi.alternatives().try(
  iso,
  jsDate
)

const numberCurrencyRatios = object.pattern(currency, numberAsString.required())
const nestedNumberCurrencyRatios = object.pattern(currency, numberCurrencyRatios.required())

const stringOrBoolean = Joi.alternatives().try(
  string,
  boolean
)

const fxrates = object.keys({
  disclaimer: string.required(),
  license: string.required(),
  timestamp: jsDate.required(),
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
  previousUpdate: isoNullable
}).required()
const dateOptionalUntil = Joi.object().keys({
  from: broadDate.required(),
  until: broadDate.allow(null)
}).required()
const prices = Joi.object().keys({
  fiat: numberCurrencyRatios.required(),
  alt: numberCurrencyRatios.required()
}).required()
const stateObject = Joi.object().keys({
  date: iso,
  lastUpdated: iso,
  prices
})
const listOfStates = Joi.array().items(stateObject)

const wrappedNumberAsString = payloadWrap(numberAsString)
const wrappedListOfStrings = payloadWrap(listOfStrings)
const wrappedIsoNullable = payloadWrap(isoNullable)
const wrappedStringOrBoolean = payloadWrap(stringOrBoolean)
const wrappedStringAsListOrList = payloadWrap(stringAsListOrList)
const wrappedRefresh = payloadWrap(refresh)
const wrappedDateOptionalUntil = payloadWrap(dateOptionalUntil)
const wrappedNumberCurrencyRatios = payloadWrap(numberCurrencyRatios)

module.exports = {
  rates,
  knownGroupsOnly,
  numberAsString,
  refresh,
  listOfStrings,
  stringAsListOrList,
  payloadWrap,
  listOfStates,
  broadDate,
  numberCurrencyRatios,
  dateOptionalUntil,
  stateObject,
  currency,
  wrapped: {
    numberCurrencyRatios: wrappedNumberCurrencyRatios,
    dateOptionalUntil: wrappedDateOptionalUntil,
    listOfStrings: wrappedListOfStrings,
    isoNullable: wrappedIsoNullable,
    refresh: wrappedRefresh,
    stringOrBoolean: wrappedStringOrBoolean,
    numberAsString: wrappedNumberAsString,
    stringAsListOrList: wrappedStringAsListOrList
  }
}

function payloadWrap (payload) {
  return object.keys({
    lastUpdated: isoNullable.required(),
    payload
  })
}
