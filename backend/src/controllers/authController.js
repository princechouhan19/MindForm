const jwt = require('jsonwebtoken')
const User = require('../models/User')
const { validateRegistration } = require('../utils/emailValidator')

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' })

const sendToken = (user, statusCode, res) => {
  const token = signToken(user._id)
  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      createdAt: user.createdAt,
    },
  })
}

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body

    // ── Basic presence check ─────────────────────────────────────────────────
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email and password.' })
    }

    // ── Anti-fake validation (disposable mail, fake names, bad TLDs) ─────────
    const { valid, errors } = validateRegistration({ name, email })
    if (!valid) {
      return res.status(400).json({
        success: false,
        message: errors[0],  // show first error to keep UX clean
        blocked: true,       // frontend can detect this flag
      })
    }

    // ── Password strength (min 8 chars, at least one number or special) ──────
    const pwStrong = /^(?=.*[a-zA-Z])(?=.*[\d\W]).{8,}$/.test(password)
    if (!pwStrong) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters and include letters plus a number or symbol.',
      })
    }

    // ── Duplicate email ───────────────────────────────────────────────────────
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() })
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered.' })
    }

    const user = await User.create({ name: name.trim(), email: email.toLowerCase().trim(), password })
    sendToken(user, 201, res)
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message)
      return res.status(400).json({ success: false, message: messages.join('. ') })
    }
    res.status(500).json({ success: false, message: 'Server error during registration.' })
  }
}

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password.' })
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password')
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' })
    }

    sendToken(user, 200, res)
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error during login.' })
  }
}

// GET /api/auth/me
const getMe = async (req, res) => {
  res.status(200).json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      isAdmin: req.user.isAdmin,
      createdAt: req.user.createdAt,
    },
  })
}

module.exports = { register, login, getMe }
