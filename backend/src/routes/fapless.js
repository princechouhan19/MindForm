const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/auth')
const ctrl = require('../controllers/faplessController')

router.get('/', protect, ctrl.getRecord)
router.put('/', protect, ctrl.update)
router.post('/relapse', protect, ctrl.relapse)
router.post('/start', protect, ctrl.start)
router.put('/aura', protect, ctrl.addAura)

module.exports = router
