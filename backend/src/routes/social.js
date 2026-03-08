const express = require('express')
const router = express.Router()
const User = require('../models/User')
const Fapless = require('../models/Fapless')
const ForumMessage = require('../models/ForumMessage')
const { protect } = require('../middleware/auth')

// ── Admin middleware ──────────────────────────────────────────────────────────
const adminOnly = (req, res, next) => {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ success: false, message: 'Admin access required.' })
  }
  next()
}

// ── GET /social/leaderboard ───────────────────────────────────────────────────
// Public leaderboard — returns top 50 public users sorted by streak
router.get('/leaderboard', async (req, res) => {
  try {
    const publicFapless = await Fapless.find({ startDate: { $ne: null } })
      .populate({
        path: 'user',
        match: { isPublic: true },
        select: 'name country badges avatar',
      })
      .lean()

    const entries = publicFapless
      .filter(f => f.user)  // only public users
      .map(f => {
        const totalMs = Date.now() - new Date(f.startDate).getTime()
        const streakDays = Math.max(0, Math.floor(totalMs / 86400000))
        const aura = Math.floor(totalMs / 1000)
        return {
          userId: f.user._id,
          name: f.user.name,
          country: f.user.country || '',
          badges: f.user.badges || [],
          avatar: f.user.avatar || '',
          streakDays,
          aura,
          activeChallenge: f.activeChallenge,
        }
      })
      .sort((a, b) => b.streakDays - a.streakDays)
      .slice(0, 50)

    res.json({ success: true, leaderboard: entries })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// ── GET /social/profile/:userId ───────────────────────────────────────────────
// View a public profile (or own profile)
router.get('/profile/:userId', protect, async (req, res) => {
  try {
    const target = await User.findById(req.params.userId)
      .select('-password')
      .populate('followers', 'name avatar country')
      .populate('following', 'name avatar country')

    if (!target) return res.status(404).json({ success: false, message: 'User not found.' })
    if (!target.isPublic && target._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'This profile is private.' })
    }

    const fapless = await Fapless.findOne({ user: target._id })
    let streakDays = 0, aura = 0
    if (fapless?.startDate) {
      const totalMs = Date.now() - new Date(fapless.startDate).getTime()
      streakDays = Math.max(0, Math.floor(totalMs / 86400000))
      aura = Math.floor(totalMs / 1000)
    }

    res.json({ success: true, profile: { ...target.toObject(), streakDays, aura } })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// ── GET /social/me ────────────────────────────────────────────────────────────
// Get own full profile (including private)
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('followers', 'name avatar country')
      .populate('following', 'name avatar country')
    res.json({ success: true, profile: user })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// ── PUT /social/me ────────────────────────────────────────────────────────────
// Update own profile (bio, country, avatar, isPublic)
router.put('/me', protect, async (req, res) => {
  try {
    const { bio, country, avatar, isPublic } = req.body
    const updates = {}
    if (bio !== undefined)      updates.bio = bio.slice(0, 200)
    if (country !== undefined)  updates.country = country
    if (avatar !== undefined)   updates.avatar = avatar
    if (isPublic !== undefined) updates.isPublic = isPublic

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select('-password')
    res.json({ success: true, profile: user })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// ── POST /social/follow/:userId ───────────────────────────────────────────────
router.post('/follow/:userId', protect, async (req, res) => {
  try {
    if (req.params.userId === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: "Can't follow yourself." })
    }
    const target = await User.findById(req.params.userId)
    if (!target) return res.status(404).json({ success: false, message: 'User not found.' })

    if (!target.followers.includes(req.user._id)) {
      await User.findByIdAndUpdate(req.params.userId, { $addToSet: { followers: req.user._id } })
      await User.findByIdAndUpdate(req.user._id, { $addToSet: { following: req.params.userId } })
    }
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// ── DELETE /social/follow/:userId ─────────────────────────────────────────────
router.delete('/follow/:userId', protect, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.userId, { $pull: { followers: req.user._id } })
    await User.findByIdAndUpdate(req.user._id, { $pull: { following: req.params.userId } })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// ── GET /social/forum ─────────────────────────────────────────────────────────
router.get('/forum', protect, async (req, res) => {
  try {
    const msgs = await ForumMessage.find()
      .sort({ createdAt: -1 })
      .limit(100)
      .populate('user', 'name avatar country badges')
      .lean()
    res.json({ success: true, messages: msgs.reverse() })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// ── POST /social/forum ────────────────────────────────────────────────────────
router.post('/forum', protect, async (req, res) => {
  try {
    const { text } = req.body
    if (!text?.trim()) return res.status(400).json({ success: false, message: 'Message cannot be empty.' })

    const msg = await ForumMessage.create({ user: req.user._id, text: text.slice(0, 1000) })
    const populated = await msg.populate('user', 'name avatar country badges')
    res.status(201).json({ success: true, message: populated })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// ══════════════════════════════════════════════════════════════════════════════
// ── ADMIN ROUTES (princechouhan4606@gmail.com only) ───────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

const BADGE_CATALOG = [
  { id: 'content_creator', label: 'Content Creator', emoji: '🎥', color: '#ff6b35' },
  { id: 'partner',         label: 'Partner',         emoji: '🤝', color: '#00bfff' },
  { id: 'moderator',       label: 'Moderator',       emoji: '🛡️', color: '#a78bfa' },
  { id: 'og_member',       label: 'OG Member',       emoji: '👑', color: '#ffd700' },
  { id: 'sigma_verified',  label: 'Sigma Verified',  emoji: '🔱', color: '#00e5ff' },
  { id: 'legend',          label: 'Legend',          emoji: '🌌', color: '#ff00ff' },
]

// GET /social/admin/users — list all users
router.get('/admin/users', protect, adminOnly, async (req, res) => {
  try {
    const users = await User.find().select('-password').lean()
    res.json({ success: true, users })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// GET /social/admin/badges — get badge catalog
router.get('/admin/badges', protect, adminOnly, async (req, res) => {
  res.json({ success: true, badges: BADGE_CATALOG })
})

// POST /social/admin/badge/:userId — assign badge
router.post('/admin/badge/:userId', protect, adminOnly, async (req, res) => {
  try {
    const { badgeId } = req.body
    const badge = BADGE_CATALOG.find(b => b.id === badgeId)
    if (!badge) return res.status(400).json({ success: false, message: 'Invalid badge ID.' })

    const user = await User.findById(req.params.userId)
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' })

    const alreadyHas = user.badges.some(b => b.id === badgeId)
    if (!alreadyHas) {
      user.badges.push({ ...badge, assignedAt: new Date() })
      await user.save()
    }
    res.json({ success: true, badges: user.badges })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// DELETE /social/admin/badge/:userId — revoke badge
router.delete('/admin/badge/:userId', protect, adminOnly, async (req, res) => {
  try {
    const { badgeId } = req.body
    await User.findByIdAndUpdate(req.params.userId, { $pull: { badges: { id: badgeId } } })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// DELETE /social/admin/forum/:msgId — delete a forum message
router.delete('/admin/forum/:msgId', protect, adminOnly, async (req, res) => {
  try {
    await ForumMessage.findByIdAndDelete(req.params.msgId)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

module.exports = router
