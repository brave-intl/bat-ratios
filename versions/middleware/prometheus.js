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
    currency: ''
  },
  transformLabels: (labels, req, res) => {
    const { route, params, query } = req
    if (!route) {
      return labels
    }
    return Object.assign(labels, isoDate(params), isoDate(query))
  },
  normalizePath,
  promClient: {
    collectDefaultMetrics: {
      timeout: 10000
    }
  }
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
