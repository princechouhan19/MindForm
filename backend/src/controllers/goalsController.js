const Goal = require('../models/Goal')

// GET all goals for user
exports.getGoals = async (req, res) => {
  try {
    const goals = await Goal.find({ user: req.user.id }).sort({ createdAt: -1 })
    res.json({ success: true, data: goals })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// POST create goal
exports.createGoal = async (req, res) => {
  try {
    const { title, description, deadline, linkedTasks, linkedHabits, category } = req.body
    if (!title || !deadline) return res.status(400).json({ success: false, message: 'Title and deadline are required.' })
    const goal = await Goal.create({
      user: req.user.id,
      title,
      description,
      deadline,
      linkedTasks: linkedTasks || [],
      linkedHabits: linkedHabits || [],
      category: category || 'general',
    })
    res.status(201).json({ success: true, data: goal })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// PUT update goal
exports.updateGoal = async (req, res) => {
  try {
    const goal = await Goal.findOne({ _id: req.params.id, user: req.user.id })
    if (!goal) return res.status(404).json({ success: false, message: 'Goal not found.' })
    Object.assign(goal, req.body)
    await goal.save()
    res.json({ success: true, data: goal })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// DELETE goal
exports.deleteGoal = async (req, res) => {
  try {
    const goal = await Goal.findOneAndDelete({ _id: req.params.id, user: req.user.id })
    if (!goal) return res.status(404).json({ success: false, message: 'Goal not found.' })
    res.json({ success: true, message: 'Goal deleted.' })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}
