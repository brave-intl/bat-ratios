const _ = require('lodash')
const env = require('$/env')
const querystring = require('querystring')
const currency = require('$/versions/currency')
const Cache = require('$/versions/cache')
const { BigNumber } = require('@brave-intl/currency')
const cache = Cache.create(5 * 60, {
  url: env.REDIS_URL
})

const hour1 = 1000 * 60 * 60
const day1 = hour1 * 24
const week1 = day1 * 7
const month1 = day1 * 30
const year1 = day1 * 365

const mappings = generateMappings(fetchCoinsList({}, { platform: true }))

module.exports = {
  rates,
  spotPrice,
  passthrough,
  fetchCoinsList
}

async function generateMappings (coinlist) {
  const { payload } = await coinlist
  // symbols are duplicated in coingecko list, so we will use these particular ones
  const special = {
    // symbol -> winner
    abat: 'aave-bat',
    abusd: 'aave-busd',
    adai: 'aave-dai',
    adx: 'adex',
    aenj: 'aave-enj',
    aknc: 'aave-knc',
    alink: 'aave-link',
    amana: 'aave-mana',
    amkr: 'aave-mkr',
    aren: 'aave-ren',
    art: 'maecenas',
    asnx: 'aave-snx',
    ast: 'airswap',
    asusd: 'aave-susd',
    atusd: 'aave-tusd',
    ausdc: 'aave-usdc',
    ausdt: 'aave-usdt',
    awbtc: 'aave-wbtc',
    ayfi: 'aave-yfi',
    azrx: 'aave-zrx',
    bat: 'basic-attention-token',
    bcp: 'bitcashpay-old',
    bee: 'bee-coin',
    bnb: 'binancecoin',
    boa: 'bosagora',
    bob: 'bobs_repair',
    booty: 'candybooty',
    box: 'box-token',
    btu: 'btu-protocol',
    can: 'canyacoin',
    cat: 'bitclave',
    comp: 'compound-coin',
    cor: 'coreto',
    cvp: 'concentrated-voting-power',
    cwbtc: 'compound-wrapped-btc',
    data: 'streamr',
    dg: 'degate',
    drc: 'dracula-token',
    dream: 'dreamteam',
    drt: 'domraider',
    duck: 'dlp-duck-token',
    edg: 'edgeless',
    ert: 'eristica',
    flx: 'reflexer-ungovernance-token',
    frm: 'ferrum-network',
    ftm: 'fantom',
    game: 'gamecredits',
    gen: 'daostack',
    get: 'get-token',
    gold: 'dragonereum-gold',
    grt: 'the-graph',
    gtc: 'gitcoin',
    hex: 'hex',
    hgt: 'hellogold',
    hot: 'holotoken',
    ieth: 'iethereum',
    imp: 'ether-kingdoms-token',
    inx: 'infinitx',
    iotx: 'iotex',
    isla: 'insula',
    jet: 'jetcoin',
    key: 'selfkey',
    land: 'landshare',
    like: 'likecoin',
    luna: 'wrapped-terra',
    mana: 'decentraland',
    mdx: 'mandala-exchange-token',
    mm: 'million',
    mta: 'meta',
    musd: 'musd',
    muso: 'mirrored-united-states-oil-fund',
    nct: 'polyswarm',
    ndx: 'ndex',
    oil: 'oiler',
    one: 'menlo-one',
    ousd: 'origin-dollar',
    pla: 'playdapp',
    plat: 'dash-platinum',
    play: 'herocoin',
    pmon: 'polychain-monsters',
    poly: 'polymath',
    prt: 'portion',
    rai: 'rai',
    rbc: 'rubic',
    ren: 'republic-protocol',
    rfr: 'refereum',
    sand: 'san-diego-coin',
    sbtc: 'sbtc',
    sdt: 'stabledoc-token',
    seth: 'seth',
    sgtv2: 'sharedstake-governance-token',
    sig: 'signal-token',
    soul: 'cryptosoul',
    space: 'spacelens',
    spn: 'sapien',
    spnd: 'spendcoin',
    star: 'filestar',
    steth: 'staked-ether',
    susd: 'stabilize-usd',
    swt: 'swarm-city',
    tbtc: 'tbtc',
    time: 'chronobank',
    top: 'top-network',
    uni: 'uniswap',
    usdn: 'neutrino',
    usdp: 'paxos-standard',
    usdx: 'usdx',
    ust: 'wrapped-ust',
    val: 'sora-validator-token',
    wings: 'wings',
    xor: 'sora',
    yld: 'yield',
    zap: 'zap'
  }
  return payload.reduce((memo, { id, symbol, platforms }) => {
    if (special[symbol] && id !== special[symbol]) {
      return memo
    }
    memo.symbolToId[symbol] = id
    memo.idToSymbol[id] = symbol
    if (platforms && platforms.ethereum) {
      memo.hashToId[platforms.ethereum.toLowerCase()] = id
    }
    return memo
  }, {
    symbolToId: {},
    idToSymbol: {},
    hashToId: {}
  })
}

async function fetchCoinsList (nil, {
  platform // boolean
}) {
  const result = await passthrough({}, {
    path: '/api/v3/coins/list',
    query: {
      include_platform: platform
    }
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

  const a1Id = a1.map(({ id }) => id).join(',')
  const result = await passthrough({}, {
    refresh,
    path: `/api/v3/coins/${a1Id}/market_chart/range`,
    query: {
      vs_currency: b1.map(({ symbol: id }) => id).join(','),
      from: truncate5Min(f),
      to: truncate5Min(u)
    }
  })
  return result
}

const knownTimeWindows = {
  live: () => (new Date()) - hour1,
  '1h': () => (new Date()) - hour1,
  '1d': () => (new Date()) - day1,
  '1w': () => (new Date()) - week1,
  '1m': () => (new Date()) - month1,
  '3m': () => (new Date()) - (month1 * 3),
  '1y': () => (new Date()) - year1,
  all: () => +(new Date('2014-01-01'))
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

  const a1Id = a1.map(({ id }) => id).join(',')
  const b1Id = b1.map(({ symbol: id }) => id).join(',')
  if (from || until) {
    const lowerFrom = from.toLowerCase()
    const f = knownTimeWindows[lowerFrom] ? await knownTimeWindows[lowerFrom]() : from
    const f_ = truncate5Min(toSeconds(f))
    const u = lowerFrom === 'all' ? null : (+f_ + (60 * 60))
    for (const { original: a } of a1) {
      ratesResult = ratesResult || {}
      const subRate = ratesResult[a] = ratesResult[a] || {}
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
        if (!payload.prices.length) {
          return []
        }
        const index = lowerFrom === 'live' ? payload.prices.length - 1 : 0
        return [b1.symbol, payload.prices[index]]
      })).then(results => {
        _.transform(results, (memo, [key, value]) => {
          if (key) {
            memo[key] = value
          }
        }, subRate)
      })
    }
  }
  const result = await passthrough({}, {
    refresh,
    path: '/api/v3/simple/price',
    query: {
      ids: a1Id,
      vs_currencies: b1Id
    }
  })

  result.payload = _.reduce(result.payload, (memo, value, a) => {
    memo[a] = value // what it is already
    const aTarget = _.find(a1, ({ id, symbol }) => id === a || symbol === a)
    const subTarget = ratesResult && (ratesResult[aTarget.symbol] || ratesResult[aTarget.id])
    const subList = subTarget ? Object.keys(subTarget) : []
    b1.forEach(b1 => {
      if (!ratesResult || !subList.length || !knownTimeWindows[from]) {
        return
      }
      let k = b1.id
      if (b1.converted.symbolToId) {
        k = b1.symbol
      }
      const current = new BigNumber(value[k])
      const subRate = subTarget[k]
      const previous = new BigNumber(subRate[1])
      const deltaKey = `${k}_timeframe_change`
      value[deltaKey] = current.minus(previous).dividedBy(previous).times(100).toNumber()
    })
    a1.forEach((a1) => {
      if (a1.symbol !== a && a1.id !== a) {
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
      if (a1.symbol !== a && a1.id !== a) {
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
    hashToId,
    symbolToId
  } = await mappings
  return currencies.map(original => {
    const o = original.toLowerCase()
    const oList = o.split(',')
    return oList.map(o => {
      const isUsd = o === 'usd'
      const convertedHashToId = hashToId[o] && !isUsd
      const convertedSymbolToId = symbolToId[o] && !isUsd
      const convertedIdToSymbol = idToSymbol[o] && !isUsd
      const id = convertedIdToSymbol ? o : (isUsd ? 'usd' : symbolToId[o])
      const symbol = convertedSymbolToId ? o : (isUsd ? 'usd' : idToSymbol[o])
      return {
        original: o,
        converted: {
          hashToId: !!convertedHashToId,
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
  path: basePath,
  query
}) {
  let qs = ''
  if (query) {
    const base = {}
    if (env.COINGECKO_APIKEY) {
      base.x_cg_pro_api_key = env.COINGECKO_APIKEY
    }
    qs = `?${querystring.stringify(Object.assign(base, query))}`
  }
  const path = `${basePath}${qs}`
  return cache(path, () => currency.request({
    hostname: 'pro-api.coingecko.com',
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
