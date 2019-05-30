module.exports = errors

function errors (err, req, res, next) {
  const { error } = err
  if (error && error.isJoi) {
    return res.status(error.statusCode).send(error.payload)
  }
  res.boom.badImplementation(err.message)
}
