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
const quory = require('./quory')

const poolConfig = {
  connectionString: DATABASE_URL,
  ssl: DEV ? false : { rejectUnauthorized: false },
  connectionTimeoutMillis: 5000
}
const quoryInstance = quory({
  queries: queries.text
})
const pool = new Pool(poolConfig)
pool.on('error', loggers.exception)
pool.on('acquire', () => loggers.postgres('client aquired'))
pool.on('remove', () => loggers.postgres('client removed'))
pool.on('connect', () => loggers.postgres('client connect'))

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
  loggers.postgres('releasing pool')
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
  const result = await pool.query(quoryInstance.byName(text), replacements)
  const duration = Date.now() - start
  loggers.postgres('executed query %o', {
    id: quoryInstance.queryId(text),
    name: quoryInstance.getName(text),
    duration,
    rows: result.rowCount
  })
  return result
}

function connect () {
  return this.pool.connect()
}
