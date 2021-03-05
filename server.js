const express = require('express')
const _ = require('lodash')
const boom = require('express-boom')
const path = require('path')
const Currency = require('@brave-intl/currency')
const currency = Currency.global()
const { log, loggers } = require('$/debug')
const routers = require('$/versions')
const Sentry = require('$/sentry')
const captureException = require('$/capture-exception')
const prometheusMiddleware = require('$/versions/middleware/prometheus')
const privateConnectionMiddleware = require('$/versions/middleware/private-connection')

const app = express()
const {
  DEV,
  PORT,
  PRIVATE_PORT
} = require('$/env')

module.exports = start
start.app = app
start.listen = listen

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

app.use(privateConnectionMiddleware.handler({
  port: PRIVATE_PORT,
  paths: ['/metrics'],
  erred: (req, res) => res.boom.notFound()
}))
app.use(prometheusMiddleware.handler)

if (DEV) {
  // documentation
  const swaggerUi = require('swagger-ui-express')
  const swaggerDocsV1 = require('$/versions/v1/swagger')
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
app.get('/', (req, res) => res.send('.'))
app.use(Sentry.Handlers.errorHandler())
app.use((req, res, next) => res.boom.notFound())

function start (port = PORT, privatePort = PRIVATE_PORT) {
  return Promise.all([
    listen(app, privatePort),
    listen(app, port)
  ])
}

function listenCallback (port, resolve, reject) {
  return (err) => {
    if (err) {
      loggers.exception('failed to start server', err)
      reject(err)
    } else {
      log(`started server on ${port}`)
      resolve(app)
    }
  }
}

function listen (app, port) {
  return new Promise((resolve, reject) =>
    app.listen(port,
      listenCallback(port, resolve, reject)
    )
  )
}
