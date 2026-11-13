const mongoose = require('mongoose')

/* ═══════════════════════════════════════════════════════════════
   MCPKey — per-account access keys for the MindForm MCP server.

   Design: no JWT for MCP. Each account issues long random keys
   (mfk_…). The server stores ONLY a SHA-256 hash — a database leak
   can never reveal a usable key. `prefix` (first 12 chars) is kept
   for display so users can tell keys apart.

   Keys authenticate ONLY the /mcp endpoint — they never grant
   login to the web app or the REST API.
   ═══════════════════════════════════════════════════════════════ */

const MAX_ACTIVE_KEYS_PER_USER = 5

const mcpKeySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, default: 'My key', trim: true, maxlength: 40 },
  keyHash: { type: String, required: true, unique: true, index: true },
  prefix: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  lastUsedAt: { type: Date, default: null },
  revoked: { type: Boolean, default: false },
})

mcpKeySchema.statics.MAX_ACTIVE_KEYS = MAX_ACTIVE_KEYS_PER_USER

module.exports = mongoose.model('MCPKey', mcpKeySchema)
