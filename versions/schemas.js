const Joi = require('joi')
const _ = require('lodash')
const regexp = require('./regexp')
const categories = require('./categories')

const { numberWithUnit } = regexp

const positiveNumber = Joi.number().positive()
const string = Joi.string()

const currencyRatios = Joi.object().pattern(numberWithUnit, positiveNumber.required()).min(1)
const nestedCurrencyRatios = Joi.object().pattern(numberWithUnit, currencyRatios)

const deepRates = nestedCurrencyRatios.required()

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

const altOrFait = Joi.string().valid(_.values(categories))
const knownGroupsOnly = Joi.object().keys({
  group1: altOrFait,
  group2: altOrFait
}).unknown(true)

module.exports = {
  rates,
  knownGroupsOnly,
  positiveNumber,
  currencyRatios,
  nestedCurrencyRatios,
  listOfStrings,
  payloadWrap
}

function payloadWrap(schema) {
  return Joi.object().keys({
    lastUpdated: Joi.number().positive().required(),
    value: Joi.alternatives().try(positiveNumber, listOfStrings, currencyRatios)
  })
}
