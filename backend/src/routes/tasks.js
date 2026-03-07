const express = require('express')
const { getWeek, upsertWeek, getMonth } = require('../controllers/tasksController')
const { protect } = require('../middleware/auth')

const router = express.Router()

router.use(protect)

router.get('/month/:monthKey', getMonth)
router.get('/:weekKey', getWeek)
router.put('/:weekKey', upsertWeek)

module.exports = router
