/* ═══════════════════════════════════════════════════════════════
   Shared MCP connection snippets.

   One source of truth for the per-platform setup configs shown in
   the MCP modal (Settings / Coach) and the /docs/mcp guide page.
   `base` is this deployment's origin; `key` the account key
   (mfk_…) generated in Settings → MCP Server.
   ═══════════════════════════════════════════════════════════════ */

export function mcpConfigs(base = 'https://mindform.onrender.com', key = 'mfk_YOUR_KEY_HERE') {
  return {
    claude: {
      label: 'Claude Desktop',
      note: 'Claude Desktop connects to remote MCP servers through the mcp-remote bridge. Paste into Settings → Developer → Edit Config (claude_desktop_config.json), then fully restart Claude.',
      steps: ['Open Claude Desktop → Settings → Developer → Edit Config', 'Paste the JSON below into the "mcpServers" object', 'Fully quit Claude (⌘Q / tray quit) and reopen'],
      code: JSON.stringify({
        mcpServers: {
          mindform: {
            command: 'npx',
            args: ['-y', 'mcp-remote', `${base}/mcp`, '--header', `Authorization: Bearer ${key}`],
          },
        },
      }, null, 2),
    },
    cursor: {
      label: 'Cursor',
      note: 'Cursor speaks streamable HTTP natively. Save as .cursor/mcp.json in a project (or ~/.cursor/mcp.json globally), then reload — MindForm tools appear under MCP tools.',
      steps: ['File → Preferences → Cursor Settings → MCP', 'Or paste into .cursor/mcp.json manually', 'Reload the window; toggle the server ON'],
      code: JSON.stringify({
        mcpServers: {
          mindform: {
            url: `${base}/mcp`,
            headers: { Authorization: `Bearer ${key}` },
          },
        },
      }, null, 2),
    },
    codex: {
      label: 'Codex CLI',
      note: 'Add to ~/.codex/config.toml. Codex reads the key from your environment, so the secret never sits in the config file.',
      steps: ['Edit ~/.codex/config.toml', 'Add the [mcp_servers.mindform] block below', 'Export MINDFORM_MCP_KEY in your shell profile, then run codex'],
      code: [
        '[mcp_servers.mindform]',
        `url = "${base}/mcp"`,
        'bearer_token_env_var = "MINDFORM_MCP_KEY"',
        '',
        '# Then expose the key once, e.g. in ~/.zshrc or ~/.bashrc:',
        `# export MINDFORM_MCP_KEY="${key}"`,
      ].join('\n'),
    },
    antigravity: {
      label: 'Antigravity',
      note: 'In Antigravity, open the agent panel → MCP → Manage MCP servers → Add manually, and paste this JSON. The tools become available to every agent in the workspace.',
      steps: ['Open the agent panel → MCP → Manage MCP servers', 'Choose "Add manually" and paste the JSON', 'Restart the agent session'],
      code: JSON.stringify({
        mcpServers: {
          mindform: {
            url: `${base}/mcp`,
            headers: { Authorization: `Bearer ${key}` },
          },
        },
      }, null, 2),
    },
    generic: {
      label: 'Any MCP client (generic HTTP)',
      note: 'MindForm exposes Model Context Protocol over streamable HTTP in JSON mode: POST JSON-RPC 2.0 to /mcp with your key as a Bearer token. Works with any MCP-compatible agent, script or gateway.',
      steps: ['Point any streamable-HTTP MCP client at the /mcp URL', 'Send Authorization: Bearer mfk_… on every request', 'Handshake with initialize, then tools/list'],
      code: [
        '# 1) Handshake',
        `curl -s ${base}/mcp \\`,
        `  -H "Authorization: Bearer ${key}" \\`,
        '  -H "Content-Type: application/json" \\',
        '  -d \'{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"my-client","version":"1.0"}}}\'',
        '',
        '# 2) List the 13 tools',
        `curl -s ${base}/mcp \\`,
        `  -H "Authorization: Bearer ${key}" \\`,
        '  -H "Content-Type: application/json" \\',
        '  -d \'{"jsonrpc":"2.0","id":2,"method":"tools/list"}\'',
        '',
        '# 3) Call one — e.g. add a task to this week',
        `curl -s ${base}/mcp \\`,
        `  -H "Authorization: Bearer ${key}" \\`,
        '  -H "Content-Type: application/json" \\',
        '  -d \'{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"create_task","arguments":{"title":"Deep work (09:00)"}}}\'',
      ].join('\n'),
    },
    bridge: {
      label: 'Self-hosted stdio bridge',
      note: 'Self-hosting the backend? The bundled stdio bridge talks to your own deployment over HTTP — no database URL or JWT secret needed, just an account key.',
      steps: ['Clone the repo on the machine running your MCP client', 'Point MF_API_URL at your deployment', 'Register the command config below'],
      code: JSON.stringify({
        mcpServers: {
          mindform: {
            command: 'node',
            args: ['/absolute/path/to/MindForm/backend/src/mcp/server.js'],
            env: {
              MF_API_URL: base,
              MF_KEY: key,
            },
          },
        },
      }, null, 2),
    },
  }
}

export const PLATFORM_ORDER = ['claude', 'cursor', 'codex', 'antigravity', 'generic', 'bridge']
