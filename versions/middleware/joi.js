const ExpressJoiValidation = require('express-joi-validation')
const ejv = ExpressJoiValidation({})
module.exports = Object.assign({
  response
}, ejv)

function response (schema, options = {}) {
  const {
    Val = require('joi'),
    throwOnFail = false,
    respondOnFail = true
  } = options
  return (req, res, next) => {
    res.sendValidJson = sendValidJson
    next()

    function sendValidJson (object) {
      return Val.validate(object, schema, options.joi)
        .then((object) => respond(200, object))
        .catch((error) => {
          if (respondOnFail) {
            respond(500, error)
          }
          if (throwOnFail) {
            throw error
          }
        })

      function respond (status, object) {
        res.status(status).json(object)
      }
    }
  }
}
