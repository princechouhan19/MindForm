# MindForm Coach — engineering guide

Coach is the AI layer: a chat grounded in the user's real data that can
**propose** structured edits as apply-cards. Writes always require an explicit
Apply (or an MCP tool call with the user's key).

User-facing guide: `/docs/ai-coach` in the app (source `frontend/src/views/DocsView.jsx`).

## Files

| File | Role |
| :--- | :--- |
| `backend/src/routes/ai.js` | chat proxy, provider callers, SSRF guard, `/test` |
| `frontend/src/views/CoachView.jsx` | chat UI, settings panel, apply-card engine |
| `frontend/src/lib/ai-providers.jsx` | catalogue + logos + custom providers + catalogue fetcher |
| `frontend/src/api/client.js` | `aiAPI.providers`, `aiAPI.testProvider` |

## Providers

- **First-party** (raw `https` callers): openai, gemini, anthropic, mistral.
- **Aggregators, editable defaults**: `openrouter`
  (`https://openrouter.ai/api/v1`) and `nvidia` (`https://integrate.api.nvidia.com/v1`).
  The client can override the base URL per provider (`config.baseUrls[id]`).
- **Custom**: `custom-*` ids from `localStorage.mf_ai_custom_providers`
  ({id, name, baseUrl, searchable, keyOptional}). Keyless endpoints (Ollama)
  are allowed: the server skips auth validation when a validated baseUrl is
  present and sends no Authorization header.

All aggregation traffic goes through `callOpenAICompatible` (fetch, 45 s
timeout, OpenRouter attribution headers, friendly error mapping).

### SSRF guard — `assertSafeBaseUrl`

Always runs before any user-supplied URL is used: protocol allowlist
(http dev / https prod), credentials-in-URL rejected, localhost/`*.local`/
`*.internal`/metadata and private CIDRs (10/127/192.168/169.254/172.16–31)
blocked in production, dangerous ports rejected. The path is pinned — only
`/chat/completions` and `/models` (+ OpenRouter `/key` for key testing) are
appended.

### Model catalogue (frontend)

`fetchModelCatalog(provider, {baseUrl, apiKey})` → tries `${base}/models`
(OpenRouter's is public), maps to `{id, label}`, caches 12 h per provider+base
URL in localStorage, and falls back to the curated list with a visible
`OFFLINE LIST` chip. The picker (`ModelSearchSelect`) searches id+label, shows
"Use exact ID" for unmatched queries, and has a manual refresh.

### Connection tester — `POST /api/ai/test`

Checks the key against the provider's models endpoint (OpenRouter: `/key`,
because `/models` is public there) and returns
`{ ok, message, count, sample }` with plain-language failures (invalid key /
timeout / blocked host / region errors surfaced verbatim).

## The mf-actions protocol

Coach's system prompt instructs the model to emit:

````
```mf-actions
[{ "type": "create_task", "title": "Gym push day (07:00)" }, …]
```
````

Rules: types `create_task, create_habit, create_goal, update_habit,
complete_goal, delete_habit, delete_task`; goals require `deadline`
(`YYYY-MM-DD`) and category ∈ career/health/personal/general; max 10 actions;
only when the user asks for changes.

Client pipeline (`CoachView.jsx`):

1. `splitActions(content)` — extracts blocks, drops malformed JSON, keeps prose.
2. `Bubble` renders one `ActionRow` per action with the type's icon/color and a
   status (`applying` → `ok` | `exists` | `error`).
3. `applyCoachAction(a)` — merge-then-upsert via the same `tasksAPI`/
   `habitsAPI`/`goalsAPI` calls the UI uses; duplicate names → `'exists'`.
4. `applyAll` walks the block sequentially.

When storage shapes change, update **both** the server prompt (ai.js) and
`applyCoachAction` — and the mirror of the schema in DocsView + index.html FAQ.

## Config storage (browser only)

| Key | Contents |
| :--- | :--- |
| `mf_ai_config` | `{ provider, model, apiKey?, useServerKey?, baseUrls }` |
| `mf_ai_keys` | `{ [providerId]: apiKey }` — per-provider BYOK |
| `mf_ai_custom_providers` | user-defined provider list |
| `mf_ai_chat` | last 60 messages, TTL 24 h |

`useServerKey` lets a host-provided key (env vars) work when the user has none;
BYOK always takes priority. The Settings panel shows a live permission ladder
(read → propose → write-on-approve) reflecting the configured state.

## Edge cases handled

- Invalid/unreachable `baseUrl` → 400 with a human message before any request.
- Hanging providers → 45 s timeout; hanging catalogue → 10 s.
- Catalogue fetch failure → curated fallback list, clearly labelled.
- Keyless custom endpoints → allowed (no Authorization header sent).
- Empty model replies / provider safety-filter empties → explicit error card.
- Deleting the active custom provider → selection resets to OpenAI.
- Shared key vs BYOK → BYOK wins; the panel explains the active mode.
