const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const ADMIN_EMAIL = 'princechouhan4606@gmail.com'

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false,
  },

  // ── Social Profile ─────────────────────────────
  bio: { type: String, default: '', maxlength: 200 },
  country: { type: String, default: '' },           // ISO 3166-1 alpha-2 e.g. 'IN', 'US'
  avatar: { type: String, default: '' },            // URL or emoji
  isPublic: { type: Boolean, default: false },      // public/private profile
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  // ── Badges (admin-assigned) ───────────────────
  badges: [{
    id: String,     // e.g. 'content_creator'
    label: String,  // e.g. 'Content Creator'
    emoji: String,  // e.g. '🎥'
    color: String,  // e.g. '#ff6b35'
    assignedAt: { type: Date, default: Date.now },
  }],

  // ── Admin flag ────────────────────────────────
  isAdmin: { type: Boolean, default: false },

  createdAt: { type: Date, default: Date.now },
})

// Auto-set admin
userSchema.pre('save', async function (next) {
  if (this.isModified('email') || this.isNew) {
    this.isAdmin = this.email === ADMIN_EMAIL
  }
  if (!this.isModified('password')) return next()
  this.password = await bcrypt.hash(this.password, 12)
  next()
})

userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password)
}

module.exports = mongoose.model('User', userSchema)
