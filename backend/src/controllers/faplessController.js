const Fapless = require('../models/Fapless')
const { computeStreakStats, URGE_AURA } = require('../utils/aura')
const catchAsync = require('../utils/catchAsync')
const AppError = require('../utils/AppError')

const clampInt = (v, min, max, fallback) => {
  const n = Number(v)
  return Number.isFinite(n) ? Math.max(min, Math.min(max, Math.round(n))) : fallback
}

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
      ...stats,
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

// POST /relapse — record a relapse (structured trigger + optional note)
exports.relapse = catchAsync(async (req, res, next) => {
  const { reason, dayCount, trigger } = req.body
  const doc = await Fapless.findOneAndUpdate(
    { user: req.user.id },
    {
      $push: {
        relapses: {
          reason: String(reason || '').slice(0, 500),
          trigger: String(trigger || '').slice(0, 40),
          dayCount: Math.max(0, Number(dayCount) || 0),
          date: new Date(),
        },
      },
      $set: { startDate: new Date() }, // reset streak
    },
    { upsert: true, new: true }
  )
  const stats = computeStreakStats(doc)
  res.json({ success: true, data: { ...doc.toObject(), ...stats } })
})

// POST /urge-log — log an urge-surfing session (resisted or not)
exports.logUrge = catchAsync(async (req, res, next) => {
  const { trigger, intensityBefore, intensityAfter, strategy, resisted } = req.body
  const doc = await Fapless.findOneAndUpdate(
    { user: req.user.id },
    {
      $push: {
        urgeLogs: {
          date: new Date(),
          trigger: String(trigger || '').slice(0, 40),
          intensityBefore: clampInt(intensityBefore, 0, 10, 5),
          intensityAfter: clampInt(intensityAfter, 0, 10, 0),
          strategy: String(strategy || '').slice(0, 40),
          resisted: resisted !== false,
        },
      },
    },
    { upsert: true, new: true }
  )
  const stats = computeStreakStats(doc)
  res.json({ success: true, data: { ...doc.toObject(), ...stats }, auraAwarded: resisted !== false ? URGE_AURA : 0 })
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
