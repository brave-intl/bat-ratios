const {
  parse
} = require('url')
const {
  DEV,
  HOST
} = require('src/utils/env')
const url = `http${DEV ? 's' : ''}://${HOST}`
module.exports = parse(url)
