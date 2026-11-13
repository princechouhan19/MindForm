# MindForm MCP server

A Model Context Protocol server that lets MCP clients — Claude Desktop, Cursor, Codex CLI, Antigravity and any MCP-capable agent — read and edit **your** MindForm tasks, habits and goals with plain tool calls. It is the same capability Coach uses in the app, exposed over the open protocol.

Two transports ship:

| Transport | Where | Who it's for |
| --- | --- | --- |
| **HTTP** (`POST /mcp`) | the backend you already run (`src/mcp/http.js`) | Claude Desktop (via `mcp-remote`), Cursor, Codex CLI, Antigravity, generic clients |
| **stdio bridge** (`src/mcp/server.js`) | your machine, talking to the HTTP endpoint | clients that only support stdio, or self-hosters who prefer it |

## Auth: account keys, not JWTs

Every account can issue its own **MCP keys** (`mfk_…`) from the web app: **Settings → MCP Server** (or Coach → Settings → MCP server → Setup).

- Create a key, give it a name, copy it **once** — the server stores only a SHA-256 hash.
- Up to 5 active keys per account (one per machine/client).
- Rotate or revoke at any time; revocation is instant.
- Keys authenticate **only** the `/mcp` endpoint — never the web app or REST API.

There is no JWT anywhere in the MCP flow. No `JWT_SECRET`, no database URL in client configs — a key plus the server URL is enough.

## Tools (13)

| Tool | What it does |
| --- | --- |
| `list_tasks` | This week's tasks with check-off state |
| `create_task` | Add a task to the current week |
| `delete_task` | Remove a task by exact title |
| `list_habits` | This month's habits with completion counts |
| `create_habit` | Add a habit (name, emoji, optional time) |
| `update_habit` | Rename/reschedule a habit |
| `delete_habit` | Remove a habit by exact name |
| `check_habit` | Toggle today's check-in |
| `list_goals` | All goals with status/category/deadline |
| `create_goal` | Create a goal (deadline required, `YYYY-MM-DD`) |
| `complete_goal` | Mark a goal completed by exact title |
| `delete_goal` | Delete a goal by exact title |
| `get_overview` | Streak, aura, level, goal counters and this week's progress in one call |

Every call is scoped to the user encoded in the key — there is no cross-user access.

## Setup (hosted)

1. Log into MindForm → **Settings → MCP Server** → **Create key**.
2. Pick your platform below (full guides with copyable snippets live at `/docs/mcp`):

**Claude Desktop** (`claude_desktop_config.json` — uses the mcp-remote bridge):

```json
{
  "mcpServers": {
    "mindform": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://mindform.onrender.com/mcp", "--header", "Authorization: Bearer mfk_YOUR_KEY"]
    }
  }
}
```

**Cursor** (`.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "mindform": {
      "url": "https://mindform.onrender.com/mcp",
      "headers": { "Authorization": "Bearer mfk_YOUR_KEY" }
    }
  }
}
```

**Codex CLI** (`~/.codex/config.toml`):

```toml
[mcp_servers.mindform]
url = "https://mindform.onrender.com/mcp"
bearer_token_env_var = "MINDFORM_MCP_KEY"

# then: export MINDFORM_MCP_KEY=mfk_YOUR_KEY
```

**Antigravity** (agent panel → MCP → Add manually): same JSON shape as Cursor — `url` + `headers.Authorization`.

3. Restart the client. You should see 13 `mindform` tools.

## Self-hosting

Point every snippet at your own origin instead of `mindform.onrender.com`. For stdio-only clients run the bundled bridge:

```bash
MF_API_URL=https://your-deployment.example.com \
MF_KEY=mfk_YOUR_KEY \
node backend/src/mcp/server.js
```

The bridge is dependency-free and relays JSON-RPC to the HTTP endpoint — the tool logic lives in one place (`src/mcp/tools.js`).

## HTTP endpoint details

- `POST /mcp` — JSON-RPC 2.0 (single message or batch) in, JSON-RPC response out; notifications return `202`.
- `GET /mcp` — `405` (JSON mode only, no SSE stream).
- Auth: `Authorization: Bearer mfk_…` (also accepts `x-mcp-key` header).
- Rate limited (300 requests / 15 min / IP).
- Writes mirror exactly what the equivalent in-app action would write.
