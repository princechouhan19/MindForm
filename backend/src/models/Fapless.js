const mongoose = require('mongoose')

const RelapseSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  reason: { type: String, default: '' },
  trigger: { type: String, default: '' },   // structured trigger chip (HALT etc.)
  dayCount: { type: Number, default: 0 },
}, { _id: false })

// Urge log — CBT urge-surfing records. Every logged urge (resisted or not)
// is data; resisted urges earn aura (mastery experiences build self-efficacy).
const UrgeLogSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  trigger: { type: String, default: '' },          // HALT / context chip
  intensityBefore: { type: Number, min: 0, max: 10, default: 5 },
  intensityAfter: { type: Number, min: 0, max: 10, default: 0 },
  strategy: { type: String, default: '' },         // surf / breathe / move / connect
  resisted: { type: Boolean, default: true },
}, { _id: false })

const FaplessSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  startDate: { type: Date, default: null },   // when current streak started
  totalAura: { type: Number, default: 0 },    // cumulative aura points earned ever
  relapses: { type: [RelapseSchema], default: [] },
  urgeLogs: { type: [UrgeLogSchema], default: [] },   // every resisted or logged urge
  activeChallenge: { type: String, default: '' }, // 'NNN', '30day', '90day', etc.
  notes: { type: String, default: '' },
}, { timestamps: true })

module.exports = mongoose.model('Fapless', FaplessSchema)
