const express = require('express')
const { getLog, upsertLog } = require('../controllers/voiceController')
const { protect } = require('../middleware/auth')

const router = express.Router()

router.use(protect)

router.get('/', getLog)
router.put('/', upsertLog)

module.exports = router
