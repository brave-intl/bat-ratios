const _ = require('lodash')
const querystring = require('querystring')
const currency = require('$/versions/currency')
const Cache = require('$/versions/cache')
const cache = Cache.create(5 * 60, {
  url: process.env.REDIS_URL
})
module.exports = {
  rates,
  passthrough
}

async function rates ({
  a,
  b,
  from,
  until
}) {
  let u = until
  if (!until) {
    u = new Date()
  }
  const f = toSeconds(from)
  u = toSeconds(until)
  const query = querystring.stringify({
    vs_currency: b,
    from: truncate5Min(f),
    to: truncate5Min(u)
  })
  return passthrough({}, {
    path: `/api/v3/coins/${a}/market_chart/range?${query}`
  })
}

// second argument is a parsed query string
function passthrough (notvar, {
  path
}) {
  return cache(path, () => currency.request({
    hostname: 'api.coingecko.com',
    protocol: 'https:',
    path,
    method: 'GET'
  }))
}

function truncate5Min (t) {
  const d = new Date((+t) * 1000)
  const min5 = 1000 * 60 * 5
  return d - (d % min5) / 1000
}

function toSeconds (d) {
  if (!_.isString(d)) {
    return d
  }
  const date = new Date(d)
  if (date.getYear() < 100) { // already in seconds format
    return date.valueOf()
  }
  return parseInt(date.valueOf() / 1000)
}
