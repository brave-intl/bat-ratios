const {
  NODE_ENV
} = require('./env')
const Debug = require('debug')
const debug = new Debug('bat-ratios')
debug('environment', NODE_ENV)
module.exports = debug
