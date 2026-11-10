const Goal = require('../models/Goal')
const AppError = require('../utils/AppError')
const catchAsync = require('../utils/catchAsync')

const ALLOWED_STATUSES = ['active', 'completed', 'abandoned']
const ALLOWED_CATEGORIES = ['general', 'career', 'health', 'learning', 'finance', 'personal']

const cleanList = (arr, max = 20) =>
  Array.isArray(arr) ? arr.filter(x => typeof x === 'string' && x.trim()).map(x => x.trim().slice(0, 80)).slice(0, max) : []

// Milestones: [{ title, done }] — ids are generated server-side
const cleanMilestones = (arr) =>
  Array.isArray(arr)
    ? arr
        .filter(m => m && typeof m.title === 'string' && m.title.trim())
        .slice(0, 20)
        .map(m => ({
          id: (typeof m.id === 'string' && m.id.trim()) || Math.random().toString(36).slice(2, 10),
          title: String(m.title).trim().slice(0, 120),
          done: Boolean(m.done),
        }))
    : []

// GET all goals for user
exports.getGoals = catchAsync(async (req, res) => {
  const goals = await Goal.find({ user: req.user.id }).sort({ createdAt: -1 })
  res.json({ success: true, data: goals })
})

// POST create goal
exports.createGoal = catchAsync(async (req, res) => {
  const { title, description, deadline, linkedTasks, linkedHabits, category, status, milestones } = req.body
  if (!title?.trim() || !deadline) {
    throw new AppError('Title and deadline are required.', 400)
  }
  const date = new Date(deadline)
  if (isNaN(date.getTime())) {
    throw new AppError('Deadline must be a valid date.', 400)
  }
  const goal = await Goal.create({
    user: req.user.id,
    title: String(title).trim().slice(0, 120),
    description: String(description || '').slice(0, 1000),
    deadline: date,
    linkedTasks: cleanList(linkedTasks),
    linkedHabits: cleanList(linkedHabits),
    milestones: cleanMilestones(milestones),
    category: ALLOWED_CATEGORIES.includes(category) ? category : 'general',
    ...(status && ALLOWED_STATUSES.includes(status) ? { status } : {}),
  })
  res.status(201).json({ success: true, data: goal })
})

// PUT update goal
exports.updateGoal = catchAsync(async (req, res) => {
  const goal = await Goal.findOne({ _id: req.params.id, user: req.user.id })
  if (!goal) throw new AppError('Goal not found.', 404)

  const { title, description, deadline, linkedTasks, linkedHabits, category, status, milestones } = req.body
  if (title !== undefined) {
    if (!String(title).trim()) throw new AppError('Title cannot be empty.', 400)
    goal.title = String(title).trim().slice(0, 120)
  }
  if (description !== undefined) goal.description = String(description).slice(0, 1000)
  if (deadline !== undefined) {
    const date = new Date(deadline)
    if (isNaN(date.getTime())) throw new AppError('Deadline must be a valid date.', 400)
    goal.deadline = date
  }
  if (linkedTasks !== undefined) goal.linkedTasks = cleanList(linkedTasks)
  if (linkedHabits !== undefined) goal.linkedHabits = cleanList(linkedHabits)
  if (milestones !== undefined) goal.milestones = cleanMilestones(milestones)
  if (category !== undefined) goal.category = ALLOWED_CATEGORIES.includes(category) ? category : 'general'
  if (status !== undefined) {
    if (!ALLOWED_STATUSES.includes(status)) throw new AppError('Invalid status.', 400)
    goal.status = status
  }

  await goal.save()
  res.json({ success: true, data: goal })
})

// DELETE goal
exports.deleteGoal = catchAsync(async (req, res) => {
  const goal = await Goal.findOneAndDelete({ _id: req.params.id, user: req.user.id })
  if (!goal) throw new AppError('Goal not found.', 404)
  res.json({ success: true, message: 'Goal deleted.' })
})
