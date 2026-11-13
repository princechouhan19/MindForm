# Deployment guide

MindForm deploys as **one Node service**: the backend serves the REST API, the
MCP endpoint and the built frontend from a single origin.

## Render (current production)

1. **Create a Web Service** from the private repo.
   - Root directory: `backend`
   - Build command: `npm install && cd ../frontend && npm install && npm run build`
     (or build the frontend in a CI step and commit nothing — `backend/public`
     is generated)
   - Start command: `npm start`
2. **Environment variables:**

   | Variable | Value |
   | :--- | :--- |
   | `NODE_ENV` | `production` |
   | `MONGO_URI` | MongoDB Atlas connection string |
   | `JWT_SECRET` | long random string (rotate if ever leaked) |
   | `SERVE_FRONTEND` | not required — production implies it |
   | `RENDER_EXTERNAL_URL` | injected by Render (used for self-ping + OpenRouter headers) |

3. **Custom domain**: add it in Render, update CORS via `FRONTEND_URL`, and
   regenerate `frontend/public/sitemap.xml`, `robots.txt` and `llms.txt`
   absolute links if the domain changes.

The service self-pings `/health` every 45 s in production (Render free-tier
keep-alive). On always-on plans you can remove that block in `server.js`.

## Any other host (Fly/Render/Docker/VPS)

The app needs only Node ≥ 18 and a reachable MongoDB:

```bash
cd frontend && npm ci && npm run build     # writes ../backend/public
cd ../backend && npm ci
NODE_ENV=production MONGO_URI=... JWT_SECRET=... PORT=5000 npm start
```

Put a reverse proxy (Caddy/Nginx) in front for TLS. Behaviour matrix:

| Condition | Result |
| :--- | :--- |
| `NODE_ENV=production` **or** `SERVE_FRONTEND=true` **or** `backend/public/index.html` exists | static SPA served + SPA catch-all |
| Request path has an extension and the asset is missing | JSON 404 (`Asset … not found`) |
| `/api/*` miss | JSON 404 (never HTML) |
| `/mcp` | MCP HTTP endpoint (auth: account key) |

## Health & monitoring

- `GET /health` → `{ success: true, message, timestamp, env }`
- Morgan (dev) / structured logs (prod console)
- Watch for: Mongo connection failures (process exits after 5 s — orchestrate
  restarts), 429 spikes (rate limits), `/api/ai/chat` provider errors

## Environments & secrets checklist

- [ ] `JWT_SECRET` unique per environment, ≥ 32 random chars
- [ ] `MONGO_URI` uses a dedicated DB user per environment
- [ ] Shared AI keys (optional) set only if you want host-provided Coach keys
- [ ] `FRONTEND_URL` set for split deployments (CORS)
- [ ] Never commit `.env` — `backend/.env` is gitignored

## Self-hosting MCP

Point clients at your origin: `https://your-host/mcp` with an account key.
The stdio bridge reads `MF_API_URL` + `MF_KEY` (see docs/mcp.md).
