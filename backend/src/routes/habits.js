const express = require('express')
const { getMonth, upsertMonth } = require('../controllers/habitsController')
const { protect } = require('../middleware/auth')

const router = express.Router()

router.use(protect)

router.get('/:monthKey', getMonth)
router.put('/:monthKey', upsertMonth)

module.exports = router
