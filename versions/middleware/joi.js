const ExpressJoiValidation = require('express-joi-validation')
const ejv = ExpressJoiValidation({})
module.exports = Object.assign({
  response
}, ejv)

function response (schema, options = {}) {
  const {
    Val = require('joi'),
    failedCode = 500,
    validCode = 200,
    throwOnFail = false,
    respondOnFail = true,
    validatorOptions
  } = options
  return (req, res, next) => {
    res.sendValidJson = sendValidJson
    next()

    function sendValidJson (json) {
      res.originalResponse = json
      return Val.validate(json, schema, validatorOptions)
        .then(send)
        .catch(error)
    }

    function error (error) {
      if (respondOnFail) {
        res.status(failedCode).json(error)
      }
      if (throwOnFail) {
        throw error
      }
      return {
        value: res.originalResponse,
        error
      }
    }

    function send (json) {
      res.status(validCode).json(json)
      return {
        value: json,
        error: null
      }
    }
  }
}
