const {
  parse
} = require('url')
const {
  DEV,
  HOST
} = require('../env')
const url = `http${DEV ? 's' : ''}://${HOST}`
module.exports = parse(url)
