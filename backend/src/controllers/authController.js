const jwt = require('jsonwebtoken')
const User = require('../models/User')
const { validateRegistration } = require('../utils/emailValidator')
const catchAsync = require('../utils/catchAsync')
const AppError = require('../utils/AppError')

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' })

const sendToken = (user, statusCode, res) => {
  const token = signToken(user._id)
  
  // High-level design: Use HTTP Only cookies for JWT alongside token in payload (optional for frontend fallback)
  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  }
  res.cookie('jwt', token, cookieOptions)

  res.status(statusCode).json({
    status: 'success',
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
const register = catchAsync(async (req, res, next) => {
  const { name, email, password } = req.body

  if (!name || !email || !password) {
    return next(new AppError('Please provide name, email and password.', 400))
  }

  const { valid, errors } = validateRegistration({ name, email })
  if (!valid) {
    return next(new AppError(errors[0], 400))
  }

  const pwStrong = /^(?=.*[a-zA-Z])(?=.*[\d\W]).{8,}$/.test(password)
  if (!pwStrong) {
    return next(new AppError('Password must be at least 8 characters and include letters plus a number or symbol.', 400))
  }

  const existingUser = await User.findOne({ email: email.toLowerCase().trim() })
  if (existingUser) {
    return next(new AppError('Email already registered.', 400))
  }

  const user = await User.create({ name: name.trim(), email: email.toLowerCase().trim(), password })
  sendToken(user, 201, res)
})

// POST /api/auth/login
const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body

  if (!email || !password) {
    return next(new AppError('Please provide email and password.', 400))
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password')
  if (!user || !(await user.comparePassword(password))) {
    return next(new AppError('Invalid email or password.', 401))
  }

  sendToken(user, 200, res)
})

// GET /api/auth/me
const getMe = catchAsync(async (req, res, next) => {
  res.status(200).json({
    status: 'success',
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      isAdmin: req.user.isAdmin,
      createdAt: req.user.createdAt,
    },
  })
})

module.exports = { register, login, getMe }
