const express = require('express');
const bearerToken = require('express-bearer-token');
const boom = require('express-boom');
const _ = require('lodash')
const debug = require('./debug')
const app = express();
const routers = require('./versions')
const PORT = process.env.PORT || 8000
const TOKEN_LIST = process.env.TOKEN_LIST || null
const tokenList = TOKEN_LIST ? TOKEN_LIST.split(',') : []
module.exports = start
start.server = app

app.use(boom())
app.use(bearerToken({
  headerKey: 'Bearer'
}));

app.use((req, res, next) => {
  debug('requested', req.url)
  next()
})

app.use((req, res, next) => {
  const { token } = req
  if (!token) {
    res.boom.unauthorized('Missing Authentication')
  } else if (_.includes(tokenList, token)) {
    next()
  } else {
    res.boom.unauthorized('Invalid Auth')
  }
})

app.use('/', routers)

app.use((err, req, res, next) => {
  const { error } = err
  if (error && error.isJoi) {
    return res.status(error.statusCode).send(error.payload)
  }
  res.boom.badImplementation(err.message)
})
app.use((req, res, next) => {
  debug('not found', req.url)
  res.boom.notFound()
})

function start(port = PORT) {
  return new Promise((resolve, reject) => {
    app.listen(port, (err) => {
      if (err) {
        debug('failed to start server', err)
        reject(err)
      } else {
        debug(`started server on ${port}`)
        resolve()
      }
    });
  })
}