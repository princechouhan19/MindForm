# Backend guide

Node.js + Express + Mongoose. One process serves the REST API, the MCP server
and (in production) the built frontend.

## Setup

```bash
cd backend
npm install
cp .env.example .env       # then edit values
npm run dev                # nodemon, NODE_ENV=development
# or: npm start
```

No MongoDB install? Use the in-memory dev launcher (data resets on restart):

```bash
npm i -D mongodb-memory-server   # already in devDependencies
node src/dev-memory.js
```

## Environment variables

| Variable | Required | Purpose |
| :--- | :--- | :--- |
| `MONGO_URI` | yes (prod) | MongoDB connection string |
| `JWT_SECRET` | yes | JWT signing secret — long and random in production |
| `PORT` | no (default 5000) | HTTP port |
| `NODE_ENV` | recommended | `development` / `production` — gates CORS strictness, SSRF guard strictness, morgan logging |
| `SERVE_FRONTEND` | no | `true` forces serving `public/` even in dev (handy for smoke tests) |
| `FRONTEND_URL` | no | CORS origin for split deployments |
| `PUBLIC_URL` / `RENDER_EXTERNAL_URL` | no | public origin used in OpenRouter attribution headers |
| `OPENAI_API_KEY` `GEMINI_API_KEY` `ANTHROPIC_API_KEY` `MISTRAL_API_KEY` | no | host-provided shared keys for Coach (booleans only are exposed via `/api/ai/providers`) |

## Route reference

| Route | Auth | What it does |
| :--- | :--- | :--- |
| `POST /api/auth/register` | rate-limited 20/h | create account (honeypot + disposable-email checks) |
| `POST /api/auth/login` | rate-limited 50/15 min | sign in → `{ token, user }` |
| `GET /api/auth/me` | JWT | current user profile |
| `GET/PUT /api/tasks/:weekKey` | JWT | read / upsert a week bucket |
| `GET/PUT /api/habits/:monthKey` | JWT | read / upsert a month bucket |
| `GET/POST/PATCH/DELETE /api/goals` | JWT | goals CRUD |
| `GET/POST /api/fapless/*` | JWT | streak engine (check-in, relapse, protocols) |
| `POST /api/ai/chat` | JWT | Coach proxy — see docs/ai-coach.md |
| `POST /api/ai/test` | JWT | BYOK connection tester (models endpoint check) |
| `GET /api/ai/providers` | JWT | which providers have a host shared key (booleans) |
| `GET/POST/DELETE /api/mcp/keys` | JWT | MCP account keys — create (plaintext once), list, rotate, revoke |
| `POST /mcp` | MCP key | JSON-RPC 2.0 MCP endpoint — initialize / tools/list / tools/call |
| `GET /api/social/*` | JWT | leaderboard, profiles, follow, forum (+admin subroutes) |
| `GET/PUT /api/voice` | JWT | Speak session log |
| `GET /api/stats/summary` | JWT | aggregate counters for the Today page |
| `GET /health` | none | probe |

Static/production behaviour: `express.static(public)` + SPA catch-all
(`index.html` for extension-less paths, JSON 404 for missing assets); `/api/*`
misses return JSON 404, never HTML.

## Adding a feature (checklist)

1. **Model** — schema + validation + indexes in `src/models/`.
2. **Controller** — logic in `src/controllers/`, throw `AppError` with status.
3. **Route** — thin router in `src/routes/`, mount in `src/server.js` behind
   `protect`.
4. **Client** — add typed methods in `frontend/src/api/client.js`.
5. **Docs** — update the table above and `docs/system-design.md` if the data
   model changed.

## MCP internals

- `src/mcp/tools.js` — the 13 tools; every `run(userId, args)` is scoped.
  Bucket math is duplicated intentionally (see system-design.md).
- `src/mcp/http.js` — the HTTP endpoint: key auth (sha256 lookup + revoked
  check + lastUsedAt stamp), JSON-RPC dispatch (initialize, notifications,
  ping, tools/list, tools/call, resources/prompts empty lists), batch support,
  405 for GET/DELETE.
- `src/mcp/server.js` — the stdio bridge: forwards each line to `${MF_API_URL}/mcp`
  with the account key; exits when stdin closes and no requests are in flight.

`npm run mcp` runs the bridge. Env: `MF_API_URL` (default the hosted app) and
`MF_KEY` (account key).

## Error handling

- Controllers throw `AppError(status, message)` → formatted JSON by
  `middleware/errorController.js`; unexpected errors log and return a generic
  500 (stack hidden unless development).
- Body-parser failures return a clean 400 (`Invalid JSON in request body.`).
- `db.js` exits the process after a 5 s connection failure — fail fast in prod,
  loud in dev.
