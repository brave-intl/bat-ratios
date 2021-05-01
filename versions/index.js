const v1 = require('$/versions/v1')
const v2 = require('$/versions/v2')
const { Router } = require('express')
const auth = require('$/versions/middleware/auth')
const strategies = require('$/versions/middleware/strategies')
const bearerToken = require('$/versions/middleware/bearer')

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

router.use('/v1', v2)

module.exports = router
