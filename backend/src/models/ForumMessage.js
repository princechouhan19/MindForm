const mongoose = require('mongoose')

const ForumMessageSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true, maxlength: 1000 },
  createdAt: { type: Date, default: Date.now, index: { expireAfterSeconds: 172800 } }, // TTL: 2 days
})

// TTL index: auto-delete after 2 days (172800 s)
ForumMessageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 172800 })

module.exports = mongoose.model('ForumMessage', ForumMessageSchema)
