const mongoose = require('mongoose')

// Voice Coach — practice session log.
// NOTE: audio/video recordings are NEVER uploaded; only session metadata
// (exercise id, plan duration, timestamps) is persisted.
const voiceLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  sessions: {
    type: [
      {
        // exercise id, e.g. 'breathe' | 'hum' | 'neck' | 'twister' | 'read' | 'camera'
        ex: { type: String, default: 'unknown' },
        // plan the session came from: 15 | 30 | 60 (minutes)
        plan: { type: Number, default: 15 },
        // minutes actually practiced
        min: { type: Number, default: 0 },
        at: { type: Date, default: Date.now },
      },
    ],
    default: [],
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
