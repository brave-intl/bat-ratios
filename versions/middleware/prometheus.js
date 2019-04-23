
const client = require('prom-client')
const bundle = require('express-prom-bundle')

module.exports = bundle({
  buckets: client.exponentialBuckets(2, 2, 14),
  includeMethod: true,
  includePath: true,
  customLabels: {
    group1: '',
    group2: '',
    a: '',
    b: '',
    from: '',
    until: ''
  },
  transformLabels: (labels, req) => labels.path.split('/').reduce((memo, part, index) => {
    if (part[0] === '{' && part[part.length - 1] === '}') {
      // it is a piece
      const { url } = req
      const urlSplit = url.split('/')
      labels[part.slice(1, part.length - 1)] = urlSplit[index]
    }
    return memo
  }, labels),
  normalizePath: [
    ['^/v1/relative/history/single/.*/.*/.*/.*/.*', '/v1/relative/history/single/{group1}/{a}/{group2}/{b}/{from}'],
    ['^/v1/relative/history/.*/.*/.*/.*/.*/.*', '/v1/relative/history/{group1}/{a}/{group2}/{b}/{from}/{until}'],
    ['^/v1/history/single/.*/.*/.*', '/v1/history/single/{group1}/{a}/{from}'],
    ['^/v1/history/.*/.*/.*/.*', '/v1/history/{group1}/{a}/{from}/{until}'],
    ['^/v1/.*/.*/.*/.*', '/v1/{group1}/{a}/{group2}/{b}'],
    ['^/v1/relative/.*/.*', '/v1/relative/{group1}/{a}'],
    ['^/v1/relative/.*', '/v1/relative/{a}'],
    ['^/v1/key/.*', '/v1/key/{a}']
  ],
  promClient: {
    collectDefaultMetrics: {
      timeout: 10000
    }
  }
})
