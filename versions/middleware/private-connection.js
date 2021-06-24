const handler = ({ port, paths, erred }) => {
  const privatePaths = paths.reduce((memo, path) => {
    memo[path] = true
    return memo
  }, {})
  return (req, res, next) => {
    const { socket, originalUrl } = req
    const { _connectionKey: connectionKey } = socket.server
    if (privatePaths[originalUrl] && !connectionKey.includes(':' + port)) {
      return erred(req, res, next)
    }
    next()
  }
}

module.exports = {
  handler
}
