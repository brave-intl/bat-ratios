import test from 'ava'
import _ from 'lodash'
import supertest from 'supertest'
import Joi from 'joi'
import {
  server
} from '../'
import currency from '../versions/currency'

import {
  timeout,
  status
} from './utils.test'

const validate = Joi.validate
const ok = status(200)

const {
  payloadWrap,
  currencyRatios,
  numberAsString,
  rates
} = require('../versions/schemas')

const payloadCurrencyRatios = payloadWrap(currencyRatios)
const payloadNumberAsString = payloadWrap(numberAsString)

const {
  TOKEN_LIST
} = require('../env')

const authKey = `Bearer ${TOKEN_LIST[0]}`
const auth = (agent) => agent.set('Authorization', authKey)
const ratiosAgent = supertest.agent(server)

test('server does not allow access without bearer header', async (t) => {
  t.plan(0)
  await ratiosAgent
    .get('/v1/')
    .expect(status(401))
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
    .get('/')
    .use(auth)
    .expect(status(404))
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
  const {
    body
  } = await ratiosAgent
    .get('/v1/EUR/BAT')
    .use(auth)
    .expect(ok)
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
