const v1 = require('./v1')
const { Router } = require('express')
const router = new Router()

router.use('/v1', v1)
router.get('/', (req, res, next) => {
  res.send('').status(204)
})

module.exports = router
