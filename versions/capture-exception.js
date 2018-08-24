const uuid = require('uuid')
const _ = require('lodash')
const Sentry = require('@sentry/node')
const serverUrl = require('./server-url')
const debug = require('../debug')
const {
  DSN,
  COMMIT_SLUG
} = require('../env')
const ignoredHeaders = ['authorization', 'cookie']

Sentry.init({
  dsn: DSN,
  enabled: !!DSN,
  release: COMMIT_SLUG,
  captureUnhandledRejections: true
})

process.on('unhandledRejection', handleException)
process.on('uncaughtException', handleException)

module.exports = captureException
captureException.middleware = captureExceptionMiddleware

function handleException (ex) {
  const exception = ex || {}
  const { stack, message } = exception
  debug('sentry', { message, stack })
  captureException(exception)
}

function captureException (ex, data, optional = {}) {
  const { req, info } = optional
  if (req) {
    try {
      optional.req = setupException(req)
      optional.extra = _.assign({}, data, info)
    } catch (ex) {
      return Sentry.captureException(ex)
    }
  }
  Sentry.captureException(ex, optional)
}

function setupException (request) {
  const {
    query,
    method,
    headers,
    originalUrl
  } = request
  const req = {
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

function captureExceptionMiddleware () {
  return (req, res, next) => {
    const info = {
      timestamp: _.now(),
      id: uuid.v4()
    }
    res.captureException = (message, data) => {
      captureException(message, data, { req, info })
    }
    res.on('finish', () => {
      if (res.statusCode < 300) {
        return
      }
      debug('request failed', res.statusCode)
      res.captureException()
    })
    next()
  }
}
