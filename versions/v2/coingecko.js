const _ = require('lodash')
const querystring = require('querystring')
const currency = require('$/versions/currency')
const Cache = require('$/versions/cache')
const { BigNumber } = require('@brave-intl/currency')
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

  const lowerFrom = from.toLowerCase()
  let f = knownTimeWindows[lowerFrom] ? await knownTimeWindows[lowerFrom]() : from
  let u = until
  if (!until) {
    u = new Date()
  }
  f = toSeconds(f)
  u = toSeconds(u)

  const query = querystring.stringify({
    vs_currency: b1.map(({ symbol: id }) => id).join(','),
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
  b,
  from,
  until
}, {
  refresh
}) {
  let ratesResult = null
  const [a1, b1] = await mapIdentifiers(a, b)

  const a1Id = encodeURIComponent(a1.map(({ id }) => id).join(','))
  const b1Id = encodeURIComponent(b1.map(({ symbol: id }) => id).join(','))
  if (from || until) {
    const lowerFrom = from.toLowerCase()
    const f = knownTimeWindows[lowerFrom] ? await knownTimeWindows[lowerFrom]() : from
    const f_ = truncate5Min(toSeconds(f))
    const u = (+f_ + (60 * 60))
    for (const { original: a } of a1) {
      await Promise.all(b1.map(async (b1) => {
        const arg1 = {
          a,
          b: b1.symbol,
          from: f_ + ''
        }
        if (u) {
          arg1.until = u + ''
        }
        const arg2 = {
          refresh
        }
        const { payload } = await rates(arg1, arg2)
        return [b1.symbol, payload.prices[0]]
      })).then(results => {
        ratesResult = _.transform(results, (memo, [key, value]) => {
          memo[key] = value
        }, ratesResult || {})
      })
    }
  }
  const result = await passthrough({}, {
    refresh,
    path: `/api/v3/simple/price?ids=${a1Id}&vs_currencies=${b1Id}`
  })

  result.payload = _.reduce(result.payload, (memo, value, key) => {
    memo[key] = value // what it is already
    b1.forEach(b1 => {
      if (!ratesResult || !knownTimeWindows[from]) {
        return
      }
      _.forEach(ratesResult, (ratesResult, key) => {
        let k = b1.id
        if (b1.converted.symbolToId) {
          k = b1.symbol
        }
        const current = new BigNumber(value[b1.converted.symbolToId ? b1.symbol : b1.id])
        const previous = new BigNumber(ratesResult[1])
        const deltaKey = `${k}_timeframe_change`
        value[deltaKey] = current.minus(previous).dividedBy(previous).toNumber()
      })
    })
    a1.forEach((a1) => {
      if (a1.symbol !== key && a1.id !== key) {
        return
      }
      if (a1.converted.symbolToId) {
        memo[a1.symbol] = value
        if (a1.id !== a1.symbol) {
          delete memo[a1.id]
        }
      }
    })
    return b1.reduce((memo, b1) => {
      if (a1.symbol !== key && a1.id !== key) {
        return memo
      }
      if (!b1.converted.symbolToId) {
        return memo
      }
      _.forOwn(value, (val, key, hash) => {
        value[b1.symbol] = val
        if (key !== b1.symbol) {
          delete hash[key]
        }
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
    return parseInt(ret)
  }
  const date = new Date(d)
  if (date.getYear() < 100) { // already in seconds format
    return date.valueOf()
  }
  return parseInt(date.valueOf() / 1000)
}
