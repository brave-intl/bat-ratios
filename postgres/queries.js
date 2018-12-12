const FIND_DATES_BETWEEN = `
SELECT truncated_date
FROM pricehistory
WHERE
    truncated_date >= $1
AND truncated_date <= $2
ORDER BY truncated_date ASC;
`
const INSERT_PRICE_HISTORY = `
INSERT INTO pricehistory (id, truncated_date, prices)
VALUES ($1, $2, $3::jsonb);
`
const FIND_DATA_BETWEEN = `
SELECT *
FROM pricehistory
WHERE
    truncated_date >= $1
AND truncated_date <= $2
ORDER BY truncated_date ASC;
`
const uuid = require('uuid')
module.exports = queries

function queries (pool) {
  let client = null
  return {
    findDataBetween: backfillPool(findDataBetween),
    findDatesBetween: backfillPool(findDatesBetween),
    insertPricehistory: backfillPool(insertPricehistory)
  }

  function backfillPool (fn) {
    return async (args, passed) => {
      if (!passed && !client) {
        client = await pool.connect()
      }
      return fn(args, passed || client)
    }
  }
}

function insertPricehistory (args, client) {
  return client.query(INSERT_PRICE_HISTORY, [uuid.v4()].concat(args))
}

function findDataBetween (args, client) {
  return client.query(FIND_DATA_BETWEEN, args)
}

function findDatesBetween (args, client) {
  return client.query(FIND_DATES_BETWEEN, args)
}
