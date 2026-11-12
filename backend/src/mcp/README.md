# MindForm MCP server

A Model Context Protocol (stdio) server that lets MCP clients — Claude Desktop, Cursor, Windsurf, … — read and edit the signed-in user's MindForm data with plain tool calls. It is the same capability Coach uses in the app, exposed over the open protocol.

## Tools

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

Every call is scoped to the user encoded in the token — there is no cross-user access.

## Setup

1. Log into MindForm in the browser and copy your JWT from DevTools → Application → Local Storage → `mf_token`.
2. Register the server in your MCP client. Example for Claude Desktop (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "mindform": {
      "command": "node",
      "args": ["/absolute/path/to/Mindform/backend/src/mcp/server.js"],
      "env": {
        "MF_URI": "mongodb://127.0.0.1:27017/mindform",
        "MF_TOKEN": "<your JWT>",
        "JWT_SECRET": "<your backend JWT_SECRET>"
      }
    }
  }
}
```

3. Restart the client. You should see 12 `mindform` tools.

## Notes

- `JWT_SECRET` must match the backend's secret (default: `mindform_dev_secret_change_me` — set a real one in production).
- Tokens expire (7 days by default); refresh `MF_TOKEN` when it does.
- The server speaks newline-delimited JSON-RPC 2.0 on stdio and implements `initialize`, `tools/list` and `tools/call` — no external MCP SDK required.
