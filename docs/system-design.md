# System design

Deep-dive on data models, the bucket math that everything shares, the aura
engine and the security/scaling story.

## Data models

| Model | Shape (essentials) | Notes |
| :--- | :--- | :--- |
| **User** | name, email (unique, lowercase), bcrypt password (select:false), social profile (bio/country/avatar/isPublic), followers/following, badges[], isAdmin | admin auto-set for the owner email; password hashed on save (cost 12) |
| **TaskWeek** | user, weekKey `YYYY-M-wN`, tasks: string[], checks: Map `"dayIndex-taskTitle" → bool`, reflection {win, focus} | one doc per user per week; `updatedAt` on write |
| **HabitMonth** | user, monthKey `YYYY-M`, habits: [{name, emoji, time}], checks: Map `"day-habitName" → bool`, mental: Map | one doc per user per month |
| **Goal** | user, title, description, category (career/health/personal/general), deadline, status (active/completed) | progress computed client-side from linked TaskWeek/HabitMonth data |
| **Fapless** | user, currentStreak, bestStreak, relapses[{date, reason}], level, aura | streak math lives in `utils/aura.js`, shared with Social |
| **ForumMessage** | user, text, createdAt | **TTL index 48 h** — messages self-destruct |
| **VoiceLog** | user, sessions[] | Speak practice metadata only — media never uploaded |
| **MCPKey** | user, name, keyHash (sha256, unique), prefix (12 chars), createdAt, lastUsedAt, revoked | plaintext never stored; max 5 active per user |

## The bucket math (single source of truth)

Tasks and habits are stored in **calendar buckets** that match what the UI
shows. The same math exists in three places by design (app, Coach, MCP) and
must stay aligned:

```js
// Week key: the week of the month that contains today
function getWeekDays(year, month, weekNum) {
  const firstDay = new Date(year, month, 1)
  const startOffset = firstDay.getDay()           // weekday of the 1st
  const weekStart = (weekNum - 1) * 7 - startOffset
  // 7 days; dates outside the month are null
}
function getWeeksInMonth(year, month) {
  return Math.ceil((firstDay.getDay() + lastDay.getDate()) / 7)
}
// → weekKey: `${year}-${month}-w${n}`
// → monthKey: `${year}-${month}`
```

- Coach (`CoachView.jsx`) and MCP (`mcp/tools.js`) both compute the current
  week/month keys on every write, so AI-created tasks land in the exact week
  the user sees in Task Tracker.
- Checks are keyed by title/day (`1-Deep work (09:00)`) — deletes filter by
  case-insensitive exact title match.

## The aura engine

`backend/src/utils/aura.js` is the only implementation of streak → aura/level.
Fapless, the Social leaderboard and profiles all read from it, so numbers can
never diverge between surfaces (a v2.0 bug where the leaderboard counted raw
seconds is fixed by this).

- **Aura** accrues per clean day; **levels** are identity ranks Novice → Legend
  driven by streak thresholds; relapses reset the streak but keep history
  (and the reason log).

## AI Coach pipeline (`/api/ai/chat`)

1. **Validate** provider/model/key-or-shared-key/messages; validate custom
   `baseUrl` through the SSRF guard.
2. **Gather context** — last 8 TaskWeeks, current HabitMonth, all Goals, Fapless
   doc (`Promise.allSettled`, so one empty module never fails the chat).
3. **Build the system prompt** — persona, today's date, structured user-data
   context, the mf-actions schema and strict rules (max 10 actions, valid JSON,
   only when the user asks for changes).
4. **Dispatch** to the provider caller: four first-party callers (raw `https`)
   or `callOpenAICompatible` (fetch, 45 s timeout) for OpenRouter / NVIDIA /
   custom endpoints.
5. **Return** `{ success, reply, usedServerKey }`; errors are mapped to
   401/429/404 with human messages.

The client (`CoachView.jsx`) parses ```mf-actions``` blocks out of the reply,
renders review cards, and applies actions with the same upsert-merge logic the
UI uses (`applyCoachAction`) — Coach never clobbers existing data.

## MCP security design

- **Keys, not JWTs** — long random `mfk_…` strings; lookup by SHA-256 hash
  (unique index); revocation is a boolean flip checked on every request.
- Keys authenticate **only** `POST /mcp` — the web app and REST API never
  accept them.
- Rate limit 300 req/15 min/IP on the endpoint; writes mirror in-app actions.
- Plaintext shown once at create/rotate; the browser holds it in memory only
  for the modal session (to fill configs) and never persists it.

## Security layers (summary)

| Layer | Mechanism |
| :--- | :--- |
| Transport | HTTPS enforced on Render; `upgrade-insecure-requests` CSP |
| Headers | helmet CSP (strict img-src/connect-src allowlist), no-sniff, frame-deny |
| Auth | JWT bearer (7-day), bcrypt-12 storage, clean 401 → client soft-logout |
| Abuse | global 200/15 min, auth 50/15 min, register 20/h (skip successful), MCP 300/15 min |
| Injection | express-mongo-sanitize, Mongoose schema validation, regex-escaped lookups |
| SSRF | `assertSafeBaseUrl`: https-only in prod, private CIDRs + metadata + odd ports blocked, credentials-in-URL rejected |
| Data | per-user scoping on every query; TTL indexes for ephemeral content |

## Scaling notes

- **Stateless API** — all state in Mongo; horizontal scaling works behind any
  load balancer. The self-ping in `server.js` exists only to keep Render's free
  tier warm and can be dropped elsewhere.
- **Indexes** — email unique, MCPKey.keyHash unique, TTLs on ForumMessage;
  TaskWeek/HabitMonth lookups are compound (`user` + `weekKey`/`monthKey`).
- **Payloads** — `compression()` on; the aggregate `/api/stats/summary` exists
  so the Overview page costs one round-trip instead of five.
- **Frontend** — route-level splitting keeps the landing bundle ~22 kB gzip;
  vendor/charts/motion chunks are content-hashed and infinitely cacheable.
