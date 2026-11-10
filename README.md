<p align="center">
  <img src="logo.png" width="120" alt="MindForm Logo" />
</p>

# 🌌 MindForm 2.0 — Apple-Grade Productivity Suite

<p align="center">
  <a href="https://mindform.onrender.com/"><strong>🚀 Live Demo</strong></a>
</p>

**MindForm** is a high-performance, full-stack productivity ecosystem for habit tracking, minute-level task planning, goal progression and discipline streaks — redesigned end-to-end around **Apple's Human Interface Guidelines**: iOS system colors, SF-style typography, an 8-pt grid, continuous-corner radii, WCAG-AA contrast and keynote-style motion.

---

## ✨ What's new in 2.0 (design & UX overhaul)

### Apple design system (frontend)
- **Typography** — SF Pro stack (`-apple-system → Inter` fallback) with Apple's type ramp (11/12/13/15/17/20/26/32/40 px) and tight optical tracking. Removed Syne/Bricolage/DM Mono webfonts (faster loads, native look).
- **Color** — iOS system palette with semantic tokens: systemBlue `#0A84FF/#007AFF`, systemOrange, systemGreen, systemRed, systemIndigo, systemPink, systemPurple. Full **light theme** on the apple.com `#F5F5F7` canvas — every legacy hardcoded neon (`rgba(0,229,255)`, `#ffd700`, `#ff4500`, …) is tokenized.
- **Grid & spacing** — 8-pt spacing scale, `--content-max: 980px` content column, consistent card padding.
- **Radii** — continuous-corner token set (8/10/12/16/22/28/980px pill).
- **Contrast** — all text/label pairs meet WCAG AA in both themes; buttons use white-on-blue instead of failing black-on-gold.

### Landing page — apple.com storytelling
- Keynote hero with masked-line reveal (fixes the old invisible-headline bug), ambient gradient, product window frame with scroll parallax.
- Feature ribbon, scroll-triggered product scenes (Tasks → Habits → Goals → Fapless), animated stat counters, privacy strip, gradient CTA finale, Apple-style footer.
- Replaced the WebGL starfield with CSS gradients — lighter, calmer, on-brand. Removed `three.js`, `split-type` and `@studio-freight/lenis` dependencies (**bundle 0.92 MB**).

### New features & sub-features
- **Today (Overview) dashboard** — greeting, task/habit progress rings, streak & goal cards, one-tap module jumps; now the default view.
- **Onboarding** — 3-step Apple-style welcome on first sign-in (per account).
- **Toast notifications** — global success/error/warning/info toasts replace every `alert()`.
- **Confirm dialogs** — destructive actions (delete goal, reset streak, replace week, copy tasks) use a centered alert-dialog with Escape support instead of `confirm()`.
- **Mobile** — HIG-compliant 5-tab bottom nav (Today/Tasks/Habits/Goals + **More** sheet for Fapless/Social/AI/Settings), 44-pt minimum touch targets, safe-area support; **Goals is now fully responsive** (was desktop-only).

### Fixed bugs
- 🔴 **Data-loss race** — auto-save could overwrite server data with defaults while a week/month fetch was in flight. `useSync` now gates saves behind a `ready` flag.
- 🔴 **Invisible hero headline** (SplitText + gradient text) — replaced with masked-line reveals.
- 🔴 **Aura inconsistency** — leaderboard counted raw seconds (1,037,107) while Fapless used the level formula (8,160). A single server-side `utils/aura.js` engine now powers Fapless, leaderboard and profiles.
- Fapless mobile: `justifycontent` typo, missing `@keyframes` (aura-pulse/aura-plus/auraFloat/glow never ran).
- GoalsView `linkedTasks.length` crash on legacy goals; unhandled rejections across views.
- API 404s returned HTML in production static mode → now JSON.
- `DonutChart` unclamped percent; `AuthContext` logout didn't clear errors; duplicate TTL index warning; malformed-JSON 500s → clean 400s.

### Accessibility & polish
- `:focus-visible` rings, `aria-label`/`aria-current`/`alertdialog` roles, Escape-to-close on all modals, `prefers-reduced-motion` support, visible grabbable scrollbars.

### Backend
- Server-side streak/aura engine (`src/utils/aura.js`) — one formula everywhere.
- Hardened controllers: key-format validation, input clamping, `catchAsync` + `AppError` everywhere, enum whitelists.
- New `GET /api/stats/summary` aggregate endpoint.
- Graceful shutdown (SIGTERM/SIGINT), request timeouts, token key migrated to `mf_token` (legacy auto-migrated), 401 → auto-logout.
- Sanitized `.env.example`; **rotate your MongoDB credentials** — they were committed in the original archive.

---

## 🛠 Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite 5, GSAP + ScrollTrigger, Lenis, Recharts, Lucide Icons |
| **Backend** | Node.js, Express, JWT, Helmet.js, Rate-Limiting |
| **Database** | MongoDB Atlas (NoSQL) |
| **Deployment** | Render (CI/CD Integrated) |

---

## 📁 System Architecture

```text
mindform/
├── backend/
│   ├── public/            # production build of the frontend
│   └── src/
│       ├── controllers/   # auth, tasks, habits, goals, fapless
│       ├── middleware/    # JWT verification & security
│       ├── models/        # User, TaskWeek, HabitMonth, Goal, Fapless, ForumMessage
│       ├── routes/        # Express routers + social/admin
│       └── utils/         # aura engine, AppError, catchAsync, email validator
└── frontend/
    ├── public/
    │   ├── shots/         # product screenshots used by the landing page
    │   ├── robots.txt · sitemap.xml · llms.txt · llms.md · site.webmanifest
    └── src/
        ├── api/           # typed API client (timeout, 401 handling)
        ├── components/    # Sidebar, Toast, ConfirmDialog, Onboarding
        ├── context/       # AuthContext
        ├── hooks/         # useSync (race-safe auto-save)
        └── views/         # Overview, TaskTracker, HabitTracker, Goals, Fapless, Social, AI Chat, Settings, Landing, Auth
```

---

## ⚡ Technical Setup

### Backend
1. `cd backend`
2. `npm install`
3. `cp .env.example .env` and configure `MONGO_URI` + `JWT_SECRET`
4. `npm run dev` (port 5000)

> Local dev without MongoDB: `node src/dev-memory.js` boots an **in-memory MongoDB** (dev only).

### Frontend
1. `cd frontend`
2. `npm install`
3. `npm run dev` (port 5173, proxies `/api` → backend)
4. `npm run build` → outputs to `../backend/public` for single-service deploys

---

## 🔒 Security & Performance
- **Data isolation:** every query is scoped by user ID.
- **Sanitization:** Helmet.js, CORS, NoSQL-injection protection, rate limiting (200 req/15 min, strict 3 regs/hour).
- **Privacy:** AI chats auto-delete after 24 h, forum posts after 48 h (TTL).
- **Optimized builds:** 0.92 MB total bundle, 3× fewer font requests, window-scroll landing without WebGL.

---

## 📸 Screenshots
See `screenshots/before/` (v1 audit) and `screenshots/after/` (v2 redesign) in the release package.

---

## 🔍 SEO / AEO / GEO
- `robots.txt` — welcomes search engines **and** AI crawlers (GPTBot, PerplexityBot, ClaudeBot, Applebot, Google-Extended…)
- `sitemap.xml`, canonical tags, Open Graph + Twitter cards
- `llms.txt` + `llms.md` — answer-engine product/data sheets (AEO)
- JSON-LD: `WebApplication` + `FAQPage`; geo meta (`geo.region`, ICBM)

---

© 2026 MindForm. All Rights Reserved.
