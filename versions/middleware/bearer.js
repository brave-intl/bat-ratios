module.exports = bearer

function bearer ({
  headerKey
}) {
  return (req, res, next) => {
    const { authorization } = req.headers
    if (authorization) {
      const token = authorization.split(/\s/igm).find((value, index, list) => {
        if (list[index - 1] === headerKey) {
          return true
        }
        return false
      })
      if (token) {
        req.token = token
      }
    }
    next()
  }
}
