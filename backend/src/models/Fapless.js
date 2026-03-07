const mongoose = require('mongoose')

const RelapseSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  reason: { type: String, default: '' },
  dayCount: { type: Number, default: 0 },
}, { _id: false })

const FaplessSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  startDate: { type: Date, default: null },   // when current streak started
  totalAura: { type: Number, default: 0 },    // cumulative aura points earned ever
  relapses: { type: [RelapseSchema], default: [] },
  activeChallenge: { type: String, default: '' }, // 'NNN', '30day', '90day', etc.
  notes: { type: String, default: '' },
}, { timestamps: true })

module.exports = mongoose.model('Fapless', FaplessSchema)
