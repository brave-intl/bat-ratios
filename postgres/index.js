const {
  Pool
} = require('pg')
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
  release
}

postgres.queries = queries(postgres)

module.exports = postgres

function release () {
  const end = pool.end()
  loggers.postgres('pool stats', {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount
  })
  return end
}

async function query (text, replacements = [], client = false) {
  const context = this
  const pool = client || context.pool
  const start = Date.now()
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
