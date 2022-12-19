const _ = require('lodash')
const client = require('prom-client')
const bundle = require('express-prom-bundle')

module.exports = bundle({
  buckets: client.exponentialBuckets(0.002, 2, 14),
  includeMethod: true,
  includePath: true,
  customLabels: {
    group1: '',
    group2: '',
    a: '',
    b: '',
    from: '',
    until: '',
    refresh: '',
    provider: '',
    currency: '',
    action: '',
    contractaddress: '',
    module: '',
    gasprice: ''
  },
  transformLabels: (givenLabels, req, res) => {
    const { params, query } = req
    const labels = Object.assign(givenLabels, isoDate(params), isoDate(query))
    for (const key in labels) {
      if (labels[key] === '') {
        delete labels[key]
      } else {
        let value = labels[key]
        const d = new Date(labels[key])
        if (!_.isNaN(+d)) {
          value = d.toISOString()
        }
        labels[key] = value
      }
    }
  },
  normalizePath,
  promClient: {
    collectDefaultMetrics: {
      timeout: 10000
    }
  },
  autoregister: false // disable /metrics on main app
})

function normalizePath (req) {
  const { route, originalUrl, baseUrl } = req
  if (!route) {
    return originalUrl
  }
  return [baseUrl, route.path].join('')
}

function isoDate (obj) {
  return _.mapValues(obj, (value) => value instanceof Date ? value.toISOString() : value)
}
