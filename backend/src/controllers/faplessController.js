const Fapless = require('../models/Fapless')

// GET current user's fapless data
exports.getRecord = async (req, res) => {
  try {
    let doc = await Fapless.findOne({ user: req.user.id })
    if (!doc) {
      doc = await Fapless.create({ user: req.user.id })
    }
    res.json({ success: true, data: doc })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// PUT — update startDate, activeChallenge, notes
exports.update = async (req, res) => {
  try {
    const { startDate, activeChallenge, notes } = req.body
    const doc = await Fapless.findOneAndUpdate(
      { user: req.user.id },
      { $set: { startDate, activeChallenge, notes } },
      { upsert: true, new: true }
    )
    res.json({ success: true, data: doc })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// POST /relapse — record a relapse
exports.relapse = async (req, res) => {
  try {
    const { reason, dayCount } = req.body
    const doc = await Fapless.findOneAndUpdate(
      { user: req.user.id },
      {
        $push: { relapses: { reason: reason || '', dayCount: dayCount || 0, date: new Date() } },
        $set: { startDate: new Date() }, // reset streak
      },
      { upsert: true, new: true }
    )
    res.json({ success: true, data: doc })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// POST /start — set a fresh start date
exports.start = async (req, res) => {
  try {
    const doc = await Fapless.findOneAndUpdate(
      { user: req.user.id },
      { $set: { startDate: new Date() } },
      { upsert: true, new: true }
    )
    res.json({ success: true, data: doc })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// PUT /aura — add aura points (called from frontend on daily login bonus etc.)
exports.addAura = async (req, res) => {
  try {
    const { points } = req.body
    const doc = await Fapless.findOneAndUpdate(
      { user: req.user.id },
      { $inc: { totalAura: points || 0 } },
      { upsert: true, new: true }
    )
    res.json({ success: true, data: doc })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}
