const test = require('ava')
const path = require('path')
const _ = require('lodash')
const Joi = require('joi')
const fs = require('fs')
const {
  payloadWrap,
  numberCurrencyRatios,
  numberAsString,
  rates
} = require('../../versions/schemas')
const {
  timeout
} = require('../utils.test')
const backfill = require('../../fetch-and-insert')
const currency = require('../../versions/currency')

const backfilling = backfill()
const payloadCurrencyRatios = payloadWrap(numberCurrencyRatios)
const payloadNumberAsString = payloadWrap(numberAsString)

module.exports = generate

function generate (key, io) {
  return {
    allRates,
    allRatesFilters,
    allRatesFiltersUnknown,
    bearerHeader,
    bearerHeaderError,
    cachesCorrectly,
    canRefresh,
    checkAvailableCurrencies,
    isUp,
    getKey,
    legacyRates,
    metrics,
    relativeHistory,
    retrievePreviousDays,
    retrievePreviousDaysSingle,
    retrievesCSV,
    retrievesCSVRelative,
    singularRates
  }

  function allRates () {
    test(`${key}: can retrieve all rates`, async (t) => {
      t.plan(0)
      const { body } = await io.allRates()
      validate(body, payloadCurrencyRatios)
    })
  }

  function allRatesFilters () {
    test(`${key}: can retrieve rates against a base`, async (t) => {
      const {
        body: usdBody
      } = await io.getRelativeCurrency({
        inputs: {
          fromGroup: 'fiat',
          fromCurrency: 'USD'
        }
      })

      const {
        body: batBody
      } = await io.getRelativeCurrency({
        inputs: {
          fromGroup: 'alt',
          fromCurrency: 'BAT'
        }
      })

      validate(usdBody, payloadCurrencyRatios)
      validate(batBody, payloadCurrencyRatios)
      const usdPayload = usdBody.payload
      t.false(_.isEqual(usdPayload, batBody.payload))
      t.false(_.isEmpty(usdPayload))
      t.false(_.isEmpty(batBody.payload))
      t.is(_.keys(batBody.payload).length, _.keys(usdPayload).length)

      const {
        body: usdBodyNoCurr
      } = await io.getRelativeCurrency({
        inputs: {
          fromGroup: 'fiat',
          fromCurrency: 'USD',
          filter: {
            currency: []
          }
        }
      })
      t.deepEqual(usdBodyNoCurr, usdBody)

      const {
        body: usdOnlyBtc
      } = await io.getRelativeCurrency({
        inputs: {
          filter: { currency: 'BTC' },
          fromGroup: 'fiat',
          fromCurrency: 'USD'
        }
      })
      t.deepEqual(usdOnlyBtc, {
        lastUpdated: usdBody.lastUpdated,
        payload: {
          BTC: usdPayload.BTC
        }
      })

      const {
        body: usdOnlyBtcLower
      } = await io.getRelativeCurrency({
        inputs: {
          filter: { currency: 'bTc' },
          fromGroup: 'fiat',
          fromCurrency: 'USD'
        }
      })
      t.deepEqual(usdOnlyBtcLower, {
        lastUpdated: usdBody.lastUpdated,
        payload: {
          bTc: usdPayload.BTC
        }
      })

      const {
        body: usdSome
      } = await io.getRelativeCurrency({
        inputs: {
          filter: { currency: ['BTC', 'ETH', 'BAT', 'ZAR'] },
          fromGroup: 'fiat',
          fromCurrency: 'USD'
        }
      })
      t.deepEqual(usdSome, {
        lastUpdated: usdBody.lastUpdated,
        payload: {
          BTC: usdPayload.BTC,
          ETH: usdPayload.ETH,
          BAT: usdPayload.BAT,
          ZAR: usdPayload.ZAR
        }
      })

      await io.getRelativeCurrency({
        inputs: {
          fromGroup: 'alt',
          fromCurrency: 'USD'
        },
        expect: 404
      })
      await io.getRelativeCurrency({
        inputs: {
          filter: { currency: ['BTC'] },
          fromGroup: 'alt',
          fromCurrency: 'USD'
        },
        expect: 404
      })
      await io.getRelativeCurrency({
        inputs: {
          filter: { currency: ['BTC', 'ETH'] },
          fromGroup: 'alt',
          fromCurrency: 'USD'
        },
        expect: 404
      })
    })
  }

  function allRatesFiltersUnknown () {
    test(`${key}: can retrieve rates against a relative unkown`, async t => {
      const {
        body: usdBody
      } = await io.getRelativeCurrency({
        inputs: { fromCurrency: 'USD' }
      })
      const {
        body: batBody
      } = await io.getRelativeCurrency({
        inputs: { fromCurrency: 'BAT' }
      })
      validate(usdBody, payloadCurrencyRatios)
      validate(batBody, payloadCurrencyRatios)
      const usdPayload = usdBody.payload
      t.false(_.isEqual(usdPayload, batBody.payload))
      t.false(_.isEmpty(usdPayload))
      t.false(_.isEmpty(batBody.payload))
      t.is(_.keys(batBody.payload).length, _.keys(usdPayload).length)

      const {
        body: usdBodyNoCurr
      } = await io.getRelativeCurrency({
        inputs: {
          filter: { currency: '' },
          fromCurrency: 'USD'
        }
      })
      t.deepEqual(usdBodyNoCurr, usdBody)

      const {
        body: usdOnlyBtc
      } = await io.getRelativeCurrency({
        inputs: {
          filter: { currency: 'BTC' },
          fromCurrency: 'USD'
        }
      })
      t.deepEqual(usdOnlyBtc, {
        lastUpdated: usdBody.lastUpdated,
        payload: {
          BTC: usdPayload.BTC
        }
      })

      const {
        body: usdOnlyTc
      } = await io.getRelativeCurrency({
        inputs: {
          filter: { currency: 'bTc' },
          fromCurrency: 'USD'
        }
      })
      t.deepEqual(usdOnlyTc, {
        lastUpdated: usdBody.lastUpdated,
        payload: {
          bTc: usdPayload.BTC
        }
      })

      const {
        body: usdSome
      } = await io.getRelativeCurrency({
        inputs: {
          filter: { currency: ['BTC', 'ETH', 'BAT', 'ZAR'] },
          fromCurrency: 'USD'
        }
      })
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
  }

  function bearerHeader () {
    test(`${key}: server does not allow access without bearer header`, async (t) => {
      t.plan(0)
      await io.allRates({
        auth: false,
        expect: 401
      })
    })
  }

  function bearerHeaderError () {
    test(`${key}: server does not allow access with wrong bearer header`, async (t) => {
      t.plan(0)
      await io.allRates({
        auth: 'foo',
        expect: 401
      })
    })
  }

  function cachesCorrectly () {
    test.serial(`${key}: caching works correctly`, async (t) => {
      let result
      let refreshed
      const oldCacher = currency.cache
      currency.cache = currency.Cache()
      currency.cache.resetDelay = 3000

      // update cache
      ;({ body: result } = await io.refresh())
      await timeout(1000)
      // update cache
      ;({ body: refreshed } = await io.refresh())
      t.is(result.lastUpdated, refreshed.payload.previousUpdate)

      ;({ body: result } = await io.getRelativeCurrency({
        inputs: { fromCurrency: 'USD' }
      }))
      await timeout(1000)

      const { body: cached } = await io.getRelativeCurrency({
        inputs: { fromCurrency: 'USD' }
      })
      t.deepEqual(result, cached)

      await timeout(4000)
      // update cache

      ;({ body: result } = await io.getRelativeCurrency({
        inputs: { fromCurrency: 'USD' }
      }))
      t.notDeepEqual(result.lastUpdated, cached.lastUpdated)
      t.notDeepEqual(result.payload, cached.payload)

      // update cache
      ;({ body: result } = await io.refresh())
      const { body: relativeResult } = await io.getRelativeCurrency({
        inputs: { fromCurrency: 'USD' }
      })
      await timeout(4000)
      // update cache
      ;({ body: refreshed } = await io.refresh())
      const { body: relativeRefreshed } = await io.getRelativeCurrency({
        inputs: { fromCurrency: 'USD' }
      })
      t.is(result.lastUpdated, refreshed.payload.previousUpdate)
      t.notDeepEqual(relativeResult.payload, relativeRefreshed.payload)

      currency.cache = oldCacher
    })
  }

  function canRefresh () {
    test.serial(`${key}: can refresh rates`, async (t) => {
      const { body: pre } = await io.allRates()
      await timeout(5000)
      const { body: refresh } = await io.refresh()
      t.true(refresh.lastUpdated < refresh.payload)
      const { body: post } = await io.allRates()
      t.false(_.isEqual(pre.payload, post.payload))
    })
  }

  function checkAvailableCurrencies () {
    test(`${key}: can check available currencies`, async (t) => {
      const {
        body: { payload }
      } = await io.getAvailableGroup()
      const {
        body: { payload: alts }
      } = await io.getAvailableGroup({
        inputs: { fromGroup: 'alt' }
      })
      const {
        body: { payload: fiats }
      } = await io.getAvailableGroup({
        inputs: { fromGroup: 'fiat' }
      })
      // because of btc
      t.not(payload.length, alts.length + fiats.length)
      t.deepEqual(payload.sort(), _.uniq(fiats.concat(alts)).sort())
    })
  }

  function isUp () {
    test(`${key}: server sends back infos for uptime`, async (t) => {
      const { body } = await io.isUp({
        auth: false,
        expect: 200
      })
      const expected = {
        alt: true,
        fiat: true
      }
      t.deepEqual(expected, body, 'the fiat and alt values populated')
    })
  }

  function getKey () {
    test(`${key}: allows you to check if a key exists`, async (t) => {
      let body
      ;({ body } = await io.getKey({ inputs: { key: 'EUR' } }))
      t.is(body.payload, 'EUR')
      ;({ body } = await io.getKey({ inputs: { key: 'eur' } }))
      t.is(body.payload, 'EUR')
      ;({ body } = await io.getKey({ inputs: { key: 'eUr' } }))
      t.is(body.payload, 'EUR')
      ;({ body } = await io.getKey({ inputs: { key: 'eUr%20' } }))
      t.is(body.payload, key === 'http' ? 'EUR' : '', 'paths are automatically decodes for http://')
      ;({ body } = await io.getKey({ inputs: { key: 'erp' } }))
      t.is(body.payload, '')
    })
  }

  function legacyRates () {
    test(`${key}: the former structure for rates is also available`, async (t) => {
      t.plan(0)
      const { body } = await io.getLegacyRates()
      validate(body, rates)
    })
  }

  function metrics () {
    test.after('records metric data', async (t) => {
      await timeout(11000)
      const { text } = await io.metrics()
      try {
        fs.writeFileSync(path.join(__dirname, 'metrics.txt'), text)
      } catch (e) {}
      t.true(text.length > 0)
    })
  }

  function retrievePreviousDays () {
    test.serial(`${key}: can retrieve previous days`, async (t) => {
      await backfilling

      const {
        body: newYearUSD
      } = await io.getBasedHistory({
        inputs: {
          fromGroup: 'fiat',
          fromCurrency: 'USD',
          start: '2019-01-01',
          until: '2019-01-03'
        }
      })
      const dataUSD = await readStaticData(pathJoin('json', 'USD', 'new-year'))
      const updatedNewYearUSD = newYearUSD.map((object, index) => {
        const { lastUpdated } = dataUSD[index]
        return Object.assign({}, object, { lastUpdated })
      })
      t.deepEqual(dataUSD, updatedNewYearUSD)

      const {
        body: newYearEUR
      } = await io.getBasedHistory({
        inputs: {
          fromGroup: 'fiat',
          fromCurrency: 'EUR',
          start: '2019-01-01',
          until: '2019-01-03'
        }
      })
      const dataEUR = await readStaticData(pathJoin('json', 'EUR', 'new-year'))
      const updatedNewYearEUR = newYearEUR.map((object, index) => {
        const { lastUpdated } = dataEUR[index]
        return Object.assign({}, object, { lastUpdated })
      })
      t.deepEqual(updatedNewYearEUR, dataEUR)
    })
  }

  function retrievePreviousDaysSingle () {
    test.serial(`${key}: can retrieve a singluar date`, async (t) => {
      await backfilling

      const {
        body: newYearsDayUSD
      } = await io.getBasedHistorySingle({
        inputs: {
          fromGroup: 'fiat',
          fromCurrency: 'USD',
          start: '2019-01-01'
        }
      })
      const dataUSD = await readStaticData(pathJoin('json', 'USD', 'new-years-day'))
      const subsetUSD = {
        lastUpdated: dataUSD.lastUpdated
      }
      const updatedNewYearsDayUSD = Object.assign({}, newYearsDayUSD, subsetUSD)
      t.deepEqual(updatedNewYearsDayUSD, dataUSD)

      const {
        body: newYearsDayEUR
      } = await io.getBasedHistorySingle({
        inputs: {
          fromGroup: 'fiat',
          fromCurrency: 'EUR',
          start: '2019-01-01'
        }
      })
      const dataEUR = await readStaticData(pathJoin('json', 'EUR', 'new-years-day'))
      const subsetEUR = {
        lastUpdated: dataEUR.lastUpdated
      }
      const updatedNewYearsDayEUR = Object.assign({}, newYearsDayEUR, subsetEUR)
      t.deepEqual(updatedNewYearsDayEUR, dataEUR)
    })
  }

  function retrievesCSV () {
    test(`${key}: sends data in csv format when it is asked to do so for the many prices endpoint`, async (t) => {
      await backfilling
      const response = await io.getBasedHistory({
        type: 'csv',
        inputs: {
          fromGroup: 'fiat',
          fromCurrency: 'USD',
          start: '2019-01-01',
          until: '2019-01-01'
        }
      })
      const type = response.get('Content-Type')
      const csvPath = pathJoin('csv', 'USD', 'new-years-day')
      const knownCSV = fs.readFileSync(csvPath).toString()

      t.is(type, 'text/csv; charset=utf-8', 'sends back the type with text/csv')
      t.is(response.text, knownCSV, 'csv is sent back')
    })
  }

  function relativeHistory () {
    test(`${key}: sends data for a single currency`, async (t) => {
      await backfilling
      const response = await io.getRelativeHistory({
        inputs: {
          fromCurrency: 'USD',
          toCurrency: 'BAT',
          start: '2019-01-01',
          until: '2019-01-04'
        }
      })
      const dataBAT = await readStaticData(pathJoin('json', 'BAT', 'based-history'))
      t.deepEqual(fixedData(dataBAT), fixedData(response.body), 'a structure is sent back')

      function fixedData (list) {
        return list.map(({
          date,
          price
        }) => ({
          date,
          price
        }))
      }
    })
  }

  function retrievesCSVRelative () {
    test(`${key}: sends data in csv format when it is asked to do so for the single currency endpoint`, async (t) => {
      await backfilling
      const inputs = {
        fromCurrency: 'USD',
        toCurrency: 'BAT',
        start: '2019-01-01',
        until: '2019-01-01'
      }

      const responseCSV = await io.getRelativeHistory({
        type: 'csv',
        inputs
      })
      const responseJSON = await io.getRelativeHistory({
        inputs
      })

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
  }

  function singularRates () {
    test(`${key}: can retrieve singular rates`, async (t) => {
      t.plan(0)
      let body
      ;({ body } = await io.getRate({
        inputs: {
          fromCurrency: 'EUR',
          toCurrency: 'BAT'
        }
      }))
      validate(body, payloadNumberAsString)

      ;({ body } = await io.getRate({
        inputs: {
          fromCurrency: 'USD',
          toCurrency: 'XAU'
        }
      }))
      validate(body, payloadNumberAsString)

      ;({ body } = await io.getRate({
        inputs: {
          fromCurrency: 'USD',
          toCurrency: 'DASH'
        }
      }))
      validate(body, payloadNumberAsString)
    })
  }
}

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

function validate (target, schema) {
  const { error } = Joi.validate(target, schema)
  if (error) {
    throw error
  }
}
