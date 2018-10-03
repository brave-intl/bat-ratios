
const DEV = process.env.NODE_ENV !== 'production'
const PORT = process.env.PORT || 8000
const _TL = process.env.TOKEN_LIST
const TOKEN_LIST = (_TL ? _TL.split(',') : []).concat(DEV ? 'foobarfoobar' : [])
const HEROKU_SLUG_COMMIT = process.env.HEROKU_SLUG_COMMIT
const COMMIT_SLUG = HEROKU_SLUG_COMMIT || 'test'
const DSN = process.env.SENTRY_DSN || false
const HOST = process.env.HOST || `127.0.0.1:${PORT}`
const LOCAL = !!HEROKU_SLUG_COMMIT

module.exports = {
  DEV,
  PORT,
  TOKEN_LIST,
  COMMIT_SLUG,
  DSN,
  LOCAL,
  HOST
}
