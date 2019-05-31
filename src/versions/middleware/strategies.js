module.exports = strategies

function strategies (list, options = {}) {
  const { boom } = options
  return (req, res, next) => {
    const memo = Promise.resolve()
    list.reduce((memo, authorizer) => {
      return memo.then(() => new Promise((resolve, reject) => {
        authorizer(req, res, (error) => {
          if (error) {
            reject(error)
          } else {
            resolve()
          }
        })
      }))
    }, memo).then(() => {
      next()
    }, (error) => {
      if (boom) {
        res.boom.unauthorized(error)
      } else {
        next(error instanceof Error ? error : new Error(error))
      }
    })
  }
}
