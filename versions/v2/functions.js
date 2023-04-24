const _ = require('lodash')
const {
  loggers
} = require('$/debug')
const Sentry = require('$/sentry')
const currency = require('$/versions/currency')
const coingecko = require('$/versions/v2/coingecko')
const etherscan = require('$/versions/v2/etherscan')

const history = {
  coingeckoRates: noWrapHandler({
    run: access(coingecko.rates)
  })
}

const rates = {
  coingeckoSpotPrice: noWrapHandler({
    run: access(coingecko.spotPrice)
  }),
  coingeckoPassthrough: noWrapHandler({
    run: access(coingecko.passthrough)
  }),
  etherscanPassthrough: noWrapEtherscanHandler({
    run: access(etherscan.passthrough)
  })
}

function noWrapHandler (opts) {
  return basicHandler(Object.assign({
    setup: () => {},
    respond: noWrapping
  }, opts))
}

function noWrapEtherscanHandler (opts) {
  return etherscanHandler(Object.assign({
    setup: () => {},
    respond: noWrapping
  }, opts))
}

module.exports = {
  history,
  rates,
  keyed,
  access
}

function access (fn) {
  if (!fn) {
    throw new Error('fn is required')
  }
  return async (req, res, next, setup) => {
    const {
      params,
      query
    } = req
    return fn(params, query, setup)
  }
}

function basicHandler ({
  setup = () => currency.update(),
  run,
  success = (a) => a,
  respond = defaultPayload
}) {
  return async (...args) => {
    const [req, res, next] = args // eslint-disable-line
    try {
      const finishedSetup = await setup(...args)
      const value = await run(...args, finishedSetup)
      const lastUpdate = currency.lastUpdated()
      if (success(value)) {
        const json = respond(lastUpdate, value)
        res.json(json)
      } else {
        res.boom.notFound()
      }
      return
    } catch (ex) {
      Sentry.captureException(ex)
      const info = JSON.stringify(req.info)
      loggers.exception(`failed to complete request: ${info}`, ex)
      next(ex)
    }
  }
}

// etherscanHandler is like basicHandler except it sets a Cache-Control
// header if certain query params are set
//
// E.g. Cache-Control header is set for:
//
// ?module=token&action=tokeninfo&contractaddress=<contractAddress>
//
// but not:
//
// ?module=gastracker&action=gasoracle
function etherscanHandler({
  setup = () => currency.update(),
  run,
  success = (a) => a,
  respond = defaultPayload,
}) {
  return async (...args) => {
    const [req, res, next] = args; // eslint-disable-line
    try {
      const finishedSetup = await setup(...args);
      const value = await run(...args, finishedSetup);
      const lastUpdate = currency.lastUpdated();

      // Check if the specified query params are set
      const { module, action, contractaddress } = req.query;
      const queryParamsPresent =
        module === 'token' &&
        action === 'tokeninfo' &&
        contractaddress !== undefined;

      if (success(value)) {
        const json = respond(lastUpdate, value);

        // Set Cache-Control header if query params are set and the request is successful
        if (queryParamsPresent) {
          res.set('Cache-Control', 'public, max-age=604800'); // Two weeks
        }

        res.json(json);
      } else {
        res.boom.notFound();
      }
      return;
    } catch (ex) {
      Sentry.captureException(ex);
      const info = JSON.stringify(req.info);
      loggers.exception(`failed to complete request: ${info}`, ex);
      next(ex);
    }
  };
}

function noWrapping (lastUpdated, value) {
  return value
}

function defaultPayload (lastUpdated, payload) {
  return {
    lastUpdated,
    payload
  }
}

function keyed (fn) {
  return access((...args) => {
    return _.keys(fn(...args)).sort()
  })
}
