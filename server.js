const express = require('express')
const _ = require('lodash')
const boom = require('express-boom')
const path = require('path')
const Currency = require('@brave-intl/currency')
const currency = Currency.global()
const { log, loggers } = require('./debug')
const routers = require('./versions')
const Sentry = require('./sentry')
const captureException = require('./capture-exception')
const prometheusMiddleware = require('./versions/middleware/prometheus')

const app = express()
const {
  DEV,
  PORT
} = require('./env')

module.exports = start
start.server = app
app.use((req, res, next) => {
  res.vary('Authorization')
  next()
})
app.use(boom())
app.use(captureException.middleware())
currency.captureException = captureException
app.use(Sentry.Handlers.requestHandler())

const robotPath = path.join(__dirname, 'robots.txt')
app.use('/robots.txt', (req, res) => {
  res.sendFile(robotPath)
})
app.use(prometheusMiddleware)

if (DEV) {
  // documentation
  const swaggerUi = require('swagger-ui-express')
  const swaggerDocsV1 = require('./versions/v1/swagger')
  const swaggerRouteV1 = swaggerUi.setup(swaggerDocsV1, {})
  app.use('/v1/documentation', swaggerUi.serve, swaggerRouteV1)
}
app.get('/isup', async (req, res) => {
  // non forced update
  await currency.update()
  // send boolean metadata about status
  res.send({
    alt: !_.isNull(currency.get(['alt', 'BAT'])),
    fiat: !_.isNull(currency.get(['fiat', 'USD']))
  })
})
app.use('/', routers)
app.use(Sentry.Handlers.errorHandler())
app.use((req, res, next) => res.boom.notFound())

function start (port = PORT) {
  return new Promise((resolve, reject) => {
    // console.log(port, PORT)
    app.listen(port, (err) => {
      if (err) {
        loggers.exception('failed to start server', err)
        reject(err)
      } else {
        log(`started server on ${port}`)
        resolve()
      }
    })
  })
}
