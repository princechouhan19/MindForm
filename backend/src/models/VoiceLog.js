const mongoose = require('mongoose')

/* Speak module — communication & voice practice log.
   One document per user; sessions capped at 500 entries (trimmed on write). */
const sessionSchema = new mongoose.Schema({
  date:       { type: String, required: true },  // YYYY-MM-DD
  ts:         { type: Number, required: true },  // epoch ms
  planId:     { type: String, enum: ['15', '30', '60'], required: true },
  planMinutes:{ type: Number, min: 1, max: 120, required: true },
  minutes:    { type: Number, min: 1, max: 180, required: true },
  stepsDone:  { type: Number, min: 0, max: 20, default: 0 },
  totalSteps: { type: Number, min: 0, max: 20, default: 0 },
}, { _id: false })

const voiceLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  sessions: {
    type: [sessionSchema],
    default: [],
  },
  weeklyGoalMinutes: {
    type: Number,
    min: 0,
    max: 2000,
    default: 60,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
})

voiceLogSchema.index({ user: 1 }, { unique: true })

voiceLogSchema.pre('save', function (next) {
  this.updatedAt = Date.now()
  next()
})

module.exports = mongoose.model('VoiceLog', voiceLogSchema)
