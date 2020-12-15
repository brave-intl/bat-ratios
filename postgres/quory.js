const _ = require('lodash')
const uuidV5 = require('uuid/v5')
const {
  loggers
} = require('../debug')

module.exports = function (config = {}) {
  const cached = {}
  const names = {}
  const reverseNames = {}
  const { queries = [] } = config
  if (_.isArray(queries)) {
    queries.forEach((query) => {
      cached[query] = queryId(query)
    })
  } else if (_.isObject(queries)) {
    _.forOwn(queries, (query, name) => {
      const id = queryId(query)
      names[name] = id
      reverseNames[query] = name
      loggers.postgres(name, id)
    })
  }

  return {
    byName,
    createId,
    queryId,
    getName
  }

  function getName (text) {
    return names[text] || reverseNames[text] || 'notdefined'
  }

  function byName (text) {
    return names[text] || text
  }

  function queryId (text) {
    const named = names[text]
    if (named) {
      return named
    }
    const cache = cached[text]
    if (cache) {
      return cache
    }
    const id = createId(text)
    cached[text] = id
    return id
  }

  function createId (text) {
    return uuidV5(text, '0143c8ce-f734-427e-80f9-8072a15e256b')
  }
}
