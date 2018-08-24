const Joi = require('joi')

module.exports = {
  validate,
  status,
  timeout
}

function validate (data, schema) {
  const { error } = Joi.validate(data, schema)
  if (error) {
    throw new Error(error)
  }
}

function status (expected) {
  return function ({ status, body }) {
    if (status !== expected) {
      console.log(`${status} was not ${expected}`)
      return new Error(JSON.stringify(body))
    }
  }
}

function timeout (ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
