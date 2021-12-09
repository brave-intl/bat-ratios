const dotenv = require('dotenv')
dotenv.config()

const {
  NODE_ENV = 'production',
  PORT = 8000,
  TOKEN_LIST: _TL,
  HEROKU_SLUG_COMMIT,
  SENTRY_DSN: DSN = false,
  HOST: PASSED_HOST,
  EARLIEST_BACKFILL = '2017-06-01',
  LATEST_BACKFILL,
  COINGECKO_APIKEY = '',
  ETHERSCAN_APIKEY = '',
  REDIS_URL,
  DATABASE_URL
} = process.env

if (process.env.DEBUG) {
  process.env.DEBUG = false
}

const SERVER_MARKER = HEROKU_SLUG_COMMIT
const DEV = NODE_ENV !== 'production'
const COMMIT_SLUG = SERVER_MARKER || 'test'
const LOCAL = !SERVER_MARKER
const TOKEN_LIST = (_TL ? _TL.split(',') : []).concat(LOCAL ? 'foobarfoobar' : [])
const HOST = PASSED_HOST || `127.0.0.1:${PORT}`

module.exports = {
  COINGECKO_APIKEY,
  ETHERSCAN_APIKEY,
  REDIS_URL,
  HEROKU_SLUG_COMMIT,
  SERVER_MARKER,
  NODE_ENV,
  DEV,
  PORT,
  TOKEN_LIST,
  COMMIT_SLUG,
  DSN,
  LOCAL,
  HOST,
  EARLIEST_BACKFILL,
  LATEST_BACKFILL,
  DATABASE_URL
}
