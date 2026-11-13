# Changelog

All notable changes to MindForm. The product follows date-based marketing
versions; package versions bump independently.

## [3.1] — 2026-11-13

### Added
- **Documentation suite** — new `docs/` folder (architecture, system design,
  backend, frontend, development, deployment, MCP, Coach) and an in-app docs
  centre at `/docs`, `/docs/mcp`, `/docs/ai-coach` with sidebar navigation,
  copyable code blocks and shared design language.
- **MCP account keys (no JWT)** — every account can issue up to 5 `mfk_…`
  keys (SHA-256 at rest, shown once, instantly revocable/rotatable). New HTTP
  MCP endpoint (`POST /mcp`, JSON-RPC 2.0) + dependency-free stdio bridge.
  Per-platform setup configs for **Claude Desktop, Cursor, Codex CLI,
  Antigravity** and a generic HTTP mode, surfaced in the redesigned MCP modal
  and docs. 13th tool `get_overview` added.
- **Custom AI providers in Coach** — add/edit/remove any OpenAI-compatible
  endpoint (name + base URL). **OpenRouter** and **NVIDIA NIM**
  (build.nvidia.com) ship as editable defaults with searchable live model
  catalogues (12 h cache, offline fallback, exact-ID entry). Connection
  tester (`POST /api/ai/test`) with plain-language errors. Keyless local
  endpoints (Ollama/LM Studio) supported.
- **Error pages** — unified `ErrorPage` for 404 (unknown routes), 500
  (ErrorBoundary) and offline; `403` config; `/404`/`/500` routes; backend
  JSON 404s for missing assets unchanged.
- **Shared UI components** — `SiteFooter` used consistently on the landing
  page, sub-pages and docs; `MFButton`, `CodeBlock`/`CopyButton`,
  `lib/nav.js` navigation helper.
- **Root project docs** — professional README (product framing), proprietary
  LICENSE.md, CONTRIBUTING.md (closed-source policy), LEGAL.md (third-party
  notices), SECURITY.md (disclosure policy), CHANGELOG.md.

### Fixed
- **Sub-pages couldn't scroll** — pages now own their scroll container
  (the app shell keeps `body { overflow: hidden }` for the dashboard).
- **Sub-pages opened mid-document** — every page route resets scroll to the
  top (`navigateTo` + per-page effect).
- Auth buttons keep the URL in sync (`/login`, `/register`), so refresh and
  deep links work; back navigation no longer traps the auth page.

### Changed
- FAQ/Terms/llms.txt/llms.md/index.html copy updated for the proprietary
  (closed-source) model; sitemap now lists the docs pages.
- Landing footer links replaced by the shared SiteFooter; docs links added.

## [3.0] — 2026-11-12
- Coach apply-cards (mf-actions) with approval flow; MCP server (stdio,
  12 tools) behind JWT tokens; voiceCoach (Speak) module with local-only
  camera studio; voice session logging.

## [2.4] — 2026-11-11
- DESIGN.md adopted as the single source of truth for the landing surface;
  Speak module research pass; SEO/AEO/GEO assets (JSON-LD, llms.txt,
  sitemap + images, AI-crawler allowlist).

## [2.1–2.3] — 2026-11-10/11
- iOS-style charts, Goals rethink, Fapless research redesign, Social
  Game-Center language, iOS Settings language, mobile polish.

## [2.0] — 2026-11-09
- Apple design overhaul (type ramp, iOS palette, 8-pt grid, light theme),
  apple.com-style landing, Today dashboard, onboarding, toasts/confirm
  dialogs, data-loss race fix, aura engine unification, bundle split.
