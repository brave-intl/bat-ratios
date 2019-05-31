const onFinished = require('on-finished')
const uuid = require('uuid')
const _ = require('lodash')
const serverUrl = require('src/server/url')
const {
  log,
  handlingResponse
} = require('src/utils/debug')
const Sentry = require('src/server/sentry')
const ignoredHeaders = ['authorization', 'cookie']

process.on('unhandledRejection', handleException)
process.on('uncaughtException', handleException)

module.exports = captureException
captureException.middleware = captureExceptionMiddleware

function handleException (ex) {
  const exception = ex || {}
  const { stack, message } = exception
  log('sentry', { message, stack })
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
    req.info = info
    res.captureException = (message, data) => {
      captureException(message, data, { req, info })
    }
    onFinished(res, (err, res) => {
      if (res.statusCode < 400) {
        return
      }
      handlingResponse('failed', req, res)
      res.captureException(err)
    })
    next()
  }
}
