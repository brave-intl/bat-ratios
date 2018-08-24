const { Router } = require('express')
const { available } = require('./functions')
const router = new Router()

module.exports = router

router.use('/fiat', available.fiat)
router.use('/alt', available.alt)
router.use('/', available.all)
