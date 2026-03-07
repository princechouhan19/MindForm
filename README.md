# Prince OS Dashboard v2 — Full Stack

React frontend + Express/MongoDB backend with JWT auth. Deploy-ready for Render.

---

## 📁 Structure

```
prince-dashboard-v2/
├── backend/          ← Express API (deploy as Render Web Service)
│   ├── src/
│   │   ├── server.js
│   │   ├── config/db.js
│   │   ├── models/       (User, TaskWeek, HabitMonth)
│   │   ├── controllers/  (auth, tasks, habits)
│   │   ├── routes/
│   │   └── middleware/
│   ├── .env.example
│   └── package.json
│
└── frontend/         ← React + Vite (deploy as Render Static Site)
    ├── src/
    │   ├── api/client.js       (fetch wrapper)
    │   ├── context/AuthContext (JWT + user state)
    │   ├── hooks/useSync.js    (debounced auto-save)
    │   ├── views/              (AuthPage, TaskTracker, HabitTracker)
    │   └── components/         (Sidebar, StatCard)
    ├── .env.example
    └── package.json
```

---

## ⚡ Local Development

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env — add your MONGO_URI and JWT_SECRET
npm run dev
# Runs on http://localhost:5000
```

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env
# .env already has VITE_API_URL=http://localhost:5000/api
npm run dev
# Runs on http://localhost:5173
```

---

## 🚀 Deploy on Render

### Step 1 — Push to GitHub
Push the entire `prince-dashboard-v2` folder to a GitHub repo.

---

### Step 2 — Deploy Backend (Web Service)

1. Go to [render.com](https://render.com) → **New → Web Service**
2. Connect your GitHub repo
3. Settings:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Environment:** Node
4. Add **Environment Variables:**
   ```
   MONGO_URI        = mongodb+srv://your_connection_string
   JWT_SECRET       = any_long_random_string_here
   JWT_EXPIRES_IN   = 7d
   NODE_ENV         = production
   FRONTEND_URL     = https://your-frontend.onrender.com
   ```
5. Click **Create Web Service**
6. Copy the backend URL (e.g. `https://prince-dashboard-api.onrender.com`)

---

### Step 3 — Deploy Frontend (Static Site)

1. Go to Render → **New → Static Site**
2. Connect same GitHub repo
3. Settings:
   - **Root Directory:** `frontend`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`
4. Add **Environment Variable:**
   ```
   VITE_API_URL = https://prince-dashboard-api.onrender.com/api
   ```
5. Click **Create Static Site**

---

### Step 4 — Update Backend CORS
Go back to backend environment variables and update:
```
FRONTEND_URL = https://your-actual-frontend-url.onrender.com
```
Redeploy backend.

---

## 🔑 API Endpoints

### Auth
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/auth/me` | Get current user |

### Tasks (requires Bearer token)
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/tasks/month/:monthKey` | All weeks in month |
| GET | `/api/tasks/:weekKey` | Single week data |
| PUT | `/api/tasks/:weekKey` | Save/update week |

### Habits (requires Bearer token)
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/habits/:monthKey` | Month habit data |
| PUT | `/api/habits/:monthKey` | Save/update month |

**Key formats:**
- `monthKey` → `"2025-0"` (year-monthIndex, January = 0)
- `weekKey` → `"2025-0-w1"` (year-monthIndex-weekNumber)

---

## 🛡 Security Features
- Passwords hashed with bcrypt (12 rounds)
- JWT tokens expire in 7 days
- Rate limiting (200 req/15min general, 20 req/15min auth)
- Helmet.js security headers
- CORS restricted to your frontend URL

---

## ✨ Features
- **Auth:** Register/Login with JWT, persistent sessions
- **Auto-sync:** Data saves to MongoDB 1.5s after any change
- **Sync indicator:** Live saving/saved/error badge in header
- **Task Tracker:** Weekly grid, reflections, weekly progress chart
- **Habit Tracker:** Monthly grid, mental state tracking, Top 10 ranking
- **CSV Export:** Both views support data export
- **Multi-user:** Each user has isolated data in MongoDB
