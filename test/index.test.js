import test from 'ava'
import _ from 'lodash'
import supertest from 'supertest'
import start from '../'

import {
  validate,
  status,
  timeout
} from './utils.test'

const ok = status(200)

const {
  payloadWrap,
  currencyRatios,
  positiveNumber,
  rates
} = require('../versions/schemas')

const payloadCurrencyRatios = payloadWrap(currencyRatios)
const payloadPositiveNumber = payloadWrap(positiveNumber)

const {
  TOKEN_LIST
} = require('../env')

const authKey = `Bearer ${TOKEN_LIST[0]}`
const auth = (agent) => agent.set('Authorization', authKey)
const server = supertest.agent(start.server)

test('server does not allow access without bearer header', async (t) => {
  t.plan(0)
  await server.get('/v1/').expect(status(401))
})

test('server does not allow access with wrong bearer header', async (t) => {
  t.plan(0)
  await server.get('/v1/').set('Authorization', 'foo').expect(status(401))
})

test('server starts without throwing', async (t) => {
  t.plan(0)
  await server.get('/').use(auth).expect(status(404))
})

test('can retrieve all rates', async (t) => {
  t.plan(0)
  const { body } = await server.get('/v1/').use(auth).expect(ok)
  validate(body, payloadCurrencyRatios)
})

test('can retrieve rates against a base', async (t) => {
  t.plan(8)
  const usd = '/v1/relative/fiat/USD'
  const { body: usdBody } = await server.get(usd).use(auth).expect(ok)
  const { body: batBody } = await server.get('/v1/relative/alt/BAT').use(auth).expect(ok)
  validate(usdBody, payloadCurrencyRatios)
  validate(batBody, payloadCurrencyRatios)
  const usdPayload = usdBody.payload
  t.false(_.isEqual(usdPayload, batBody.payload))
  t.false(_.isEmpty(usdPayload))
  t.false(_.isEmpty(batBody.payload))
  t.is(_.keys(batBody.payload).length, _.keys(usdPayload).length)

  const { body: usdBodyNoCurr } = await server.get(`${usd}?currency=`).use(auth).expect(ok)
  t.deepEqual(usdBodyNoCurr, usdBody)

  const { body: usdOnlyBtc } = await server.get(`${usd}?currency=BTC`).use(auth).expect(ok)
  t.deepEqual(usdOnlyBtc, {
    lastUpdated: usdBody.lastUpdated,
    payload: {
      BTC: usdPayload.BTC
    }
  })

  const { body: usdOnlyBtcLower } = await server.get(`${usd}?currency=bTc`).use(auth).expect(ok)
  t.deepEqual(usdOnlyBtcLower, {
    lastUpdated: usdBody.lastUpdated,
    payload: {
      bTc: usdPayload.BTC
    }
  })

  const { body: usdSome } = await server.get(`${usd}?currency=BTC,ETH,BAT,ZAR`).use(auth).expect(ok)
  t.deepEqual(usdSome, {
    lastUpdated: usdBody.lastUpdated,
    payload: {
      BTC: usdPayload.BTC,
      ETH: usdPayload.ETH,
      BAT: usdPayload.BAT,
      ZAR: usdPayload.ZAR
    }
  })

  await server.get('/v1/relative/alt/USD').use(auth).expect(status(404))
  await server.get('/v1/relative/alt/USD?currency=BTC').use(auth).expect(status(404))
  await server.get('/v1/relative/alt/USD?currency=BTC,ETH').use(auth).expect(status(404))
})

test('can retrieve rates against a relative unkown', async t => {
  t.plan(8)
  const usd = '/v1/relative/USD'
  const { body: usdBody } = await server.get(usd).use(auth).expect(ok)
  const { body: batBody } = await server.get('/v1/relative/BAT').use(auth).expect(ok)
  validate(usdBody, payloadCurrencyRatios)
  validate(batBody, payloadCurrencyRatios)
  const usdPayload = usdBody.payload
  t.false(_.isEqual(usdPayload, batBody.payload))
  t.false(_.isEmpty(usdPayload))
  t.false(_.isEmpty(batBody.payload))
  t.is(_.keys(batBody.payload).length, _.keys(usdPayload).length)

  const { body: usdBodyNoCurr } = await server.get(`${usd}?currency=`).use(auth).expect(ok)
  t.deepEqual(usdBodyNoCurr, usdBody)

  const { body: usdOnlyBtc } = await server.get(`${usd}?currency=BTC`).use(auth).expect(ok)
  t.deepEqual(usdOnlyBtc, {
    lastUpdated: usdBody.lastUpdated,
    payload: {
      BTC: usdPayload.BTC
    }
  })

  const { body: usdOnlyTc } = await server.get(`${usd}?currency=bTc`).use(auth).expect(ok)
  t.deepEqual(usdOnlyTc, {
    lastUpdated: usdBody.lastUpdated,
    payload: {
      bTc: usdPayload.BTC
    }
  })

  const { body: usdSome } = await server.get(`${usd}?currency=BTC,ETH,BAT,ZAR`).use(auth).expect(ok)
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
  const { body } = await server.get('/v1/EUR/BAT').use(auth).expect(ok)
  validate(body, payloadPositiveNumber)
})

test('can refresh rates', async (t) => {
  t.plan(2)
  const { body: pre } = await server.get('/v1/').use(auth).expect(ok)
  await timeout(5000)
  const { body: refresh } = await server.get('/v1/refresh').use(auth).expect(ok)
  t.true(refresh.lastUpdated < refresh.payload)
  const { body: post } = await server.get('/v1/').use(auth).expect(ok)
  t.false(_.isEqual(pre.payload, post.payload))
})

test('can check available currencies', async (t) => {
  t.plan(2)
  const { body: { payload } } = await server.get('/v1/available/').use(auth).expect(ok)
  const { body: { payload: alts } } = await server.get('/v1/available/alt').use(auth).expect(ok)
  const { body: { payload: fiats } } = await server.get('/v1/available/fiat').use(auth).expect(ok)
  // because of btc
  t.not(payload.length, alts.length + fiats.length)
  t.deepEqual(payload.sort(), _.uniq(fiats.concat(alts)).sort())
})

test('the former structure for rates is also available', async (t) => {
  t.plan(0)
  const { body } = await server.get('/v1/rates').use(auth).expect(ok)
  validate(body, rates)
})

test('allows you to check if a key exists', async (t) => {
  t.plan(4)
  let body
  ;({ body } = await server.get('/v1/key/EUR').use(auth).expect(ok))
  t.is(body.payload, 'EUR')
  ;({ body } = await server.get('/v1/key/eur').use(auth).expect(ok))
  t.is(body.payload, 'EUR')
  ;({ body } = await server.get('/v1/key/eUr').use(auth).expect(ok))
  t.is(body.payload, 'EUR')
  ;({ body } = await server.get('/v1/key/erp').use(auth).expect(ok))
  t.is(body.payload, false)
})
