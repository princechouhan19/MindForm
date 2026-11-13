#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════
   MindForm MCP stdio bridge.

   Forwards MCP JSON-RPC 2.0 messages between a local stdio client
   (Claude Desktop, Cursor, Codex, Antigravity, …) and the MindForm
   HTTP MCP endpoint (backend/src/mcp/http.js) using a per-account
   key — no JWT, no database URL, no JWT secret.

   Run:
     MF_API_URL=https://mindform.onrender.com \
     MF_KEY=mfk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx \
     node src/mcp/server.js

   Environment:
     MF_API_URL  base URL of your MindForm deployment
                 (default: https://mindform.onrender.com)
     MF_KEY      account key from Settings → MCP Server (mfk_…)

   The HTTP endpoint hosts the 13 tools; this bridge is a thin,
   dependency-free relay. Replace MF_API_URL with your own origin
   when self-hosting.
   ═══════════════════════════════════════════════════════════════ */

function loadBackendEnv() {
  try {
    const fs = require('fs')
    const path = require('path')
    const envPath = path.join(__dirname, '../../.env')
    for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
      if (m && process.env[m[1]] === undefined) {
        process.env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim()
      }
    }
  } catch { /* no .env — fine */ }
}
loadBackendEnv()

const API_URL = (process.env.MF_API_URL || 'https://mindform.onrender.com').replace(/\/+$/, '')
const MF_KEY = process.env.MF_KEY || process.argv.find(a => a.startsWith('--key='))?.slice(6)

if (!MF_KEY) {
  console.error('[mindform-mcp] MF_KEY is required — create an account key in MindForm → Settings → MCP Server.')
  console.error('[mindform-mcp] Usage: MF_API_URL=<base> MF_KEY=mfk_… node src/mcp/server.js')
  process.exit(1)
}

if (process.env.MF_TOKEN) {
  console.error('[mindform-mcp] MF_TOKEN (JWT) is no longer needed — use MF_KEY from Settings → MCP Server instead.')
}

const ENDPOINT = `${API_URL}/mcp`
const NAME = '[mindform-mcp]'

async function forward(msg) {
  let res
  try {
    res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MF_KEY}`,
      },
      body: JSON.stringify(msg),
    })
  } catch (e) {
    console.error(`${NAME} network error: ${e.message} (endpoint: ${ENDPOINT})`)
    return null
  }

  if (res.status === 202) return null // notification accepted
  let body = null
  try { body = await res.json() } catch { body = null }
  if (!res.ok) {
    const errMsg = body?.error?.message || `HTTP ${res.status}`
    if (msg && msg.id !== undefined) {
      return { jsonrpc: '2.0', id: msg.id, error: { code: -32001, message: errMsg } }
    }
    console.error(`${NAME} request failed: ${errMsg}`)
    return null
  }
  return body
}

let buffer = ''
let inflight = 0
let stdinEnded = false

const maybeExit = () => { if (stdinEnded && inflight === 0) process.exit(0) }

process.stdin.setEncoding('utf8')
process.stdin.on('data', chunk => {
  buffer += chunk
  let idx
  while ((idx = buffer.indexOf('\n')) >= 0) {
    const line = buffer.slice(0, idx).trim()
    buffer = buffer.slice(idx + 1)
    if (!line) continue
    let msg
    try { msg = JSON.parse(line) } catch { continue }
    inflight++
    forward(msg)
      .then(reply => {
        if (reply) process.stdout.write(JSON.stringify(reply) + '\n')
      })
      .catch(() => { /* keep the bridge alive */ })
      .finally(() => {
        inflight--
        maybeExit()
      })
  }
})

process.stdin.on('end', () => { stdinEnded = true; maybeExit() })
process.on('SIGINT', () => process.exit(0))
process.on('SIGTERM', () => process.exit(0))

console.error(`${NAME} bridge ready → ${ENDPOINT} (key ${MF_KEY.slice(0, 12)}…)`)
