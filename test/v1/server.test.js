const supertest = require('supertest')
const {
  server
} = require('../../server')
const {
  status
} = require('../utils.test')
const {
  TOKEN_LIST
} = require('../../env')
const querystring = require('querystring')

const ratiosAgent = supertest.agent(server)

module.exports = {
  get,
  allRates: get('/v1/'),
  isUp: get('/isup'),
  getLegacyRates: get('/v1/rates'),
  metrics: get('/metrics'),
  getRelativeCurrency,
  getRate,
  getAvailableGroup,
  refresh: get('/v1/refresh'),
  getKey,
  getBasedHistory,
  getBasedHistorySingle,
  getRelativeHistory
}

function get (path) {
  return ({
    // inputs ignored
    type,
    inputs = {},
    auth = true,
    headers = {},
    expect = 200
  } = {}) => {
    const qs = querystring.stringify(inputs.filter)
    const p = `${path}${qs ? `?${qs}` : ''}`
    const headrs = Object.assign({}, {
      Authorization: auth ? `Bearer ${auth === true ? TOKEN_LIST[0] : auth}` : '',
      Accept: type ? `text/${type}` : 'application/json'
    }, headers)
    return ratiosAgent
      .get(p)
      .set(headrs)
      .expect(status(expect))
  }
}

function getRelativeCurrency (options = {}) {
  const { inputs } = options
  const { fromGroup, fromCurrency } = inputs
  const path = fromGroup ? `${fromGroup}/${fromCurrency}` : fromCurrency
  return get(`/v1/relative/${path}`)(options)
}

function getRate (options = {}) {
  const { inputs } = options
  const { fromCurrency, toCurrency } = inputs
  return get(`/v1/${fromCurrency}/${toCurrency}`)(options)
}

function getAvailableGroup (options = {}) {
  const { inputs = {} } = options
  const { fromGroup = '' } = inputs
  return get(`/v1/available/${fromGroup}`)(options)
}

function getKey (options = {}) {
  const { inputs } = options
  const { key } = inputs
  return get(`/v1/key/${key}`)(options)
}

function getBasedHistory (options = {}) {
  const { inputs } = options
  const { fromGroup, fromCurrency, start, until } = inputs
  const paths = path([fromGroup, fromCurrency, start, until])
  return get(`/v1/history/${paths}`)(options)
}

function getBasedHistorySingle (options = {}) {
  const { inputs } = options
  const { fromGroup, fromCurrency, start } = inputs
  const paths = path([fromGroup, fromCurrency, start])
  return get(`/v1/history/single/${paths}`)(options)
}

function getRelativeHistory (options = {}) {
  const { inputs } = options
  const {
    fromGroup,
    fromCurrency,
    toGroup,
    toCurrency,
    start,
    until
  } = inputs
  const paths = path([fromGroup, fromCurrency, toGroup, toCurrency, start, until])
  return get(`/v1/relative/history/${paths}`)(options)
}

function path (list) {
  return list.filter((val) => val).join('/')
}
