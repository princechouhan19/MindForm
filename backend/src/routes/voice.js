const express = require('express')
const { getLog, updateLog } = require('../controllers/voiceController')
const { protect } = require('../middleware/auth')

const router = express.Router()

router.use(protect)

router.get('/', getLog)
router.put('/', updateLog)

module.exports = router
