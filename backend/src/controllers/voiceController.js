const VoiceLog = require('../models/VoiceLog')

// GET /api/voice — user's practice log
const getLog = async (req, res) => {
  try {
    const doc = await VoiceLog.findOne({ user: req.user._id }).lean()
    if (!doc) {
      return res.status(200).json({ success: true, data: { sessions: [], weeklyGoalMinutes: 60 } })
    }
    res.status(200).json({
      success: true,
      data: {
        sessions: doc.sessions || [],
        weeklyGoalMinutes: doc.weeklyGoalMinutes ?? 60,
        updatedAt: doc.updatedAt,
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch voice practice log.' })
  }
}

// PUT /api/voice — replace/merge the session list (client keeps local mirror for offline)
const upsertLog = async (req, res) => {
  try {
    const { sessions, weeklyGoalMinutes } = req.body

    let clean = []
    if (Array.isArray(sessions)) {
      clean = sessions
        .filter(s => s && typeof s.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s.date) && Number(s.minutes) > 0)
        .slice(-500)
        .map(s => ({
          date: s.date,
          ts: Number(s.ts) || Date.parse(s.date) || Date.now(),
          planId: ['15', '30', '60'].includes(String(s.planId)) ? String(s.planId) : '15',
          planMinutes: Math.min(120, Math.max(1, Number(s.planMinutes) || 15)),
          minutes: Math.min(180, Math.max(1, Math.round(Number(s.minutes) || 1))),
          stepsDone: Math.min(20, Math.max(0, Number(s.stepsDone) || 0)),
          totalSteps: Math.min(20, Math.max(0, Number(s.totalSteps) || 0)),
        }))
    }

    const doc = await VoiceLog.findOneAndUpdate(
      { user: req.user._id },
      {
        $set: {
          ...(Array.isArray(sessions) ? { sessions: clean } : {}),
          ...(Number.isFinite(Number(weeklyGoalMinutes))
            ? { weeklyGoalMinutes: Math.min(2000, Math.max(0, Number(weeklyGoalMinutes))) }
            : {}),
          updatedAt: Date.now(),
        },
      },
      { upsert: true, new: true, runValidators: true }
    )

    res.status(200).json({
      success: true,
      data: {
        sessions: doc.sessions || [],
        weeklyGoalMinutes: doc.weeklyGoalMinutes,
        updatedAt: doc.updatedAt,
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to save voice practice log.' })
  }
}

module.exports = { getLog, upsertLog }
