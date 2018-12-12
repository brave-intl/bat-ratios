const Sentry = require('@sentry/node')
const {
  DSN,
  NODE_ENV,
  COMMIT_SLUG
} = require('./env')

Sentry.init({
  dsn: DSN,
  enabled: !!DSN,
  environment: NODE_ENV,
  release: COMMIT_SLUG,
  captureUnhandledRejections: true
})

module.exports = Sentry
