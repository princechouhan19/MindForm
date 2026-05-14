const Fapless = require('../models/Fapless')
const catchAsync = require('../utils/catchAsync')

// GET current user's fapless data
exports.getRecord = catchAsync(async (req, res, next) => {
  let doc = await Fapless.findOne({ user: req.user.id })
  if (!doc) {
    doc = await Fapless.create({ user: req.user.id })
  }
  res.json({ success: true, data: doc })
})

// PUT — update startDate, activeChallenge, notes
exports.update = catchAsync(async (req, res, next) => {
  const { startDate, activeChallenge, notes } = req.body
  const doc = await Fapless.findOneAndUpdate(
    { user: req.user.id },
    { $set: { startDate, activeChallenge, notes } },
    { upsert: true, new: true }
  )
  res.json({ success: true, data: doc })
})

// POST /relapse — record a relapse
exports.relapse = catchAsync(async (req, res, next) => {
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
})

// POST /start — set a fresh start date
exports.start = catchAsync(async (req, res, next) => {
  const doc = await Fapless.findOneAndUpdate(
    { user: req.user.id },
    { $set: { startDate: new Date() } },
    { upsert: true, new: true }
  )
  res.json({ success: true, data: doc })
})

// PUT /aura — add aura points
exports.addAura = catchAsync(async (req, res, next) => {
  const { points } = req.body
  const doc = await Fapless.findOneAndUpdate(
    { user: req.user.id },
    { $inc: { totalAura: points || 0 } },
    { upsert: true, new: true }
  )
  res.json({ success: true, data: doc })
})

