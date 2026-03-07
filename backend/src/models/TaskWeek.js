const mongoose = require('mongoose')

// Stores the entire week's data as a flexible document
const taskWeekSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  // Key format: "2025-0-w1" (year-monthIndex-weekNum)
  weekKey: {
    type: String,
    required: true,
  },
  tasks: {
    type: [String],
    default: [],
  },
  // checkboxes stored as: { "1-Wake up at 06:00": true, ... }
  checks: {
    type: Map,
    of: Boolean,
    default: {},
  },
  reflection: {
    win: { type: String, default: '' },
    slow: { type: String, default: '' },
    focus: { type: String, default: '' },
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
})

taskWeekSchema.index({ user: 1, weekKey: 1 }, { unique: true })

taskWeekSchema.pre('save', function (next) {
  this.updatedAt = Date.now()
  next()
})

module.exports = mongoose.model('TaskWeek', taskWeekSchema)
