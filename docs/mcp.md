# MindForm MCP server — engineering guide

User-facing setup lives at `/docs/mcp` in the app (mirrored from
`frontend/src/lib/mcp-configs.js`). This document is for working **on** the
server itself.

## Files

| File | Role |
| :--- | :--- |
| `backend/src/mcp/tools.js` | the 13 tools — pure, userId-scoped implementations |
| `backend/src/mcp/http.js` | HTTP transport: key auth + JSON-RPC dispatch |
| `backend/src/mcp/server.js` | stdio bridge (forwards to the HTTP endpoint) |
| `backend/src/routes/mcp.js` | JWT-protected key management API |
| `backend/src/models/MCPKey.js` | key model (sha256 hash + prefix + revoked) |
| `frontend/src/components/MCPModal.jsx` | key UI + platform tabs (Settings & Coach) |
| `frontend/src/views/DocsView.jsx` | `/docs/mcp` content |

## Transport contract

`POST /mcp` (JSON-RPC 2.0):

- `initialize` → echo negotiated `protocolVersion` (`2025-03-26` / `2024-11-05`),
  capabilities `{ tools }`, serverInfo `mindform 2.0.0`, instructions string.
- `notifications/*` → no response (HTTP `202`).
- `ping` → `{}`.
- `tools/list` → 13 tool descriptors with JSON-Schema `inputSchema`.
- `tools/call` → `{ content: [{ type: 'text', text: JSON.stringify(result) }] }`.
- Unknown method → `-32601`; unknown tool → `-32602`; tool throw → `-32603`.
- Batches (arrays) are supported; invalid request → `-32600`; parse error → `-32700`.
- `GET/DELETE /mcp` → `405` with `Allow: POST`.

Auth (`authenticate` in http.js):

1. Extract key: `Authorization: Bearer` → `x-mcp-key` → `?key=`.
2. `sha256(presented)` exact-match against `MCPKey.keyHash` (unique index).
3. Reject revoked (`401`) and deleted-user (`401`).
4. Stamp `lastUsedAt` (fire-and-forget).

Rate limit: 300 req / 15 min / IP (`mcpLimiter`).

## Tool list (13)

Tasks: `list_tasks`, `create_task`, `delete_task` ·
Habits: `list_habits`, `create_habit`, `update_habit`, `delete_habit`, `check_habit` ·
Goals: `list_goals`, `create_goal` (deadline `YYYY-MM-DD` required),
`complete_goal`, `delete_goal` · Stats: `get_overview`.

Writes use the same bucket math as the app (current week/month keys) — see
`docs/system-design.md` for the canonical algorithm. Keep `tools.js` and
`CoachView.jsx`'s `applyCoachAction` aligned when changing storage shapes.

## Key management API (browser-side)

| Endpoint | Behaviour |
| :--- | :--- |
| `GET /api/mcp/keys` | list own keys (metadata only) |
| `POST /api/mcp/keys {name}` | create — cap 5 active — returns plaintext **once** |
| `POST /api/mcp/keys/:id/rotate` | revoke old + create new, returns plaintext once |
| `DELETE /api/mcp/keys/:id` | revoke (soft) |

Key format: `mfk_` + 28 chars from a 62-symbol alphabet (crypto.randomInt),
≈168 bits. Prefix (first 12 chars) is stored for display.

## Stdio bridge

`node src/mcp/server.js` with `MF_API_URL` (default the hosted app) and
`MF_KEY`. Implementation notes:

- Reads newline-delimited JSON-RPC from stdin, forwards each message via
  `fetch`, relays responses to stdout; notifications wait for `202` and print
  nothing.
- Exit logic: stdin `end` **and** zero in-flight requests → `process.exit(0)`
  (an early-exit race here once dropped trailing responses — the inflight
  counter guards it; keep it).
- `.env` fallback loading only fills *unset* variables.

## Testing changes

```bash
# 1) key management (JWT)
curl -X POST localhost:5000/api/mcp/keys -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' -d '{"name":"dev"}'

# 2) endpoint (key)
curl -X POST localhost:5000/mcp -H "Authorization: Bearer mfk_…" \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'

# 3) bridge
printf '{"jsonrpc":"2.0","id":1,"method":"tools/list"}\n' \
  | MF_API_URL=http://localhost:5000 MF_KEY=mfk_… node src/mcp/server.js
```

Manual pass: initialize → tools/list → create_task → list_tasks → revoke key →
expect `Invalid MCP key.` on the next call.
