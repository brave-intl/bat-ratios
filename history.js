const { fetchAndInsert } = require('./workers')
const postgres = require('./postgres')
const { loggers } = require('./debug')
fetchAndInsert(postgres)
  .then(() => { postgres.release() })
  .then(() => process.exit(0))
  .catch(loggers.exception)
