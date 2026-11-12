<p align="center">
  <img src="logo.png" width="120" alt="MindForm Logo" />
</p>

# MindForm 2.4 — Apple-Grade Productivity Suite

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
- **Built on the apple.com design spec** — `frontend/DESIGN.md` (VoltAgent apple design analysis) is the single source of truth for the landing surface: Action Blue `#0066cc` as the only accent (`#2997ff` on dark tiles), canvas `#ffffff` ↔ parchment `#f5f5f7` ↔ near-black tiles `#272729/#2a2a2c/#252527`, weight-600 tight-tracked headlines, 17 px body, pill CTAs with the `scale(0.95)` press state, hairline utility cards, zero decorative gradients and exactly one product shadow (`3px 5px 30px rgba(0,0,0,0.22)`).
- Keynote hero with masked-line reveal (fixes the old invisible-headline bug), product render with scroll parallax and a frosted always-black global nav.
- Feature ribbon, full-bleed scroll-triggered product tiles (Tasks → Habits → Goals → Fapless), animated stat counters, privacy tile, parchment CTA finale and apple.com-style fine-print footer.
- Replaced the WebGL starfield with flat canvases — lighter, calmer, on-brand. Removed `three.js`, `split-type` and `@studio-freight/lenis` dependencies (**bundle 0.92 MB**).

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

## ✨ What's new in 2.1 (refinement round)

### Apple Design System charts (`components/MFCharts.jsx`)
- New chart kit modeled on **Apple Health / Stocks / Fitness**: rounded gradient bars with the max value emphasized, Fitness-style activity rings with rounded caps, smooth Stocks-style area curves, and a floating capsule tooltip with backdrop blur. No gridlines, no axis lines — the data speaks for itself.
- Applied across **Tasks** (weekly progress, week score, per-day rings) and **Habits** (daily/weekly progress, GOAL·DONE·LEFT rings, mood & motivation curves).

### Tasks — fixed "+" button overflow (MANAGE TASKS)
- Root cause: the bottom split used a hardcoded `400px 1fr` grid and a non-wrapping add-row, so the time input and "+" button spilled outside the card on narrow viewports.
- Fix: responsive `mf-split-grid` (collapses to one column ≤768 px), wrapping add-row with `min-width: 0` guards, fixed-width time field, and a 44-pt blue "+" button (HIG touch target). Both desktop and mobile manage tabs verified.

### Goals — rethinked feature
- **Milestones:** every goal can now carry a measurable checkpoint list (add in the form, tick inline on the card, quick-add without opening the editor). Backend model + controller support added with validation.
- **Pace tracking:** progress is compared against the goal's creation→deadline window — cards show *Ahead of pace / On track / Behind pace / Overdue* chips, so a 30%-done goal due tomorrow no longer looks "fine".
- **Progress model:** overall % now averages every available signal (milestones + linked tasks + linked habits) instead of silently reading 0 for unlinked goals.
- **Templates:** four research-grounded quick-starts (Read 12 books, Run 5K, Ship a project, Emergency fund) that prefill title, deadline and milestones — blank-page friction removed.
- **Apple Fitness ring** per goal card, quick *Mark complete / Reopen* actions, decoded task-name matching (linked progress actually counts now), and a fully responsive mobile layout.

### Fapless — research-based redesign
- **Urge Rescue (SOS)** — one prominent band + full-screen flow: 3-minute **urge-surfing timer** with an animated box-breathing pacer, **HALT + digital trigger check** with a tailored tip per state, urge intensity slider, and **replacement action chips** (push-ups, cold water, walk, accountability text…). Surfing an urge is logged and earns **+15 aura** (mastery experiences build self-efficacy).
- **Urge log** in the database (`urgeLogs`) with trigger, intensity before/after and strategy; the History section shows the log and analytics (urges resisted, wave success rate, best streak, top triggers).
- **Compassionate relapse flow** — shame-based "demotivational quotes" removed (abstinence violation effect: shame fuels binges). Relapses now use a structured trigger debrief + optional note, followed by a kind reframe screen with your best streak and stats.
- **"Your brain on Day N"** — evidence-informed timeline of what to expect at each stage, with the current stage highlighted.
- Shame-y level labels softened ("Clown"→"Day One", "Noob"→"Initiate"); ids and images unchanged.
- 🐞 **Aura formula bug fixed** — the streak-aura accumulator never advanced its cursor, so every level's full span was double-counted (a 5-day streak earned ~3,300 aura instead of ~50). One server-side engine (`utils/aura.js`) is the single source of truth for Fapless, leaderboard and profiles.

### Social — Game Center & iMessage language
- **Podium leaderboard** (🥈🥇🥉 blocks) for the top 3, clean ranked rows below, follow buttons and "YOU" chip.
- **iMessage-style community forum** — blue bubbles for your messages, gray for others, grouped headers with flags/badges/timestamps, capsule input with a round send button.
- Profile tab rebuilt as an iOS-style hero card + stats band + inset-grouped edit sheet with a real iOS toggle; admin panel restyled into inset groups.

### Settings — iOS Settings app language
- Inset-grouped rounded lists with uppercase section headers, colored rounded-square icon tiles, chevron/status accessories and 52-pt rows.
- **Theme picker** is now two visual preview cards (Dark / Light) instead of a bare toggle.
- Permissions rows show live status chips with Enable actions; About and Session groups added; footnotes under each group.

### Screenshots
- 28 fresh captures in `Showcase/` (desktop + mobile, dark + light) — now covering the rebuilt **Speak** studio, every landing tile and the new Goals form.


### v2.4 — DESIGN.md as the single source of truth + Speak module
- **`frontend/DESIGN.md`** (VoltAgent apple design analysis, 563 lines) is committed to the repo and now governs the **entire frontend**, not just the landing page.
- **Token layer rebuilt** — one accent (Action Blue `#0066cc` / Sky Link `#2997ff` on dark), hairline cards at 18 px, radii locked to the 5/8/11/18/980 scale, weight ladder 300/400/600/700 (500 removed), card & button shadows eliminated (the single `3px 5px 30px` product shadow survives on landing imagery only), focus ring `#0071e3`.
- **Real SF substitute** — Inter Variable is bundled at `public/fonts/` and wired into both font stacks, so the Apple-tight cadence renders identically off-Apple platforms.
- **Every view scrubbed** — Tasks, Habits, Goals, Fapless, Social, AI Coach, Settings, Auth: all decorative gradients flattened to flat surfaces, neon glows removed, primary CTAs normalized to the Action Blue pill grammar (`scale(0.95)` press), page headers set at 600/-0.022em.
- **New: Speak — Voice & Communication Studio** (`VoiceCoachView.jsx`) — research-based drills (4-2-6 diaphragm breathing pacer, SOVT hums & lip trills, neck release + vowels, bronze/silver/gold twister ladder, style-shifting read-alouds, pen-in-mouth obstacle round, pace & pause trainer, on-camera PREP impromptu studio with local-only recording) packaged as **15 / 30 / 60-minute guided sessions** with a fullscreen session player, progress ring and completion logging (`/api/voice`, `VoiceLog` model, localStorage fallback).
- **Landing** — a fifth product tile introduces Speak (`Speak — new`), stats and footer updated, and every product render in the tiles was re-captured from the redesigned app.


### v2.2 polish
- **Overview dashboard**: new Apple Health-style "Last 14 days" activity chart (combined daily task + habit completion, today highlighted) built on the MFCharts kit; dashboard rings now reuse the shared `MFRing` component.
- Previous-month data now included in the demo seed so the trend renders a full window.
- Verified AI Coach / Auth / Landing are fully tokenized to the iOS palette (no legacy colors remain).

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
See `Showcase/` (v2.1 desktop + mobile) and `screenshots/before/` (v1 audit), `screenshots/after/` (v2 redesign) in the release package.

---

## 🔍 SEO / AEO / GEO
- `robots.txt` — welcomes search engines **and** AI crawlers (GPTBot, PerplexityBot, ClaudeBot, Applebot, Google-Extended…)
- `sitemap.xml`, canonical tags, Open Graph + Twitter cards
- `llms.txt` + `llms.md` — answer-engine product/data sheets (AEO)
- JSON-LD: `WebApplication` + `FAQPage`; geo meta (`geo.region`, ICBM)

---

© 2026 MindForm. All Rights Reserved.
