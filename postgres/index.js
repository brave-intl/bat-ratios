const {
  Pool
} = require('pg')
const captureException = require('../capture-exception')
const queries = require('./queries')
const debug = require('../debug')
const {
  DATABASE_URL,
  DEV
} = require('../env')

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: !DEV
})

module.exports = {
  pool,
  query,
  queries: queries(pool),
  connect,
  transaction
}

function failsafe (client, limit = 1) {
  let count = 0
  return failed

  async function failed (err) {
    if (count >= limit) {
      return
    }
    if (err) {
      count += 1
      await client.query('ROLLBACK')
    }
  }
}

async function transaction (transact) {
  const context = this
  const { pool } = context
  const client = await pool.connect()
  const failed = failsafe(client)
  try {
    await client.query('BEGIN')
    await transact(client, failed)
    await client.query('COMMIT')
  } catch (err) {
    failed(err)
    captureException(err)
    throw err
  } finally {
    client.release()
  }
}

async function query (text, replacements = []) {
  const context = this
  const { pool } = context
  const start = Date.now()
  const result = await pool.query(text, replacements)
  const duration = Date.now() - start
  debug('executed query', {
    text,
    duration,
    rows: result.rowCount
  })
  return result
}

function connect () {
  return this.pool.connect()
}
