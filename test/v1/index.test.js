import test from 'ava'
import _ from 'lodash'
import supertest from 'supertest'
import Joi from 'joi'
import path from 'path'
import fs from 'fs'
import {
  server
} from '../../server'
import currency from '../../versions/currency'
import backfill from '../../fetch-and-insert'

import {
  pool
} from '../../postgres'
import {
  timeout,
  status
} from '../utils.test'

import {
  TOKEN_LIST
} from '../../env'

import {
  payloadWrap,
  numberCurrencyRatios,
  numberAsString,
  rates
} from '../../versions/schemas'

const validate = Joi.validate
const ok = status(200)

const payloadCurrencyRatios = payloadWrap(numberCurrencyRatios)
const payloadNumberAsString = payloadWrap(numberAsString)

const authKey = `Bearer ${TOKEN_LIST[0]}`
const auth = (agent) => agent.set('Authorization', authKey)
const ratiosAgent = supertest.agent(server)
const backfilling = backfill()

test('root handler', async (t) => {
  t.plan(0)
  await ratiosAgent
    .get('/')
    .expect(status(204))
})

test('server does not allow access without bearer header', async (t) => {
  t.plan(0)
  await ratiosAgent
    .get('/v1/')
    .expect(status(401))
})

test('server sends back infos for uptime', async (t) => {
  t.plan(1)
  const { body } = await ratiosAgent
    .get('/isup')
    .expect(status(200))
  const expected = {
    alt: true,
    fiat: true
  }
  t.deepEqual(body, expected, 'the fiat and alt values populated')
})

test('server does not allow access with wrong bearer header', async (t) => {
  t.plan(0)
  await ratiosAgent
    .get('/v1/')
    .set('Authorization', 'foo')
    .expect(status(401))
})

test('server starts without throwing', async (t) => {
  t.plan(0)
  await ratiosAgent
    .get('/v1/')
    .use(auth)
    .expect(status(200))
})

test('can retrieve all rates', async (t) => {
  t.plan(0)
  const { body } = await ratiosAgent
    .get('/v1/')
    .use(auth)
    .expect(ok)
  validate(body, payloadCurrencyRatios)
})

test('can retrieve rates against a base', async (t) => {
  t.plan(8)
  const usd = '/v1/relative/fiat/USD'
  const {
    body: usdBody
  } = await ratiosAgent
    .get(usd)
    .use(auth)
    .expect(ok)

  const {
    body: batBody
  } = await ratiosAgent
    .get('/v1/relative/alt/BAT')
    .use(auth)
    .expect(ok)

  validate(usdBody, payloadCurrencyRatios)
  validate(batBody, payloadCurrencyRatios)
  const usdPayload = usdBody.payload
  t.false(_.isEqual(usdPayload, batBody.payload))
  t.false(_.isEmpty(usdPayload))
  t.false(_.isEmpty(batBody.payload))
  t.is(_.keys(batBody.payload).length, _.keys(usdPayload).length)

  const {
    body: usdBodyNoCurr
  } = await ratiosAgent
    .get(`${usd}?currency=`)
    .use(auth)
    .expect(ok)
  t.deepEqual(usdBodyNoCurr, usdBody)

  const {
    body: usdOnlyBtc
  } = await ratiosAgent
    .get(`${usd}?currency=BTC`)
    .use(auth)
    .expect(ok)
  t.deepEqual(usdOnlyBtc, {
    lastUpdated: usdBody.lastUpdated,
    payload: {
      BTC: usdPayload.BTC
    }
  })

  const {
    body: usdOnlyBtcLower
  } = await ratiosAgent
    .get(`${usd}?currency=bTc`)
    .use(auth)
    .expect(ok)
  t.deepEqual(usdOnlyBtcLower, {
    lastUpdated: usdBody.lastUpdated,
    payload: {
      bTc: usdPayload.BTC
    }
  })

  const {
    body: usdSome
  } = await ratiosAgent
    .get(`${usd}?currency=BTC,ETH,BAT,ZAR`)
    .use(auth)
    .expect(ok)
  t.deepEqual(usdSome, {
    lastUpdated: usdBody.lastUpdated,
    payload: {
      BTC: usdPayload.BTC,
      ETH: usdPayload.ETH,
      BAT: usdPayload.BAT,
      ZAR: usdPayload.ZAR
    }
  })

  await ratiosAgent
    .get('/v1/relative/alt/USD')
    .use(auth)
    .expect(status(404))
  await ratiosAgent
    .get('/v1/relative/alt/USD?currency=BTC')
    .use(auth)
    .expect(status(404))
  await ratiosAgent
    .get('/v1/relative/alt/USD?currency=BTC,ETH')
    .use(auth)
    .expect(status(404))
})

test('can retrieve rates against a relative unkown', async t => {
  t.plan(8)
  const usd = '/v1/relative/USD'
  const {
    body: usdBody
  } = await ratiosAgent
    .get(usd)
    .use(auth)
    .expect(ok)
  const {
    body: batBody
  } = await ratiosAgent
    .get('/v1/relative/BAT')
    .use(auth)
    .expect(ok)
  validate(usdBody, payloadCurrencyRatios)
  validate(batBody, payloadCurrencyRatios)
  const usdPayload = usdBody.payload
  t.false(_.isEqual(usdPayload, batBody.payload))
  t.false(_.isEmpty(usdPayload))
  t.false(_.isEmpty(batBody.payload))
  t.is(_.keys(batBody.payload).length, _.keys(usdPayload).length)

  const {
    body: usdBodyNoCurr
  } = await ratiosAgent
    .get(`${usd}?currency=`)
    .use(auth)
    .expect(ok)
  t.deepEqual(usdBodyNoCurr, usdBody)

  const {
    body: usdOnlyBtc
  } = await ratiosAgent
    .get(`${usd}?currency=BTC`)
    .use(auth)
    .expect(ok)
  t.deepEqual(usdOnlyBtc, {
    lastUpdated: usdBody.lastUpdated,
    payload: {
      BTC: usdPayload.BTC
    }
  })

  const {
    body: usdOnlyTc
  } = await ratiosAgent
    .get(`${usd}?currency=bTc`)
    .use(auth)
    .expect(ok)
  t.deepEqual(usdOnlyTc, {
    lastUpdated: usdBody.lastUpdated,
    payload: {
      bTc: usdPayload.BTC
    }
  })

  const {
    body: usdSome
  } = await ratiosAgent
    .get(`${usd}?currency=BTC,ETH,BAT,ZAR`)
    .use(auth)
    .expect(ok)
  t.deepEqual(usdSome, {
    lastUpdated: usdBody.lastUpdated,
    payload: {
      BTC: usdPayload.BTC,
      ETH: usdPayload.ETH,
      BAT: usdPayload.BAT,
      ZAR: usdPayload.ZAR
    }
  })
})

test('can retrieve singular rates', async (t) => {
  t.plan(0)
  let body
  ;({
    body
  } = await ratiosAgent
    .get('/v1/EUR/BAT')
    .use(auth)
    .expect(ok))
  validate(body, payloadNumberAsString)

  ;({
    body
  } = await ratiosAgent
    .get('/v1/USD/XAU')
    .use(auth)
    .expect(ok))
  validate(body, payloadNumberAsString)

  ;({
    body
  } = await ratiosAgent
    .get('/v1/USD/DASH')
    .use(auth)
    .expect(ok))
  validate(body, payloadNumberAsString)
})

test('can check available currencies', async (t) => {
  t.plan(2)
  const {
    body: { payload }
  } = await ratiosAgent
    .get('/v1/available/')
    .use(auth)
    .expect(ok)
  const {
    body: { payload: alts }
  } = await ratiosAgent
    .get('/v1/available/alt')
    .use(auth)
    .expect(ok)
  const {
    body: { payload: fiats }
  } = await ratiosAgent
    .get('/v1/available/fiat')
    .use(auth)
    .expect(ok)
  // because of btc
  t.not(payload.length, alts.length + fiats.length)
  t.deepEqual(payload.sort(), _.uniq(fiats.concat(alts)).sort())
})

test('the former structure for rates is also available', async (t) => {
  t.plan(0)
  const {
    body
  } = await ratiosAgent
    .get('/v1/rates')
    .use(auth)
    .expect(ok)
  validate(body, rates)
})

test('allows you to check if a key exists', async (t) => {
  t.plan(5)
  let body
  ;({
    body
  } = await ratiosAgent
    .get('/v1/key/EUR')
    .use(auth)
    .expect(ok))
  t.is(body.payload, 'EUR')
  ;({
    body
  } = await ratiosAgent
    .get('/v1/key/eur')
    .use(auth)
    .expect(ok))
  t.is(body.payload, 'EUR')
  ;({
    body
  } = await ratiosAgent
    .get('/v1/key/eUr')
    .use(auth)
    .expect(ok))
  t.is(body.payload, 'EUR')
  ;({
    body
  } = await ratiosAgent
    .get('/v1/key/eUr%20')
    .use(auth)
    .expect(ok))
  t.is(body.payload, 'EUR')
  ;({
    body
  } = await ratiosAgent
    .get('/v1/key/erp')
    .use(auth)
    .expect(ok))
  t.is(body.payload, false)
})

test.serial('can refresh rates', async (t) => {
  t.plan(2)
  const {
    body: pre
  } = await ratiosAgent
    .get('/v1/')
    .use(auth)
    .expect(ok)
  await timeout(5000)
  const {
    body: refresh
  } = await ratiosAgent
    .get('/v1/refresh')
    .use(auth)
    .expect(ok)
  t.true(refresh.lastUpdated < refresh.payload)
  const {
    body: post
  } = await ratiosAgent
    .get('/v1/')
    .use(auth)
    .expect(ok)
  t.false(_.isEqual(pre.payload, post.payload))
})

test.serial('caching works correctly', async (t) => {
  t.plan(6)
  let result
  let refreshed
  let cached
  let relativeResult
  let relativeRefreshed
  const oldCacher = currency.cache
  currency.cache = currency.Cache()
  currency.cache.resetDelay = 3000

  // update cache
  ;({
    body: result
  } = await ratiosAgent
    .get('/v1/refresh')
    .use(auth)
    .expect(ok))
  await timeout(1000)
  // update cache
  ;({
    body: refreshed
  } = await ratiosAgent
    .get('/v1/refresh')
    .use(auth)
    .expect(ok))
  t.is(result.lastUpdated, refreshed.payload.previousUpdate)

  ;({
    body: result
  } = await ratiosAgent
    .get('/v1/relative/USD')
    .use(auth)
    .expect(ok))
  await timeout(1000)

  ;({
    body: cached
  } = await ratiosAgent
    .get('/v1/relative/USD')
    .use(auth)
    .expect(ok))
  t.deepEqual(result, cached)

  await timeout(4000)
  // update cache
  ;({
    body: result
  } = await ratiosAgent
    .get('/v1/relative/USD')
    .use(auth)
    .expect(ok))
  t.notDeepEqual(result.lastUpdated, cached.lastUpdated)
  t.notDeepEqual(result.payload, cached.payload)

  // update cache
  ;({
    body: result
  } = await ratiosAgent
    .get('/v1/refresh')
    .use(auth)
    .expect(ok))
  ;({
    body: relativeResult
  } = await ratiosAgent
    .get('/v1/relative/USD')
    .use(auth)
    .expect(ok))
  await timeout(4000)
  // update cache
  ;({
    body: refreshed
  } = await ratiosAgent
    .get('/v1/refresh')
    .use(auth)
    .expect(ok))
  ;({
    body: relativeRefreshed
  } = await ratiosAgent
    .get('/v1/relative/USD')
    .use(auth)
    .expect(ok))
  t.is(result.lastUpdated, refreshed.payload.previousUpdate)
  t.notDeepEqual(relativeResult.payload, relativeRefreshed.payload)

  currency.cache = oldCacher
})

test('can retrieve previous days', async (t) => {
  t.plan(1)
  await backfilling
  const {
    body: newYear
  } = await ratiosAgent
    .get('/v1/history/fiat/USD/2019-01-01/2019-01-03')
    .use(auth)
    .expect(ok)
  const data = await readStaticData(pathJoin('json', 'USD', 'new-year'))
  const updatedNewYear = newYear.map((object, index) => {
    const { lastUpdated } = data[index]
    return Object.assign({}, object, { lastUpdated })
  })
  t.deepEqual(updatedNewYear, data)
})

test('can retrieve a singluar date', async (t) => {
  t.plan(1)
  await backfilling
  const {
    body: newYearsDay
  } = await ratiosAgent
    .get('/v1/history/single/fiat/USD/2019-01-01')
    .use(auth)
    .expect(ok)
  const data = await readStaticData(pathJoin('json', 'USD', 'new-years-day'))
  const subset = {
    lastUpdated: data.lastUpdated
  }
  const updatedNewYearsDay = Object.assign({}, newYearsDay, subset)
  t.deepEqual(updatedNewYearsDay, data)
})

test('can retrieve previous days relative to other currencies', async (t) => {
  t.plan(1)
  await backfilling
  const {
    body: newYear
  } = await ratiosAgent
    .get('/v1/history/fiat/EUR/2019-01-01/2019-01-03')
    .use(auth)
    .expect(ok)
  const data = await readStaticData(pathJoin('json', 'EUR', 'new-year'))
  const updatedNewYear = newYear.map((object, index) => {
    const { lastUpdated } = data[index]
    return Object.assign({}, object, { lastUpdated })
  })
  t.deepEqual(updatedNewYear, data)
})

test('can retrieve a singluar date relative to other currencies', async (t) => {
  t.plan(1)
  await backfilling
  const {
    body: newYearsDay
  } = await ratiosAgent
    .get('/v1/history/single/fiat/EUR/2019-01-01')
    .use(auth)
    .expect(ok)
  const data = await readStaticData(pathJoin('json', 'EUR', 'new-years-day'))
  const subset = {
    lastUpdated: data.lastUpdated
  }
  const updatedNewYearsDay = Object.assign({}, newYearsDay, subset)
  t.deepEqual(updatedNewYearsDay, data)
})

test('sends data in csv format when it is asked to do so for the many prices endpoint', async (t) => {
  t.plan(2)
  await backfilling
  const response = await ratiosAgent
    .get('/v1/history/fiat/USD/2019-01-01/2019-01-01')
    .set('Accept', 'text/csv')
    .use(auth)
    .expect(ok)

  const type = response.get('Content-Type')
  const csvPath = pathJoin('csv', 'USD', 'new-years-day')
  const knownCSV = fs.readFileSync(csvPath).toString()

  t.is(type, 'text/csv; charset=utf-8', 'sends back the type with text/csv')
  t.is(response.text, knownCSV, 'csv is sent back')
})

test('sends data in csv format when it is asked to do so for the single price endpoint', async (t) => {
  t.plan(2)
  await backfilling
  const url = '/v1/relative/history/fiat/USD/alt/BAT/2019-01-01/2019-01-01'
  const responseCSV = await ratiosAgent
    .get(url)
    .set('Accept', 'text/csv')
    .use(auth)
    .expect(ok)

  const responseJSON = await ratiosAgent
    .get(url)
    .use(auth)
    .expect(ok)

  const type = responseCSV.get('Content-Type')
  t.is(type, 'text/csv; charset=utf-8', 'sends back the type with text/csv')
  const responseCSVSplit = responseCSV.text
    .split('\n')
    .map((row) => row.split(',').map((item) => JSON.parse(item)))
  const JSONitem = responseJSON.body[0]
  const responseJSONList = [
    ['price', 'date', 'lastUpdated'],
    [JSONitem.price, JSONitem.date, JSONitem.lastUpdated]
  ]
  t.deepEqual(responseJSONList, responseCSVSplit)
})

test.after('records metric data', async (t) => {
  const url = '/metrics'
  await timeout(11000)
  const { text } = await ratiosAgent
    .get(url)
    .expect(ok)
  try {
    fs.writeFileSync(path.join(__dirname, 'metrics.txt'), text)
  } catch (e) {}
  t.true(text.length > 0)
  pool.end()
})

function pathJoin (type, currency, name) {
  return path.join(__dirname, '..', type, currency, `${name}.${type}`)
}

async function readStaticData (fullFilePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(fullFilePath, (error, binary) => {
      if (error) {
        return reject(error)
      }
      try {
        resolve(JSON.parse(binary.toString()))
      } catch (err) {
        reject(err)
      }
    })
  })
}
