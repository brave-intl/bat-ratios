
const crypto = require('crypto')
const {
  isString,
  isArray
} = require('lodash')
const {
  TOKEN_LIST
} = require('src/utils/env')

module.exports = {
  simpleToken,
  isSimpleTokenValid
}

function constantTimeEquals (a, b) {
  let mismatch = a.length !== b.length
  if (mismatch) {
    b = a
  }
  mismatch |= !crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b))
  return !mismatch
}

function isSimpleTokenValid (tokenList, token) {
  if (!(isArray(tokenList) && tokenList.every(isString))) {
    throw new TypeError('tokenList must be an array of strings')
  }
  if (!isString(token)) {
    throw new TypeError('token must be a string')
  }

  for (let i = 0; i < tokenList.length; i++) {
    if (constantTimeEquals(tokenList[i], token)) {
      return true
    }
  }
  return false
}

function simpleToken (req, res, next) {
  const { token } = req
  if (!token) {
    next('Missing Authentication')
  } else if (isSimpleTokenValid(TOKEN_LIST, token)) {
    next()
  } else {
    next('Invalid Authentication')
  }
}
