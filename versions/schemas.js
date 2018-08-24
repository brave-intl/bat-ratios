const Joi = require('joi')
const regexp = require('./regexp')
const { numberWithUnit } = regexp

const positiveNumber = Joi.number().positive()
const string = Joi.string()

const currencyRatios = Joi.object().pattern(numberWithUnit, positiveNumber.required())
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

const listOfStrings = Joi.array().items(string)

module.exports = {
  rates,
  number,
  currencyRatios,
  nestedCurrencyRatios,
  listOfStrings
}
