const _ = require('lodash')
const querystring = require('querystring')
const currency = require('$/versions/currency')
module.exports = {
  rates
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
    from: f,
    to: u
  })
  return currency.request({
    hostname: 'api.coingecko.com',
    protocol: 'https:',
    path: `/api/v3/coins/${a}/market_chart/range?${query}`,
    method: 'GET'
  })
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
