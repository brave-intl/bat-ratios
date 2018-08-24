const v1 = require('./v1')
const { Router } = require('express')
const router = new Router()

router.use('/v1', v1)

module.exports = router
