const {
  Pool
} = require('pg')
const captureException = require('../capture-exception')
const queries = require('./queries')
const {
  loggers
} = require('../debug')
const {
  DATABASE_URL,
  DEV
} = require('../env')

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: !DEV
})

const postgres = {
  pool,
  query,
  queries,
  connect,
  transaction
}

postgres.queries = queries(postgres)

module.exports = postgres

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

async function query (text, replacements = [], client) {
  const context = this
  const pool = client || context.pool
  const start = Date.now()
  await context.connect()
  const result = await pool.query(text, replacements)
  const duration = Date.now() - start
  loggers.postgres('executed query', {
    text,
    duration,
    rows: result.rowCount
  })
  return result
}

function connect () {
  return (this.connected = this.connected || this.pool.connect())
}
