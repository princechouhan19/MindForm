const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')
const ctrl = require('../controllers/faplessController')

router.get('/', auth, ctrl.getRecord)
router.put('/', auth, ctrl.update)
router.post('/relapse', auth, ctrl.relapse)
router.post('/start', auth, ctrl.start)
router.put('/aura', auth, ctrl.addAura)

module.exports = router
