const path = require('path')
const grpc = require('grpc')
const _ = require('lodash')
const stored = require('../versions/v1/stored')
const currency = require('../versions/currency')
const workers = require('../versions/v1/workers')
const protoLoader = require('@grpc/proto-loader')
const env = require('../env')
const v1FilePath = path.join(__dirname, '..', 'protos', 'v1.proto')
const options = {
  keepCase: true,
  longs: String,
  enums: Array,
  defaults: true,
  oneofs: true
}
module.exports = start

async function start () {
  if (!env.GRPC_ENABLED) {
    return
  }
  const v1Definition = protoLoader.loadSync(v1FilePath, options)
  const v1Proto = grpc.loadPackageDefinition(v1Definition)
  const server = new grpc.Server()
  server.addService(v1Proto.v1.V1.service, {
    IsUp: urnaryHandler([currencyUpdate, currency.isUp]),
    Refresh: urnaryHandler([currency.refresh, wrapLastUpdated]),
    GetAll: urnaryHandler([currencyUpdate, workers.all, wrapLastUpdated]),
    GetKey: urnaryHandler([currencyUpdate, workers.key, (val) => val || '', wrapLastUpdated]),
    GetRelativeCurrency: urnaryHandler([currencyUpdate, workers.relative, wrapLastUpdated]),
    GetRate: urnaryHandler([currencyUpdate, workers.rate, wrapLastUpdated]),
    GetAvailableGroup: urnaryHandler([currencyUpdate, workers.available, Object.keys, wrapLastUpdated]),
    GetLegacyRates: urnaryHandler([currencyUpdate, workers.rates, backfillEmptyRates]),
    GetBasedHistory: streamHandler([currencyUpdate, stored.between, mapHistory(convertDateToString('prices'))]),
    GetBasedHistorySingle: urnaryHandler([currencyUpdate, stored.singleBetween, convertDateToString('prices')]),
    GetRelativeHistory: streamHandler([currencyUpdate, stored.relativeCurrency, mapHistory(convertDateToString('price'))]),
    GetRelativeHistorySingle: streamHandler([currencyUpdate, stored.singleRelativeCurrency, convertDateToString('price')])
  })
  server.bind('0.0.0.0:50051', grpc.ServerCredentials.createInsecure())
  server.start()
  return server
}

function mapHistory (fn) {
  return async function (target) {
    return target.map(fn)
  }
}

function convertDateToString (key) {
  return (item) => {
    const pass = item[key]
    const { lastUpdated, date } = item
    return {
      lastUpdated: lastUpdated.toISOString(),
      date: date.toISOString(),
      [key]: pass
    }
  }
}

function backfillEmptyRates ({
  fxrates,
  altrates,
  rates
}) {
  return {
    fxrates,
    altrates: backfill1(altrates),
    rates: backfill1(rates)
  }
}

function backfill1 (rates) {
  return _.mapValues(rates, (hash, base) => _.mapValues(hash, (value, key) => key === base ? '1' : value))
}

function streamHandler (fns) {
  return async function (stream) {
    try {
      const result = await runList(stream.request, fns)
      result.forEach((item) => stream.write(item))
    } catch (err) {
      stream.emit('error', {
        code: err.code || 500,
        message: err.message,
        status: err.status || grpc.status.UNKNOWN
      })
    }
    stream.end()
  }
}

async function currencyUpdate (result) {
  await currency.update()
  return result
}

async function runList (memo, fns) {
  let result = memo
  for (let i = 0; i < fns.length; i++) {
    result = await fns[i](result, result.filter || {})
    if (!result && !_.isString(result)) {
      throw Object.assign(new Error('not found'), {
        code: 404,
        status: grpc.status.NOT_FOUND
      })
    }
  }
  return result
}

function urnaryHandler (fns) {
  return async function (call, callback) {
    try {
      callback(null, await runList(call.request, fns))
    } catch (e) {
      callback(e, null)
    }
  }
}

function wrapLastUpdated (payload) {
  return {
    lastUpdated: currency.lastUpdated(),
    payload
  }
}
