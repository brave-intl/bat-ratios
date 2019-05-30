const ExpressJoiValidation = require('express-joi-validation')
const ejv = ExpressJoiValidation({
  passError: true
})
module.exports = ejv
