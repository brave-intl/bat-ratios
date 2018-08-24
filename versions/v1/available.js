const { Router } = require('express')
const { available } = require('./functions')
const router = new Router()

module.exports = router

router.use('/fiats', available.fiats)
router.use('/alts', available.alts)
router.use('/', available.all)
