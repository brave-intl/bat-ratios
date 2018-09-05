const express = require('express')
const bearerToken = require('express-bearer-token')
const boom = require('express-boom')
const uuid = require('uuid')
const _ = require('lodash')
const Currency = require('@brave-intl/currency')
const swaggerUi = require('swagger-ui-express')
const currency = Currency.global()
const debug = require('./debug')
const routers = require('./versions')
const captureException = require('./versions/capture-exception')
const swaggerDocsV1 = require('./versions/v1/swagger')
const app = express()
const {
  DEV,
  PORT,
  TOKEN_LIST
} = require('./env')

module.exports = start
start.server = app

currency.captureException = captureException

app.use(boom())

if (DEV) {
  const swaggerRouteV1 = swaggerUi.setup(swaggerDocsV1, {})
  app.use('/v1/documentation', swaggerUi.serve, swaggerRouteV1)
}

app.use(bearerToken({
  headerKey: 'Bearer'
}))

app.use((req, res, next) => {
  const { token } = req
  const { boom } = res
  if (!token) {
    boom.unauthorized('Missing Authentication')
  } else if (_.includes(TOKEN_LIST, token)) {
    const info = {
      timestamp: _.now(),
      id: uuid.v4()
    }
    res.captureException = (message, data) => {
      captureException(message, data, { req, info })
    }
    next()
  } else {
    boom.unauthorized('Invalid Authentication')
  }
})

app.use('/', routers)

app.use((err, req, res, next) => {
  const { error } = err
  if (error && error.isJoi) {
    return res.status(error.statusCode).send(error.payload)
  }
  res.boom.badImplementation(err.message)
})
app.use((req, res, next) => {
  debug('not found', req.url)
  res.boom.notFound()
})

function start (port = PORT) {
  return new Promise((resolve, reject) => {
    app.listen(port, (err) => {
      if (err) {
        debug('failed to start server', err)
        reject(err)
      } else {
        debug(`started server on ${port}`)
        resolve()
      }
    })
  })
}
