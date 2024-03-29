const express = require('express')
const _ = require('lodash')
const boom = require('express-boom')
const path = require('path')
const fs = require('fs')
const Currency = require('@brave-intl/currency')
const currency = Currency.global()
const { log, loggers } = require('$/debug')
const routers = require('$/versions')
const Sentry = require('$/sentry')
const captureException = require('$/capture-exception')
const bundle = require('express-prom-bundle')
const prometheusMiddleware = require('$/versions/middleware/prometheus')

const app = express()
const metricsApp = express()
const {
  DEV,
  PORT,
  METRICS_PORT
} = require('$/env')

// setup metrics middleware
app.use(prometheusMiddleware)

// setup metrics app
metricsApp.use('/metrics', bundle.clusterMetrics())

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
const robotText = fs.readFileSync(robotPath, 'utf8')
app.use('/robots.txt', (req, res) => {
  res.send(robotText)
})

if (DEV) {
  // documentation
  const swaggerUi = require('swagger-ui-express')
  _.forOwn({
    v1: require('$/versions/v1/swagger'),
    v2: require('$/versions/v2/swagger')
  }, (docs, version) => {
    app.use(
      `/${version}/documentation`,
      swaggerUi.serve,
      swaggerUi.setup(docs, {})
    )
  })
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
app.get('/', (req, res) => res.send('.'))
app.use(Sentry.Handlers.errorHandler())
app.use((req, res, next) => res.boom.notFound())

function start (port = PORT) {
  return new Promise((resolve, reject) => {
    metricsApp.listen(METRICS_PORT, (err) => {
      if (err) {
        loggers.exception('failed to start metrics server', err)
        reject(err)
      } else {
        log(`started metrics server on ${port}`)
        resolve()
      }
    })
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
