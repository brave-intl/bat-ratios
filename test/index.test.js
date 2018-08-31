import test from 'ava'
import _ from 'lodash'
import supertest from 'supertest'
import start from '../'
import Joi from 'joi'

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

// start server

const payloadCurrencyRatios = payloadWrap(currencyRatios)
const payloadPositiveNumber = payloadWrap(positiveNumber)

const {
  TOKEN_LIST
} = require('../env')

const server = supertest.agent(start.server)
const authKey = `Bearer ${TOKEN_LIST[0]}`
const setup = (unauthed) => unauthed.set('Authorization', authKey)

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
  await setup(server.get('/')).expect(status(404))
})

test('can retrieve all rates', async (t) => {
  t.plan(0)
  const { body } = await setup(server.get('/v1/')).expect(ok)
  validate(body, payloadCurrencyRatios)
})

test('can retrieve rates against a base', async (t) => {
  t.plan(3)
  const { body: usdBody } = await setup(server.get('/v1/fiat/USD')).expect(ok)
  const { body: eurBody } = await setup(server.get('/v1/fiat/EUR')).expect(ok)
  validate(usdBody, payloadCurrencyRatios)
  validate(eurBody, payloadCurrencyRatios)
  t.false(_.isEqual(usdBody.value, eurBody.value))
  t.false(_.isEmpty(usdBody.value))
  t.false(_.isEmpty(eurBody.value))
})

test('can retrieve singular rates', async (t) => {
  t.plan(0)
  const { body } = await setup(server.get('/v1/fiat/EUR/BAT')).expect(ok)
  validate(body, payloadPositiveNumber)
})

test('can refresh rates', async (t) => {
  t.plan(1)
  const { body: pre } = await setup(server.get('/v1/')).expect(ok)
  await timeout(1e5)
  await setup(server.get('/v1/refresh')).expect(ok)
  const { body: post } = await setup(server.get('/v1/')).expect(ok)
  t.false(_.isEqual(pre.value, post.value))
})

test('can check available currencies', async (t) => {
  t.plan(2)
  const { body: { value } } = await setup(server.get('/v1/available/')).expect(ok)
  const { body: { value: alts } } = await setup(server.get('/v1/available/alt')).expect(ok)
  const { body: { value: fiats } } = await setup(server.get('/v1/available/fiat')).expect(ok)
  // because of btc
  t.not(value.length, alts.length + fiats.length)
  t.deepEqual(value.sort(), _.uniq(fiats.concat(alts)).sort())
})

test('the former structure for rates is also available', async (t) => {
  t.plan(0)
  const { body } = await setup(server.get('/v1/rates')).expect(ok)
  validate(body, rates)
})
