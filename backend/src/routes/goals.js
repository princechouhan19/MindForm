const express = require('express')
const { getGoals, createGoal, updateGoal, deleteGoal } = require('../controllers/goalsController')
const { protect } = require('../middleware/auth')

const router = express.Router()
router.use(protect)

router.get('/', getGoals)
router.post('/', createGoal)
router.put('/:id', updateGoal)
router.delete('/:id', deleteGoal)

module.exports = router
