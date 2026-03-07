const mongoose = require('mongoose')

const habitMonthSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  // Key format: "2025-0" (year-monthIndex)
  monthKey: {
    type: String,
    required: true,
  },
  habits: {
    type: [
      {
        name: { type: String, required: true },
        emoji: { type: String, default: '✨' },
      },
    ],
    default: [],
  },
  // checkboxes: { "1-Wake up at 06:00": true, ... }
  checks: {
    type: Map,
    of: Boolean,
    default: {},
  },
  // mental state: { "1-mood": 8, "1-motivation": 7, ... }
  mental: {
    type: Map,
    of: Number,
    default: {},
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
})

habitMonthSchema.index({ user: 1, monthKey: 1 }, { unique: true })

habitMonthSchema.pre('save', function (next) {
  this.updatedAt = Date.now()
  next()
})

module.exports = mongoose.model('HabitMonth', habitMonthSchema)
