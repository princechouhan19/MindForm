const HabitMonth = require('../models/HabitMonth')

// GET /api/habits/:monthKey
const getMonth = async (req, res) => {
  try {
    const { monthKey } = req.params
    const doc = await HabitMonth.findOne({ user: req.user._id, monthKey })

    if (!doc) {
      return res.status(200).json({ success: true, data: null })
    }

    res.status(200).json({
      success: true,
      data: {
        monthKey: doc.monthKey,
        habits: doc.habits,
        checks: Object.fromEntries(doc.checks),
        mental: Object.fromEntries(doc.mental),
        updatedAt: doc.updatedAt,
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch habit data.' })
  }
}

// PUT /api/habits/:monthKey
const upsertMonth = async (req, res) => {
  try {
    const { monthKey } = req.params
    const { habits, checks, mental } = req.body

    const doc = await HabitMonth.findOneAndUpdate(
      { user: req.user._id, monthKey },
      {
        $set: {
          habits: habits || [],
          checks: checks || {},
          mental: mental || {},
          updatedAt: Date.now(),
        },
      },
      { upsert: true, new: true, runValidators: true }
    )

    res.status(200).json({
      success: true,
      data: {
        monthKey: doc.monthKey,
        habits: doc.habits,
        checks: Object.fromEntries(doc.checks),
        mental: Object.fromEntries(doc.mental),
        updatedAt: doc.updatedAt,
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to save habit data.' })
  }
}

module.exports = { getMonth, upsertMonth }
