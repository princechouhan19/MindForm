<p align="center">
  <img src="logo.png" width="110" alt="MindForm" />
</p>

<h1 align="center">MindForm</h1>

<p align="center">
  <strong>The Apple-grade productivity suite — tasks, habits, goals, discipline streaks,<br/>voice training, an AI Coach and an MCP server, in one private workspace.</strong>
</p>

<p align="center">
  <a href="https://mindform.onrender.com/"><strong>🚀 Live app</strong></a> ·
  <a href="#-module-tour">Module tour</a> ·
  <a href="#-ai-coach">AI Coach</a> ·
  <a href="#-mcp-server">MCP server</a> ·
  <a href="docs/">Documentation</a> ·
  <a href="#-license">License</a>
</p>

<p align="center">
  <img alt="platform" src="https://img.shields.io/badge/platform-web%20%7C%20PWA-0a84ff" />
  <img alt="stack" src="https://img.shields.io/badge/stack-React%2018%20·%20Node.js%20·%20MongoDB-30d158" />
  <img alt="license" src="https://img.shields.io/badge/license-proprietary-f59e0b" />
  <img alt="version" src="https://img.shields.io/badge/version-3.1-8e8e93" />
</p>

> **MindForm is not open source.** The web app is free to use, but the codebase is
> proprietary — see [LICENSE.md](LICENSE.md). This repository is private; it exists
> for the MindForm team and deployment infrastructure.

---

## Why MindForm

Most productivity apps track *something*. MindForm connects everything: minute-level
tasks feed a 30-day habit matrix, habits and tasks drive goal progress automatically,
and a discipline streak engine wraps the whole day in real stakes. On top sits **Coach**
— an AI copilot that reads your plan and proposes concrete edits, and an **MCP server**
that plugs your account into Claude, Cursor, Codex and Antigravity.

- **One system, not five apps** — plan, track, progress and discipline in a single account.
- **Apple design language throughout** — SF-style type ramp, iOS system colors, 8-pt grid,
  inset grouped lists, keynote-grade motion, WCAG-AA contrast in dark and light themes.
- **Private by architecture** — data scoped to your user ID; AI keys never leave your
  browser; chat history auto-deletes every 24 h; forum messages every 48 h.
- **Fast** — route-level code splitting (the landing page ships ~22 kB gzip of app JS),
  compression, rate limiting, an aggregate `/stats/summary` endpoint for one-round-trip
  dashboards.

## Module tour

| Module | What it does |
| :--- | :--- |
| **Today** | Greeting, progress rings, streak & goal cards, one-tap module jumps — the whole day at a glance. |
| **Task Tracker** | Minute-level weekly planner with day-by-day check-offs, Week Score, next-task countdown, insights and CSV export. |
| **Habit Tracker** | 30-day matrix, streaks, mood + motivation (1–10) next to every check-in, completion charts, CSV export. |
| **Goals** | Career / health / personal / general goals with deadlines; progress computes itself from linked tasks and habits. |
| **Fapless** | Discipline streak engine — ten identity levels (Novice → Legend), milestone bonuses, 30/90-day protocols, urge SOS panel, relapse log with reasons. |
| **Speak** | Voice & communication training: 15/30/60-minute guided sessions — 4–2–6 diaphragm breathing, SOVT hums, neck release, tongue-twister ladders, style-shifting read-alouds, on-camera PREP studio (recording never leaves the device). |
| **Social** | Opt-in public profiles, global streak leaderboard, follow system, forum with 48-hour auto-deletion. |
| **Coach** | The AI layer — see below. |
| **MCP Server** | Your account, inside your AI tools — see below. |

<p align="center">
  <img src="screenshots/after/Landing-Top.png" alt="MindForm landing" width="640" />
</p>
<p align="center">
  <img src="screenshots/after/Coach-Proposals.png" alt="Coach apply-cards" width="420" />
  &nbsp;
  <img src="screenshots/after/Fapless.png" alt="Fapless" width="420" />
</p>

## AI Coach

Coach reads your current week's tasks, this month's habits, your goals and your streak,
then answers with that context — and proposes concrete changes as **apply-cards**
(`create_task`, `create_habit`, `create_goal`, `update_habit`, `complete_goal`,
`delete_habit`, `delete_task`). Nothing touches your account until you tap **Apply**.

**Providers — bring your own key (BYOK):**

| Provider | Type | Model picker |
| :--- | :--- | :--- |
| OpenAI · Google Gemini · Anthropic Claude · Mistral | First-party | Curated list |
| **OpenRouter** | Built-in aggregator (editable base URL) | **Searchable live catalogue** (~470 models) |
| **NVIDIA NIM** — build.nvidia.com | Built-in aggregator (editable base URL) | **Searchable live catalogue** |
| **Custom provider** | Any OpenAI-compatible endpoint (Ollama, LM Studio, vLLM, Together, Groq…) | Searchable · fetched or manual entry |

Edge cases are handled: SSRF-guarded base URLs (HTTPS enforced in production, private
ranges blocked), 45 s request timeouts, connection tester with plain-language errors,
12 h model-catalogue cache with offline fallback, keyless local endpoints (Ollama) and
host-configurable shared keys with BYOK priority.

Guide: [`docs/ai-coach.md`](docs/ai-coach.md) · in-app: `/docs/ai-coach`.

## MCP Server

MindForm speaks the **Model Context Protocol** — no JWT required. Every account issues
its own **MCP keys** (`mfk_…`), stored as SHA-256 hashes and revocable instantly.

```jsonc
// Cursor (.cursor/mcp.json) — Claude Desktop / Codex / Antigravity configs at /docs/mcp
{
  "mcpServers": {
    "mindform": {
      "url": "https://mindform.onrender.com/mcp",
      "headers": { "Authorization": "Bearer mfk_YOUR_KEY" }
    }
  }
}
```

**13 tools** — `list/create/delete_task`, `list/create/update/delete/check_habit`,
`list/create/complete/delete_goal`, `get_overview` — the same bucket math as the app,
scoped to the key's account, rate-limited server-side.

Transports: **HTTP** (`POST /mcp`, JSON-RPC 2.0 — works with mcp-remote, Cursor,
Codex, Antigravity) and a dependency-free **stdio bridge** for local clients.
Create keys in **Settings → MCP Server**; per-platform configs in **Docs → MCP**.

Guide: [`docs/mcp.md`](docs/mcp.md) · in-app: `/docs/mcp`.

## Documentation

Everything ships in-repo and in-app (`/docs`):

| Doc | Contents |
| :--- | :--- |
| [`docs/architecture.md`](docs/architecture.md) | System map, frontend view/routing model, backend layering, MCP topology |
| [`docs/system-design.md`](docs/system-design.md) | Data models, week/month bucket math, aura engine, security layers, scaling |
| [`docs/backend.md`](docs/backend.md) | Setup, environment variables, route reference, models, error handling |
| [`docs/frontend.md`](docs/frontend.md) | Structure, design tokens, state, code splitting, how to add a view |
| [`docs/development.md`](docs/development.md) | Team dev setup, scripts, conventions, release checklist |
| [`docs/deployment.md`](docs/deployment.md) | Render deployment, env vars, custom domains, self-hosting |
| [`docs/mcp.md`](docs/mcp.md) | Full MCP guide — keys, per-platform configs, tool reference |
| [`docs/ai-coach.md`](docs/ai-coach.md) | Full Coach guide — BYOK, providers, apply-card schema, privacy |

## Quick start (team)

```bash
# backend — serves the API and the built frontend on :5000
cd backend
npm install
cp .env.example .env          # set MONGO_URI + JWT_SECRET
npm run dev                   # or: npm start

# frontend — Vite dev server on :5173 (proxies /api to :5000)
cd ../frontend
npm install
npm run dev

# production build → backend/public (the backend serves it)
cd ../frontend && npm run build
```

Detailed walkthrough: [`docs/development.md`](docs/development.md).

## Security & privacy

- bcrypt (cost 12) passwords, JWT sessions, Helmet CSP, mongo-sanitize, layered rate limits, honeypot + disposable-email blocking.
- MCP keys: 168-bit random, SHA-256 at rest, instant revocation, endpoint-scoped.
- SSRF guard on all user-supplied provider base URLs.
- AI chat TTL 24 h · forum TTL 48 h · camera recordings never leave the device.
- Report vulnerabilities privately — see [SECURITY.md](SECURITY.md).

## License

Copyright © 2026 Prince Chouhan. **Proprietary — all rights reserved.**
MindForm is closed-source software: no copying, modification, redistribution or
reselling without written permission. See [LICENSE.md](LICENSE.md) and [LEGAL.md](LEGAL.md).
