const { fetchAndInsert } = require('./fetch-and-insert')
const { loggers } = require('./debug')
fetchAndInsert().catch(loggers.exception)
