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
  positiveNumber
} = require('../versions/schemas')

// start server

const payloadCurrencyRatios = payloadWrap(currencyRatios)
const payloadPositiveNumber = payloadWrap(positiveNumber)

const token = process.env.TOKEN_LIST
const server = supertest.agent(start.server)
const auth = (unauthed) => unauthed.set('Authorization', `Bearer ${token}`)

test('server does not allow access without bearer header', async (t) => {
  t.plan(0)
  await server.get('/v1/').expect(status(401))
})

test('server starts without throwing', async (t) => {
  t.plan(0)
  await auth(server.get('/')).expect(status(404))
})

test('can retrieve all rates', async (t) => {
  t.plan(0)
  const { body } = await auth(server.get('/v1/')).expect(ok)
  validate(body, payloadCurrencyRatios)
})

test('can retrieve rates against a base', async (t) => {
  t.plan(3)
  const { body: usdBody } = await auth(server.get('/v1/fiat/USD')).expect(ok)
  const { body: eurBody } = await auth(server.get('/v1/fiat/EUR')).expect(ok)
  validate(usdBody, payloadCurrencyRatios)
  validate(eurBody, payloadCurrencyRatios)
  t.false(_.isEqual(usdBody.value, eurBody.value))
  t.false(_.isEmpty(usdBody.value))
  t.false(_.isEmpty(eurBody.value))
})

test('can retrieve singular rates', async (t) => {
  t.plan(0)
  const { body } = await auth(server.get('/v1/fiat/EUR/BAT').set('Authorization', `Bearer ${token}`)).expect(ok)
  validate(body, payloadPositiveNumber)
})

test('can refresh rates', async (t) => {
  t.plan(1)
  const { body: pre } = await auth(server.get('/v1/')).expect(ok)
  await timeout(1000 * 10)
  await auth(server.get('/v1/refresh')).expect(ok)
  const { body: post } = await auth(server.get('/v1/')).expect(ok)
  t.false(_.isEqual(pre.value, post.value))
})

test('can check available currencies', async (t) => {
  t.plan(2)
  const { body: { value } } = await auth(server.get('/v1/available/')).expect(ok)
  const { body: { value: alts } } = await auth(server.get('/v1/available/alt')).expect(ok)
  const { body: { value: fiats } } = await auth(server.get('/v1/available/fiat')).expect(ok)
  // because of btc
  t.not(value.length, alts.length + fiats.length)
  t.deepEqual(value.sort(), _.uniq(fiats.concat(alts)).sort())
})
