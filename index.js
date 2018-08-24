const express = require('express');
const bearerToken = require('express-bearer-token');
const boom = require('boom')
const SDebug = require('debug')
const debug = new SDebug('bat-ratios')
const app = express();
const routers = require('./versions')
const PORT = process.env.PORT || 8000
app.use(bearerToken());
app.use((req, res, next) => {
  debug('requested', req.url)
  next()
})
app.use('/', routers)

app.use((err, req, res, next) => {
  const { error } = err
  if (error && error.isJoi) {
    return res.status(error.statusCode).send(error.payload)
  }
  res.status(500).send(err.message)
})
app.use((req, res, next) => {
  debug('not found', req.url)
  res.status(404).send(boom.notFound())
})

app.listen(PORT, (err) => {
  if (err) {
    return debug('failed to start server', err)
  }
  debug(`started server on ${PORT}`)
});
