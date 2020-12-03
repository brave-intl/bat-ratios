const v1 = require('./v1')
const { Router } = require('express')
const auth = require('./middleware/auth')
const strategies = require('./middleware/strategies')
const bearerToken = require('./middleware/bearer')

const router = new Router()
const v1Protected = new Router()
const bearerMiddleware = bearerToken({
  headerKey: 'Bearer'
})
const authMiddleware = strategies([
  auth.simpleToken
], {
  boom: true
})

v1Protected.use(bearerMiddleware)
v1Protected.use(authMiddleware)
v1Protected.use(v1)
router.use('/v1', v1Protected)

module.exports = router
