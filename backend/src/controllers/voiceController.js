const VoiceLog = require('../models/VoiceLog')

// GET /api/voice — the signed-in user's session log (single doc)
const getLog = async (req, res) => {
  try {
    const doc = await VoiceLog.findOne({ user: req.user._id })
    if (!doc) return res.status(200).json({ success: true, data: null })
    res.status(200).json({
      success: true,
      data: {
        sessions: doc.sessions,
        updatedAt: doc.updatedAt,
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch voice log.' })
  }
}

// PUT /api/voice — replace the session log wholesale (client keeps the truth)
const updateLog = async (req, res) => {
  try {
    const { sessions } = req.body
    if (sessions !== undefined && !Array.isArray(sessions)) {
      return res.status(400).json({ success: false, message: 'Sessions must be an array.' })
    }
    // Hard cap: keep the log bounded (most recent 500 sessions)
    const trimmed = (sessions || []).slice(-500)

    const doc = await VoiceLog.findOneAndUpdate(
      { user: req.user._id },
      { $set: { sessions: trimmed, updatedAt: Date.now() } },
      { upsert: true, new: true, runValidators: true }
    )

    res.status(200).json({
      success: true,
      data: {
        sessions: doc.sessions,
        updatedAt: doc.updatedAt,
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to save voice log.' })
  }
}

module.exports = { getLog, updateLog }
