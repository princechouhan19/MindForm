const Fapless = require('../models/Fapless')
const { computeStreakStats } = require('../utils/aura')
const catchAsync = require('../utils/catchAsync')
const AppError = require('../utils/AppError')

// GET current user's fapless data (+ canonical streak/aura computed server-side)
exports.getRecord = catchAsync(async (req, res, next) => {
  let doc = await Fapless.findOne({ user: req.user.id })
  if (!doc) {
    doc = await Fapless.create({ user: req.user.id })
  }
  const stats = computeStreakStats(doc)
  res.json({
    success: true,
    data: {
      ...doc.toObject(),
      streakDays: stats.streakDays,
      aura: stats.aura,
      level: stats.level,
      auraRate: stats.auraRate,
    },
  })
})

// PUT — update startDate, activeChallenge, notes
exports.update = catchAsync(async (req, res, next) => {
  const { startDate, activeChallenge, notes } = req.body
  const doc = await Fapless.findOneAndUpdate(
    { user: req.user.id },
    {
      $set: {
        ...(startDate !== undefined && { startDate }),
        ...(activeChallenge !== undefined && { activeChallenge: String(activeChallenge).slice(0, 32) }),
        ...(notes !== undefined && { notes: String(notes).slice(0, 2000) }),
      },
    },
    { upsert: true, new: true, runValidators: true }
  )
  const stats = computeStreakStats(doc)
  res.json({ success: true, data: { ...doc.toObject(), ...stats } })
})

// POST /relapse — record a relapse
exports.relapse = catchAsync(async (req, res, next) => {
  const { reason, dayCount } = req.body
  const doc = await Fapless.findOneAndUpdate(
    { user: req.user.id },
    {
      $push: { relapses: { reason: String(reason || '').slice(0, 500), dayCount: Math.max(0, Number(dayCount) || 0), date: new Date() } },
      $set: { startDate: new Date() }, // reset streak
    },
    { upsert: true, new: true }
  )
  const stats = computeStreakStats(doc)
  res.json({ success: true, data: { ...doc.toObject(), ...stats } })
})

// POST /start — set a fresh start date
exports.start = catchAsync(async (req, res, next) => {
  const doc = await Fapless.findOneAndUpdate(
    { user: req.user.id },
    { $set: { startDate: new Date() } },
    { upsert: true, new: true }
  )
  const stats = computeStreakStats(doc)
  res.json({ success: true, data: { ...doc.toObject(), ...stats } })
})

// PUT /aura — add aura points (kept for API compatibility; clamped)
exports.addAura = catchAsync(async (req, res, next) => {
  const { points } = req.body
  const safe = Math.max(-1000, Math.min(10000, Number(points) || 0))
  const doc = await Fapless.findOneAndUpdate(
    { user: req.user.id },
    { $inc: { totalAura: safe } },
    { upsert: true, new: true }
  )
  const stats = computeStreakStats(doc)
  res.json({ success: true, data: { ...doc.toObject(), ...stats } })
})
