const express = require('express')
const bearerToken = require('express-bearer-token')
const boom = require('express-boom')
const path = require('path')
const Currency = require('@brave-intl/currency')
const currency = Currency.global()
const { log, loggers } = require('./debug')
const routers = require('./versions')
const Sentry = require('./sentry')
const captureException = require('./capture-exception')
const strategies = require('./versions/middleware/strategies')
const auth = require('./versions/middleware/auth')

const app = express()
const {
  DEV,
  PORT
} = require('./env')

module.exports = start
start.server = app

app.use(captureException.middleware())
currency.captureException = captureException
app.use(Sentry.Handlers.requestHandler())

const robotPath = path.join(__dirname, 'robots.txt')
app.use('robots.txt', (req, res) => {
  res.sendFile(robotPath)
})
app.use(boom())

if (DEV) {
  // documentation
  const swaggerUi = require('swagger-ui-express')
  const swaggerDocsV1 = require('./versions/v1/swagger')
  const swaggerRouteV1 = swaggerUi.setup(swaggerDocsV1, {})
  app.use('/v1/documentation', swaggerUi.serve, swaggerRouteV1)
}
app.use(bearerToken({
  headerKey: 'Bearer'
}))
app.use(strategies([
  auth.simpleToken
], {
  boom: true
}))
app.use('/', routers)
app.use(Sentry.Handlers.errorHandler())
app.use((req, res, next) => res.boom.notFound())

function start (port = PORT) {
  return new Promise((resolve, reject) => {
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