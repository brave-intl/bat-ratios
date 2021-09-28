const env = require('$/env')
const querystring = require('querystring')
const currency = require('$/versions/currency')
const Cache = require('$/versions/cache')
const cache = Cache.create(30, {
  url: env.REDIS_URL
})

module.exports = {
  passthrough
}

// second argument is a parsed query string
function passthrough (notvar, query) {
  let qs = ''
  const base = {
    module: 'gastracker',
    action: 'gasoracle'
  }
  if (env.ETHERSCAN_APIKEY) {
    base.apikey = env.ETHERSCAN_APIKEY
  }

  qs = `?${querystring.stringify(Object.assign(base, query))}`

  let basePath = query.basePath
  if (basePath === undefined) {
    basePath = '/api'
  }
  const path = `${basePath}${qs}`
  return cache(path, () => currency.request({
    hostname: 'api.etherscan.io',
    protocol: 'https:',
    path,
    method: 'GET'
  }), query.refresh)
}
