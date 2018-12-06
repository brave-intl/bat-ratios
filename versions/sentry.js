const Sentry = require('@sentry/node')
const {
  DSN,
  COMMIT_SLUG
} = require('../env')

Sentry.init({
  dsn: DSN,
  enabled: !!DSN,
  release: COMMIT_SLUG,
  captureUnhandledRejections: true
})

module.exports = Sentry
