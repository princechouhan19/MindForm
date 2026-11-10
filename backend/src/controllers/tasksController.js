const TaskWeek = require('../models/TaskWeek')

// weekKey format: "2025-0-w1" — guard against injection/dupes
const WEEK_KEY_RE = /^\d{4}-\d{1,2}-w\d{1,2}$/

// GET /api/tasks/:weekKey
const getWeek = async (req, res) => {
  try {
    const { weekKey } = req.params
    if (!WEEK_KEY_RE.test(weekKey)) {
      return res.status(400).json({ success: false, message: 'Invalid week key format.' })
    }
    const doc = await TaskWeek.findOne({ user: req.user._id, weekKey })

    if (!doc) {
      return res.status(200).json({ success: true, data: null })
    }

    res.status(200).json({
      success: true,
      data: {
        weekKey: doc.weekKey,
        tasks: doc.tasks,
        checks: Object.fromEntries(doc.checks),
        reflection: doc.reflection,
        updatedAt: doc.updatedAt,
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch week data.' })
  }
}

// PUT /api/tasks/:weekKey
const upsertWeek = async (req, res) => {
  try {
    const { weekKey } = req.params
    if (!WEEK_KEY_RE.test(weekKey)) {
      return res.status(400).json({ success: false, message: 'Invalid week key format.' })
    }
    const { tasks, checks, reflection } = req.body
    if (tasks !== undefined && !Array.isArray(tasks)) {
      return res.status(400).json({ success: false, message: 'Tasks must be an array.' })
    }

    const doc = await TaskWeek.findOneAndUpdate(
      { user: req.user._id, weekKey },
      {
        $set: {
          tasks: tasks || [],
          checks: checks || {},
          reflection: reflection || {},
          updatedAt: Date.now(),
        },
      },
      { upsert: true, new: true, runValidators: true }
    )

    res.status(200).json({
      success: true,
      data: {
        weekKey: doc.weekKey,
        tasks: doc.tasks,
        checks: Object.fromEntries(doc.checks),
        reflection: doc.reflection,
        updatedAt: doc.updatedAt,
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to save week data.' })
  }
}

// GET /api/tasks/month/:monthKey — fetch all weeks in a month
const getMonth = async (req, res) => {
  try {
    const { monthKey } = req.params
    if (!/^\d{4}-\d{1,2}$/.test(monthKey)) {
      return res.status(400).json({ success: false, message: 'Invalid month key format.' })
    }
    // weekKey format: "2025-0-w1", "2025-0-w2", etc.
    const docs = await TaskWeek.find({
      user: req.user._id,
      weekKey: { $regex: `^${monthKey}-w` },
    })

    const result = {}
    docs.forEach((doc) => {
      result[doc.weekKey] = {
        tasks: doc.tasks,
        checks: Object.fromEntries(doc.checks),
        reflection: doc.reflection,
        updatedAt: doc.updatedAt,
      }
    })

    res.status(200).json({ success: true, data: result })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch month data.' })
  }
}

module.exports = { getWeek, upsertWeek, getMonth }
