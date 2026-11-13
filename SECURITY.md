# Security policy

## Reporting a vulnerability

**Do not open a public issue.** Email **princechouhan4606@gmail.com** with:

- A short description of the vulnerability and its impact
- Reproduction steps (or a proof-of-concept)
- Affected endpoint(s)/component(s), and any logs

You will get an acknowledgement within **48 hours** and a status update at
least every 5 business days until resolution. Coordinated disclosure is the
default: we publish details after the fix ships. We don't run a bounty
program, but we will credit reporters by name (opt-in) in the changelog.

## Scope

In scope: the hosted app (mindform.onrender.com), the REST API, the MCP
endpoint (`/mcp`), key management, auth flows, the Coach proxy chain and the
SPA. Out of scope: volumetric DoS, social engineering of hosting providers,
and anything requiring a stolen account credential (please report credential
leaks anyway — we rotate/revoke).

## What we protect, how

| Surface | Mechanism |
| :--- | :--- |
| Passwords | bcrypt cost 12, `select: false` |
| Sessions | signed JWT (7-day), clean client soft-logout on unexpected 401 |
| Headers | helmet CSP with strict connect/img-src allowlists, no-sniff, frame-deny |
| Injection | express-mongo-sanitize + Mongoose validation + regex escaping |
| Abuse | global/auth/register rate limits, honeypot, disposable-email blocklist |
| MCP keys | 168-bit random, SHA-256 at rest, revocable instantly, endpoint-scoped |
| SSRF | `assertSafeBaseUrl` on every user-supplied provider URL (https, CIDR/metadata/port blocks) |
| Ephemera | AI chat TTL 24 h, forum TTL 48 h, recordings device-only |

## Hardening notes for operators

- Use a unique `JWT_SECRET` (≥ 32 random chars) per environment; rotate on
  any suspicion of leakage — sessions then require re-login only.
- Use a dedicated DB user with only the needed database scope.
- Keep `NODE_ENV=production` in prod: the SSRF guard is strictest there
  (private-range provider URLs are rejected) and stacks are hidden.
- If you suspect an MCP key leaked: revoke it in-app instantly (or rotate).
  Keys never authenticate the web app, so exposure cannot yield a login.

## Known-good practices in the codebase

- All user-scoped queries filter by `user` id — no cross-tenant reads.
- Writes from Coach/MCP mirror exactly what the UI could write; there is no
  privileged "AI" path beyond the user's own permissions.
- Plaintext MCP keys exist only in the HTTP response at creation time and in
  the user's clipboard; neither logs nor DB retain them.
