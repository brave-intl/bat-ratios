const FIND_DATES_BETWEEN = `
SELECT
  truncated_date as date
FROM pricehistory
WHERE
    truncated_date >= $1
AND truncated_date <= $2
ORDER BY date ASC;
`
const INSERT_PRICE_HISTORY = `
INSERT INTO pricehistory (id, truncated_date, prices)
VALUES ($1, $2, $3::jsonb);
`
const FIND_DATA_BETWEEN = `
SELECT
  updated_at,
  truncated_date as date,
  prices
FROM pricehistory
WHERE
    truncated_date >= $1
AND truncated_date <= $2
ORDER BY truncated_date ASC;
`
const FIND_ONE_BETWEEN = `
SELECT
  updated_at,
  truncated_date as date,
  (CAST(prices -> $3::text ->> $4::text as DOUBLE PRECISION)
    / CAST(prices -> $1::text ->> $2::text as DOUBLE PRECISION))::TEXT as price
FROM pricehistory
WHERE truncated_date >= $5
  AND truncated_date <= $6
ORDER BY truncated_date ASC;
`
const uuid = require('uuid')
module.exports = queries

function queries (postgres) {
  let client = null
  return {
    insertPricehistory: backfillPool(insertPricehistory),
    findDataBetween: backfillPool(regularQuery(FIND_DATA_BETWEEN)),
    findDatesBetween: backfillPool(regularQuery(FIND_DATES_BETWEEN)),
    findOneBetween: backfillPool(regularQuery(FIND_ONE_BETWEEN))
  }

  function backfillPool (fn) {
    return async (args, passed) => {
      if (!passed && !client) {
        client = await postgres.pool.connect()
      }
      return fn(args, passed || client)
    }
  }

  function insertPricehistory (args, client) {
    return postgres.query(INSERT_PRICE_HISTORY, [uuid.v4()].concat(args), client)
  }

  function regularQuery (QUERY) {
    return function regular (args, client) {
      return postgres.query(QUERY, args, client)
    }
  }
}
