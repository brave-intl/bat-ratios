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
const server = supertest.agent(start.server)

const auth = (agent) => agent.set('Authorization', authKey)

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
  t.plan(3)
  const { body: usdBody } = await server.get('/v1/relative/fiat/USD').use(auth).expect(ok)
  const { body: eurBody } = await server.get('/v1/relative/fiat/EUR').use(auth).expect(ok)
  validate(usdBody, payloadCurrencyRatios)
  validate(eurBody, payloadCurrencyRatios)
  t.false(_.isEqual(usdBody.payload, eurBody.payload))
  t.false(_.isEmpty(usdBody.payload))
  t.false(_.isEmpty(eurBody.payload))
})

test('can retrieve singular rates', async (t) => {
  t.plan(0)
  const { body } = await server.get('/v1/EUR/BAT').use(auth).expect(ok)
  validate(body, payloadPositiveNumber)
})

test('can refresh rates', async (t) => {
  t.plan(1)
  const { body: pre } = await server.get('/v1/').use(auth).expect(ok)
  await timeout(5000)
  await server.get('/v1/refresh').use(auth).expect(ok)
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
