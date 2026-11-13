# Architecture

How MindForm is put together: the big map first, then each layer.

## System map

```
                       ┌──────────────────────────────────────────────┐
                       │                 Browser (SPA)                │
                       │  React 18 · Vite build · code-split views    │
                       │  Landing · Sub-pages · Docs · Dashboard      │
                       └───────────────┬──────────────────────────────┘
                                       │  same-origin /api (dev: Vite proxy)
                                       ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                             Node.js / Express                                │
│                                                                              │
│  Security:  helmet CSP · CORS allowlist · rate limits (global/auth/           │
│             register/MCP) · mongo-sanitize · compression · JSON 400 handler   │
│                                                                              │
│  REST API            MCP server (HTTP)            Static                     │
│  /api/auth           POST /mcp  ← JSON-RPC 2.0    /  → index.html (SPA)      │
│  /api/tasks          Bearer mfk_… account key     /assets → hashed chunks    │
│  /api/habits         13 tools → tools.js          /health → probe            │
│  /api/goals          SHA-256 key lookup           API 404 → JSON             │
│  /api/fapless        per-account scoping          asset 404 → static 404     │
│  /api/ai  (Coach: BYOK proxy + /test)                                        │
│  /api/social · /api/voice · /api/mcp (key mgmt) · /api/stats/summary         │
└───────────────────────────────┬──────────────────────────────────────────────┘
                                │  Mongoose
                                ▼
                     ┌─────────────────────┐
                     │      MongoDB        │
                     │  User · TaskWeek    │
                     │  HabitMonth · Goal  │
                     │  Fapless · Forum    │
                     │  VoiceLog · MCPKey  │
                     └─────────────────────┘

   External AI providers (OpenAI / Gemini / Claude / Mistral / OpenRouter /
   NVIDIA NIM / custom) are proxied server-side from /api/ai/chat — the
   user's BYOK key travels through memory only and is never stored.
```

## Frontend architecture

### Views and routing

The app is a single React root (`src/App.jsx`) with a lightweight **path router**
instead of react-router:

- `window.location.pathname` is read once and on every `popstate` event.
- A shared helper `src/lib/nav.js` (`navigateTo`) pushes a path, dispatches
  `popstate` and resets scroll to the top — one navigation idiom everywhere.
- Registries drive routing:
  - `SUB_PAGES` (`views/SubPages.jsx`) — `/privacy`, `/terms`, `/faq`, `/how-it-works`
  - `DOCS_PAGES` (`lib/docs-registry.jsx`) — `/docs`, `/docs/mcp`, `/docs/ai-coach`
- Anything unregistered renders the **404** ErrorPage; `/login` / `/register` /
  `/auth` map to the Auth page with the right mode.
- Every view is code-split via `React.lazy` except the tiny eager shell
  (Landing, SubPages, ErrorPage, providers) — see `vite.config.js` manualChunks:
  `charts` (recharts/d3), `motion` (gsap/lenis), `vendor` (react), `lib` (rest).

### Scroll contract (important)

The app shell sets `body { overflow: hidden }` for the dashboard. Marketing
pages therefore own their scroll: SubPage, DocsView and ErrorPage each render a
`height: 100dvh; overflow-y: auto` container and reset `scrollTop = 0` on path
change. New full pages must follow this contract or they will not scroll.

### State

- **Auth**: `context/AuthContext.jsx` — token in `localStorage.mf_token`, `me()`
  on boot, clean logout on unexpected 401s.
- **View-local data**: each tracker view fetches its bucket and auto-saves via
  `hooks/useSync.js` (a `ready` flag gates saves so a fetch-in-flight can never
  be overwritten by defaults).
- **Coach config**: `localStorage.mf_ai_config` (provider, model, baseUrls) +
  `mf_ai_keys` (per-provider BYOK keys, browser-only) + `mf_ai_custom_providers`.
- **Feedback**: `components/Toast.jsx` + `components/ConfirmDialog.jsx` replace
  every `alert()`/`confirm()`.

### Shared UI components

`components/Footer.jsx` (SiteFooter) is the single footer for landing, sub-pages,
docs and error-adjacent surfaces. `components/CodeBlock.jsx` (CopyButton) powers
every copyable config; `components/ui.jsx` (MFButton) is the shared button. The
MCP modal (`components/MCPModal.jsx`) is rendered from both Settings and Coach.

## Backend architecture

Classic layered Express:

```
routes/        thin Express routers — validation + delegation
controllers/   business logic per module (auth, tasks, habits, goals, fapless, voice)
models/        Mongoose schemas + indexes (TTLs live here: chat/forum)
middleware/    auth.protect (JWT), errorController (AppError → JSON)
utils/         aura.js (single streak/aura engine), AppError, catchAsync, emailValidator
mcp/           tools.js (tool logic, userId-scoped) · http.js (endpoint) · server.js (bridge)
config/        db.js (connection with 5 s server-selection timeout)
```

One entrypoint (`src/server.js`) mounts everything; `src/dev-memory.js` boots an
in-memory MongoDB for local dev without a database install.

### Error handling

Controllers throw `AppError(status, message)`; `errorController` formats
`{ status: 'fail'|'error', message }` and hides stacks outside development.
Malformed JSON returns a clean 400 before it can become a 500.

## MCP topology

```
Claude Desktop ──(mcp-remote stdio↔HTTP)──►┐
Cursor ───────────────(native HTTP)───────►│   POST /mcp (JSON-RPC 2.0)
Codex CLI ────────────(native HTTP)───────►│   Authorization: Bearer mfk_…
Antigravity ──────────(native HTTP)───────►│        │
any MCP agent ────────(generic HTTP)──────►│        ▼
                                           │   authenticate → MCPKey (sha256)
stdio bridge (src/mcp/server.js) ─────────►│        │
                                           │        ▼
                                           │   tools.js run(userId, args)
                                           │        │
                                           │        ▼
                                           │   MongoDB (scoped writes)
```

Key management (`/api/mcp/keys`) is JWT-protected and browser-facing; the key
plaintext is returned exactly once, never stored.
