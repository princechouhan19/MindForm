const express = require('express')
const crypto = require('crypto')
const router = express.Router()
const { protect } = require('../middleware/auth')
const AppError = require('../utils/AppError')
const catchAsync = require('../utils/catchAsync')
const MCPKey = require('../models/MCPKey')

/* ═══════════════════════════════════════════════════════════════
   MCP account-key management (JWT-protected, browser only).

   The MCP endpoint itself (backend/src/mcp/http.js) uses these
   keys instead of JWTs: every account can issue up to 5 active
   keys, see metadata, rotate and revoke. Plaintext is returned
   EXACTLY ONCE — the database keeps only a SHA-256 hash.
   ═══════════════════════════════════════════════════════════════ */

const KEY_PREFIX = 'mfk_'
const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex')

/* mfk_<28 base62/url-safe chars> — ~168 bits of entropy */
function generateKey() {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let out = ''
  for (let i = 0; i < 28; i++) out += alphabet[crypto.randomInt(alphabet.length)]
  return KEY_PREFIX + out
}

const publicView = (k) => ({
  id: String(k._id),
  name: k.name,
  prefix: k.prefix,
  createdAt: k.createdAt,
  lastUsedAt: k.lastUsedAt,
  revoked: k.revoked,
})

// ─── GET /api/mcp/keys — list my keys ───────────────────────────
router.get('/keys', protect, catchAsync(async (req, res) => {
  const keys = await MCPKey.find({ user: req.user._id }).sort({ createdAt: -1 }).lean()
  res.json({ success: true, data: keys.map(publicView) })
}))

// ─── POST /api/mcp/keys — create a key (returns plaintext once) ─
router.post('/keys', protect, catchAsync(async (req, res) => {
  const name = String(req.body?.name || 'My key').trim().slice(0, 40) || 'My key'

  const active = await MCPKey.countDocuments({ user: req.user._id, revoked: false })
  if (active >= MCPKey.MAX_ACTIVE_KEYS) {
    return res.status(400).json({
      success: false,
      message: `You already have ${active} active keys (max ${MCPKey.MAX_ACTIVE_KEYS}). Revoke or rotate one first.`,
    })
  }

  const key = generateKey()
  const doc = await MCPKey.create({
    user: req.user._id,
    name,
    keyHash: sha256(key),
    prefix: key.slice(0, 12),
  })

  res.status(201).json({
    success: true,
    data: { ...publicView(doc), key }, // plaintext — shown once, never stored
    message: 'Copy the key now — it will not be shown again.',
  })
}))

// ─── POST /api/mcp/keys/:id/rotate — new key, old one dies ──────
router.post('/keys/:id/rotate', protect, catchAsync(async (req, res) => {
  const old = await MCPKey.findOne({ _id: req.params.id, user: req.user._id })
  if (!old) throw new AppError('Key not found.', 404)
  if (old.revoked) throw new AppError('This key is already revoked — create a new one instead.', 400)

  const key = generateKey()
  const doc = await MCPKey.create({
    user: req.user._id,
    name: old.name,
    keyHash: sha256(key),
    prefix: key.slice(0, 12),
  })
  old.revoked = true
  await old.save()

  res.json({
    success: true,
    data: { ...publicView(doc), key },
    message: 'Key rotated. Update your clients with the new key — the old one is now dead.',
  })
}))

// ─── DELETE /api/mcp/keys/:id — revoke ──────────────────────────
router.delete('/keys/:id', protect, catchAsync(async (req, res) => {
  const doc = await MCPKey.findOne({ _id: req.params.id, user: req.user._id })
  if (!doc) throw new AppError('Key not found.', 404)
  doc.revoked = true
  await doc.save()
  res.json({ success: true, message: 'Key revoked — every call with it now fails.' })
}))

module.exports = router
