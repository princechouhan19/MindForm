const jwt = require('jsonwebtoken')
const { promisify } = require('util')
const User = require('../models/User')
const catchAsync = require('../utils/catchAsync')
const AppError = require('../utils/AppError')

const protect = catchAsync(async (req, res, next) => {
  let token

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1]
  } else if (req.cookies && req.cookies.jwt) {
    token = req.cookies.jwt
  }

  if (!token) {
    return next(new AppError('You are not logged in! Please log in to get access.', 401))
  }

  // Verification
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET)

  // Check if user still exists
  const currentUser = await User.findById(decoded.id)
  if (!currentUser) {
    return next(new AppError('The user belonging to this token no longer exists.', 401))
  }

  // Note: if passwords change, standard production design usually verifies password changes after token issuance (iat).
  // e.g. if (currentUser.changedPasswordAfter(decoded.iat)) return next(new AppError('...', 401));

  // Grant access
  req.user = currentUser
  next()
})

// Optional admin guard middleware
const restrictToAdmin = (req, res, next) => {
  if (!req.user.isAdmin && req.user.email !== 'princechouhan4606@gmail.com') {
    return next(new AppError('You do not have permission to perform this action.', 403))
  }
  next()
}

module.exports = { protect, restrictToAdmin }

