const crypto = require('crypto')
const express = require('express')
const rateLimit = require('express-rate-limit')
const MCPKey = require('../models/MCPKey')
const User = require('../models/User')
const { TOOLS } = require('./tools')

/* ═══════════════════════════════════════════════════════════════
   MindForm MCP server over HTTP (streamable HTTP, JSON mode).

   POST /mcp  — JSON-RPC 2.0 request(s) in, JSON-RPC response out.
   GET  /mcp  — 405 (this deployment speaks JSON mode, no SSE).
   Auth       — `Authorization: Bearer mfk_…` (or `x-mcp-key`).
                NO JWT. Keys are per-account, hashed at rest and
                revocable instantly (Settings → MCP Server).

   Methods: initialize · notifications/* · ping · tools/list ·
            tools/call  (13 tools, see ./tools.js)
   ═══════════════════════════════════════════════════════════════ */

const PROTOCOL_VERSION = '2025-03-26'
const SUPPORTED_VERSIONS = ['2025-03-26', '2024-11-05']

const mcpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { jsonrpc: '2.0', error: { code: -32000, message: 'Too many MCP requests — slow down.' } },
})

/* Key material helpers */
const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex')
function extractKey(req) {
  const h = req.headers.authorization || ''
  if (h.startsWith('Bearer ')) return h.slice(7).trim()
  if (req.headers['x-mcp-key']) return String(req.headers['x-mcp-key']).trim()
  if (req.query && req.query.key) return String(req.query.key).trim()
  return ''
}

/* Resolve an MCP key to its user. Throws { status, message } on failure. */
async function authenticate(req) {
  const presented = extractKey(req)
  if (!presented) {
    throw { status: 401, message: 'Missing MCP key. Send "Authorization: Bearer mfk_…" (create one in MindForm → Settings → MCP Server).' }
  }
  const keyDoc = await MCPKey.findOne({ keyHash: sha256(presented) })
  if (!keyDoc) throw { status: 401, message: 'Invalid MCP key.' }
  if (keyDoc.revoked) throw { status: 401, message: 'This MCP key has been revoked. Create a new one in MindForm → Settings → MCP Server.' }
  const user = await User.findById(keyDoc.user).lean()
  if (!user) throw { status: 401, message: 'The account for this MCP key no longer exists.' }
  // Fire-and-forget usage stamp
  MCPKey.updateOne({ _id: keyDoc._id }, { $set: { lastUsedAt: new Date() } }).catch(() => {})
  return user
}

/* JSON-RPC plumbing */
const rpcOk = (result, id) => ({ jsonrpc: '2.0', id, result })
const rpcErr = (code, message, id = null) => ({ jsonrpc: '2.0', id, error: { code, message } })

async function dispatch(msg, user) {
  const { id, method, params } = msg || {}
  try {
    switch (method) {
      case 'initialize':
        return rpcOk({
          protocolVersion: SUPPORTED_VERSIONS.includes(params?.protocolVersion) ? params.protocolVersion : PROTOCOL_VERSION,
          capabilities: { tools: {} },
          serverInfo: { name: 'mindform', title: 'MindForm', version: '2.0.0' },
          instructions: 'MindForm tools read and edit the authenticated user’s tasks, habits and goals. Tasks write to the current week; habits to the current month.',
        }, id)
      case 'notifications/initialized':
      case 'notifications/cancelled':
      case 'notifications/roots/list_changed':
        return null // notifications get no response
      case 'ping':
        return rpcOk({}, id)
      case 'tools/list':
        return rpcOk({ tools: TOOLS.map(t => ({ name: t.name, description: t.description, inputSchema: t.inputSchema })) }, id)
      case 'tools/call': {
        const name = params?.name
        const tool = TOOLS.find(t => t.name === name)
        if (!tool) return rpcErr(-32602, `Unknown tool: ${name}`, id)
        const args = params?.arguments || {}
        const result = await tool.run(user._id, args)
        return rpcOk({ content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }, id)
      }
      case 'resources/list':
      case 'prompts/list':
        // Declared capability: none — empty lists keep picky clients happy
        return rpcOk(method === 'resources/list' ? { resources: [] } : { prompts: [] }, id)
      default:
        return id !== undefined ? rpcErr(-32601, `Method not found: ${method}`, id) : null
    }
  } catch (e) {
    console.error('[mindform-mcp] tool error:', e?.message || e)
    return id !== undefined ? rpcErr(-32603, 'Internal error executing the request.', id) : null
  }
}

const router = express.Router()

router.use(mcpLimiter)

router.post('/', express.json({ limit: '256kb' }), async (req, res) => {
  let user
  try {
    user = await authenticate(req)
  } catch (authErr) {
    const status = authErr?.status || 401
    return res.status(status).json(rpcErr(-32001, authErr?.message || 'Unauthorized MCP key.', null))
  }

  const body = req.body
  if (!body || typeof body !== 'object') {
    return res.status(400).json(rpcErr(-32700, 'Parse error: body must be a JSON-RPC 2.0 object or batch.', null))
  }

  const messages = Array.isArray(body) ? body : [body]
  const out = []
  for (const m of messages) {
    if (!m || typeof m !== 'object' || !m.method) {
      if (m && m.id !== undefined) out.push(rpcErr(-32600, 'Invalid Request.', m.id))
      continue
    }
    const result = await dispatch(m, user)
    if (result) out.push(result)
  }

  if (!out.length) return res.status(202).json({ jsonrpc: '2.0', result: null, id: null })
  return res.status(200).json(Array.isArray(body) ? out : out[0])
})

router.get('/', (req, res) => {
  res.set('Allow', 'POST')
  res.status(405).json({ error: 'MindForm MCP speaks JSON mode — POST JSON-RPC 2.0 to /mcp with an Authorization: Bearer mfk_… key.' })
})
router.delete('/', (req, res) => {
  res.set('Allow', 'POST')
  res.status(405).json({ error: 'Stateless server: no session to terminate.' })
})

module.exports = router
