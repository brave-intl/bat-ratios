const {
  NODE_ENV
} = require('./env')
const Debug = require('debug')
const debug = new Debug('bat-ratios')
debug('environment', NODE_ENV)
const history = debug.extend('history')
const handling = debug.extend('handling')
const exception = debug.extend('exception')
const postgres = debug.extend('postgres')
const io = debug.extend('io')
const loggers = {
  postgres,
  exception,
  handling,
  history,
  io
}
module.exports = {
  log: debug,
  loggers,
  handlingResponse,
  handlingRequest
}

function handlingRequest (req) {
  handling({
    url: req.originalUrl,
    method: req.method,
    match: req.route.path,
    params: req.params,
    query: req.query
  })
}

function handlingResponse (message, res) {
  handling(message, {
    status: res.status,
    body: res.body
  })
}
