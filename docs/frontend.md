# Frontend guide

React 18 + Vite 5. Apple design language, route-split views, tiny path router.

## Setup

```bash
cd frontend
npm install
npm run dev        # Vite on :5173 — proxies /api → :5000 (VITE_API_PROXY_TARGET)
npm run build      # outputs to ../backend/public (single-origin deployment)
npm run preview    # serve the build locally
```

## Structure

```
src/
├── main.jsx              entry
├── App.jsx               shell: path router, ErrorBoundary, providers, dashboard chrome
├── index.css             design tokens (light+dark), base styles, lp-* landing classes
├── api/client.js         fetch wrapper: timeouts, safe JSON parse, 401 soft-logout
├── context/AuthContext   session state (token ↔ /auth/me)
├── hooks/useSync.js      race-safe auto-save for tracker views
├── lib/
│   ├── nav.js            navigateTo() — the one navigation idiom (pushState + popstate + scrollTop)
│   ├── ai-providers.jsx  provider catalogue, logos, custom-provider store, model-catalogue fetcher
│   ├── mcp-configs.js    per-platform MCP snippets (shared by MCPModal + DocsView)
│   └── docs-registry.jsx DOCS_PAGES metadata (eager, tiny; DocsView is lazy)
├── components/           Footer (SiteFooter), CodeBlock (+CopyButton), ui (MFButton),
│                         MCPModal, Sidebar, Toast, ConfirmDialog, Onboarding, MFCharts, StatCard
└── views/                LandingPage · SubPages · DocsView · ErrorPage · AuthPage ·
                          OverviewView · TaskTracker · HabitTracker · GoalsView ·
                          FaplessView · VoiceCoachView (Speak) · SocialView · CoachView · SettingsView
```

## Design system

- **Tokens live in `index.css`** as CSS variables: iOS system palette
  (`--brand-primary` #0A84FF family, cyan/amber/red/purple/teal accents),
  `--bg-base/surface/card/glass`, `--border/-bright`, radii
  (`--radius-lg` … `980px` pill), `--font-display/body/mono`,
  `--ease-apple`. Light and dark themes flip via `html[data-theme]`.
- **Landing classes** (`lp-*`): canvas `--lp-canvas`, hairlines
  `--lp-hairline`, Action Blue accent `--lp-accent`, type ramp
  (`lp-display`, `lp-h2`, `lp-body`, `lp-fine`, `lp-lead`), pill buttons
  (`lp-btn-primary`) with `scale(0.97)` press. Source of truth:
  `frontend/DESIGN.md`.
- Use components before inline styles for repeated surfaces:
  `SiteFooter`, `MFButton`, `CodeBlock`, `Toast`, `ConfirmDialog`,
  `MFCharts`, `StatCard`.

## Routing & pages

- The shell router reads `window.location.pathname` on boot and on `popstate`.
  Navigate with `navigateTo(path)` from `lib/nav.js` — never bare `pushState`
  without dispatching `popstate`.
- Registries: `SUB_PAGES` (SubPages.jsx) and `DOCS_PAGES` (docs-registry.jsx).
  Unknown paths render `ErrorPage code=404`; crash paths render
  `ErrorPage code=500` via the ErrorBoundary.
- **Scroll contract**: full pages own their scroll
  (`height: 100dvh; overflow-y: auto`) and reset to top on path change —
  `body` is `overflow: hidden` for the dashboard. If you add a full page,
  copy the SubPage/DocsView shell pattern.
- Every lazy view is wrapped in `<Suspense fallback={<ViewLoader />}>`.

## State & data

- `api/client.js` is the only fetch path for app data — it handles timeouts,
  non-JSON responses, 401 soft-logout and error messages.
- Tracker views use `useSync` (fetch-then-ready gating) so auto-saves never
  overwrite in-flight server data.
- Coach config persists to `localStorage` (`mf_ai_config`, `mf_ai_keys`,
  `mf_ai_custom_providers`); chat history TTLs after 24 h (`mf_ai_chat`).

## How to add a view

1. Create `src/views/MyView.jsx` (lazy-export default).
2. Register in `App.jsx`: `const MyView = lazy(...)` + a `NAV_ITEMS` entry +
   `renderView()` case (add to `MORE_SHEET_ITEMS` on mobile if beyond 5 tabs).
3. Follow the scroll contract if it is a full page; reuse shared components.
4. If it needs a top-level route, add it to the registries — and to
   `frontend/public/sitemap.xml` if it should be indexed.

## Performance notes

- `manualChunks` splits recharts/d3 (charts), gsap/lenis (motion), react
  (vendor) and the rest (lib) — parallel-cacheable, hashed filenames.
- The eager shell (index chunk) is ~22 kB gzip; everything else loads on demand.
- Keep the eager surface tiny: registries and icons only — heavy content
  (DocsView, views) stays lazy.
