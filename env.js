const dotenv = require('dotenv')
dotenv.config()

const {
  NODE_ENV = 'production',
  PORT = 8000,
  TOKEN_LIST: _TL,
  HEROKU_SLUG_COMMIT,
  SENTRY_DSN: DSN = false,
  HOST: PASSED_HOST
} = process.env

const DEV = NODE_ENV !== 'production'
const TOKEN_LIST = (_TL ? _TL.split(',') : []).concat(DEV ? 'foobarfoobar' : [])
const COMMIT_SLUG = HEROKU_SLUG_COMMIT || 'test'
const HOST = PASSED_HOST || `127.0.0.1:${PORT}`
const LOCAL = !HEROKU_SLUG_COMMIT

module.exports = {
  NODE_ENV,
  DEV,
  PORT,
  TOKEN_LIST,
  COMMIT_SLUG,
  DSN,
  LOCAL,
  HOST
}
