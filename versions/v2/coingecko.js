const _ = require('lodash')
const querystring = require('querystring')
const currency = require('$/versions/currency')
const Cache = require('$/versions/cache')
const cache = Cache.create(5 * 60, {
  url: process.env.REDIS_URL
})

const hour1 = 1000 * 60 * 60
const day1 = hour1 * 24
const week1 = day1 * 7
const month1 = day1 * 30
const year1 = day1 * 365

const mappings = generateMappings(fetchCoinsList({}, { platform: false }))

module.exports = {
  rates,
  spotPrice,
  passthrough,
  fetchCoinsList
}

async function generateMappings (coinlist) {
  const { payload } = await coinlist
  const special = {
    // symbol -> winner
    bat: 'basic-attention-token'
  }
  const symbolToId = payload.reduce((memo, { id, symbol }) => {
    if (special[symbol] && id !== special[symbol]) {
      return memo
    }
    memo[symbol] = id
    return memo
  }, {})
  const idToSymbol = payload.reduce((memo, { id, symbol }) => {
    memo[id] = symbol
    return memo
  }, {})
  return {
    symbolToId,
    idToSymbol
  }
}

async function fetchCoinsList (nil, {
  platform // boolean
}) {
  const result = await passthrough({}, {
    path: `/api/v3/coins/list?include_platform=${platform}`
  })
  return result
}

async function rates ({
  a,
  b,
  from,
  until
}, {
  refresh
}) {
  const [a1, b1] = await mapIdentifiers(a, b)

  let f = knownTimeWindows[from] ? await knownTimeWindows[from]() : from
  let u = until
  if (!until) {
    u = new Date()
  }
  f = toSeconds(f)
  u = toSeconds(u)

  const query = querystring.stringify({
    vs_currency: b1.map(({ id }) => id).join(','),
    from: truncate5Min(f),
    to: truncate5Min(u)
  })
  const a1Id = a1.map(({ id }) => id).join(',')
  const result = await passthrough({}, {
    refresh,
    path: `/api/v3/coins/${a1Id}/market_chart/range?${query}`
  })
  return result
}

const knownTimeWindows = {
  live: () => (new Date()) - hour1,
  '1d': () => (new Date()) - day1,
  '1w': () => (new Date()) - week1,
  '1m': () => (new Date()) - month1,
  '3m': () => (new Date()) - (month1 * 3),
  '1y': () => (new Date()) - year1,
  all: () => new Date('2008-01-01')
}

async function spotPrice ({
  a,
  b
}, {
  refresh
}) {
  const [a1, b1] = await mapIdentifiers(a, b)

  const a1Id = encodeURIComponent(a1.map(({ id }) => id).join(','))
  const b1Id = encodeURIComponent(b1.map(({ symbol: id }) => id).join(','))
  const result = await passthrough({}, {
    refresh,
    path: `/api/v3/simple/price?ids=${a1Id}&vs_currencies=${b1Id}&include_24hr_change=true`
  })

  result.payload = _.reduce(result.payload, (memo, value, key) => {
    memo[key] = value // what it is already
    a1.forEach((a1) => {
      if (a1.converted.symbolToId) {
        memo[a1.symbol] = value
      }
    })
    return b1.reduce((memo, b1) => {
      if (!b1.converted.symbolToId) {
        return memo
      }
      _.forOwn(value, (val, key) => {
        value[b1.symbol] = val
      })
      return memo
    }, memo)
  }, {})
  return result
}

async function mapIdentifiers (...currencies) {
  const {
    idToSymbol,
    symbolToId
  } = await mappings
  return currencies.map(original => {
    const o = original.toLowerCase()
    const oList = o.split(',')
    return oList.map(o => {
      const isUsd = o === 'usd'
      const convertedSymbolToId = symbolToId[o] && !isUsd
      const convertedIdToSymbol = idToSymbol[o] && !isUsd
      const id = convertedIdToSymbol ? o : (isUsd ? 'usd' : symbolToId[o])
      const symbol = convertedSymbolToId ? o : (isUsd ? 'usd' : idToSymbol[o])
      return {
        original: o,
        converted: {
          idToSymbol: !!convertedIdToSymbol,
          symbolToId: !!convertedSymbolToId
        },
        id,
        symbol
      }
    })
  })
}

// second argument is a parsed query string
function passthrough (notvar, {
  refresh,
  path
}) {
  return cache(path, () => currency.request({
    hostname: 'api.coingecko.com',
    protocol: 'https:',
    path,
    method: 'GET'
  }), refresh)
}

function truncate5Min (t) {
  const d = new Date((+t) * 1000)
  const min5 = 1000 * 60 * 5
  return (d - (d % min5)) / 1000
}

function toSeconds (d) {
  if (!_.isString(d) || !_.isNaN(+d)) {
    let ret = +d
    if (ret > ((new Date() / 1000) + 1000)) {
      ret = ret / 1000
    }
    return ret
  }
  const date = new Date(d)
  if (date.getYear() < 100) { // already in seconds format
    return date.valueOf()
  }
  return parseInt(date.valueOf() / 1000)
}
