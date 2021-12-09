
const {
  NODE_ENV
} = require('$/env')
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
  const {
    route,
    info,
    originalUrl: url,
    method,
    params,
    query
  } = req
  if (process.env.DEBUG_CACHE) {
    handling('%o', {
      info,
      url,
      method,
      match: route && route.path,
      params,
      query
    })
  }
}

function handlingResponse (progress, req, res) {
  const {
    originalUrl: url,
    info
  } = req
  if (process.env.DEBUG_CACHE) {
    handling('%o', {
      progress,
      info,
      status: res.statusCode,
      url
    })
  }
}
