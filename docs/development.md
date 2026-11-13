# Development guide

Everything you need to work on MindForm day-to-day.

## Prerequisites

- Node.js ≥ 18 (engines enforced in backend/package.json)
- A MongoDB URI for persistent dev (or use the in-memory launcher)
- Git

## One-time setup

```bash
git clone <repo-url> MindForm && cd MindForm

cd backend
npm install
cp .env.example .env          # set JWT_SECRET + MONGO_URI (any value for dev)
cd ../frontend
npm install
```

## Daily workflow

```bash
# terminal 1 — API (in-memory Mongo, resets on restart)
cd backend && node src/dev-memory.js

# terminal 2 — frontend with HMR + /api proxy
cd frontend && npm run dev
```

Open http://localhost:5173. Register a normal account (gmail-style addresses
pass the disposable-email filter fastest). `npm run build` in `frontend/`
writes the production bundle to `backend/public`, so the backend alone can
then serve the whole app with `SERVE_FRONTEND=true`.

## Scripts

| Where | Script | What |
| :--- | :--- | :--- |
| backend | `npm run dev` | nodemon + real .env |
| backend | `npm start` | plain node (prod) |
| backend | `npm run mcp` | MCP stdio bridge (`MF_API_URL`, `MF_KEY`) |
| backend | `node src/dev-memory.js` | in-memory Mongo dev server |
| frontend | `npm run dev` | Vite dev server on :5173 |
| frontend | `npm run build` | production build → ../backend/public |
| frontend | `npm run preview` | preview the build |

## Conventions

- **Branches** (private repo): `feat/<area>-<thing>`, `fix/<area>-<thing>`,
  `chore/...` — e.g. `feat/coach-model-search`, `fix/goals-scroll`.
- **Commits**: conventional-ish subjects — `fix(auth): ...`,
  `feat(mcp): ...`, `docs(readme): ...` (see `git log` for the house style).
- **Style**: plain JavaScript with JSX, no TypeScript build step. Prefer
  functional components + hooks. Keep inline styles consistent with the
  existing view code (design tokens over hardcoded colors).
- **Shared logic**: new nav → `lib/nav.js`; new provider logic →
  `lib/ai-providers.jsx`; new copyable configs → `lib/mcp-configs.js`.
- **No `alert()`/`confirm()`** — use Toast + ConfirmDialog.
- **Hooks rules are sacred** — the production error #300 incident (blank
  sub-pages) came from an early return before hooks. Never early-return
  before the last hook in a component.

## Testing checklist (manual, before a release)

- [ ] Landing page (dark + light): hero, tiles, FAQ accordion, footer links
- [ ] `/privacy`, `/terms`, `/faq`, `/how-it-works` open **at the top** and scroll
- [ ] `/docs`, `/docs/mcp`, `/docs/ai-coach` render; code blocks copy
- [ ] Unknown URL → 404 page; `/404`, `/500` render
- [ ] Sign up → onboarding → Today; sign out; sign in
- [ ] Tasks/Habits/Goals CRUD + CSV export
- [ ] Coach: BYOK save (each provider), model search (OpenRouter), custom
      provider add/edit/remove, keyless local endpoint, connection test
- [ ] MCP: create key → shown once → Claude config contains real key →
      `curl -H "Authorization: Bearer mfk_…"` initialize + tools/list +
      one write tool → revoke → 401
- [ ] Mobile (≤768 px): bottom nav, More sheet, sub-page scroll, coach modal
- [ ] `npm run build` in frontend/ succeeds with no type/parse errors

## Release flow

1. Update `CHANGELOG.md` (keep-a-changelog style, versioned like the app).
2. Bump the version strings users see (`SettingsView` About row, README badge).
3. `cd frontend && npm run build` — confirm sizes and no circular-chunk errors.
4. Deploy (Render auto-deploys the main branch — see deployment.md).
5. Smoke-test the live URL with the checklist above.
