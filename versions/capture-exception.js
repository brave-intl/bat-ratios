const _ = require('lodash')
const Raven = require('raven')
const serverUrl = require('./server-url')
const debug = require('../debug')
const {
  DSN,
  COMMIT_SLUG
} = require('../env')
const ignoredHeaders = ['authorization', 'cookie']

Raven.config(DSN, {
  enabled: !!DSN,
  release: COMMIT_SLUG,
  captureUnhandledRejections: true
}).install()

process.on('unhandledRejection', (ex) => {
  const { stack, message } = ex
  debug('sentry', { message, stack })
  captureException(ex)
})

module.exports = captureException

function captureException (ex, data, optional = {}) {
  const { req, info } = optional
  if (req) {
    try {
      optional.req = setupException(req)
      optional.extra = _.assign({}, data, info)
    } catch (ex) {
      return Raven.captureException(ex)
    }
  }
  Raven.captureException(ex, optional)
}

function setupException (request) {
  const {
    query,
    method,
    headers,
    originalUrl
  } = request
  const req = { // If present rewrite the requestuest into sentry format
    query,
    method,
    headers: _.omit(headers, ignoredHeaders)
  }
  try {
    let url = new URL(originalUrl, serverUrl)
    if (url) {
      req.url = url
    }
  } catch (ex) {}
  return req
}
