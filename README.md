<p align="center">
  <img src="logo.png" width="120" alt="Mindform Logo" />
</p>

# 🌌 Mindform Dashboard

**Mindform** is a high-performance, full-stack productivity ecosystem designed to streamline personal growth through data-driven habit tracking, task management, and psychological wellness monitoring.

Built with a modern **PERN-style** architecture (replacing PG with MongoDB), Mindform offers a seamless, real-time synchronized experience for high-achievers.

---

## ✨ Core Features

### 📋 Precision Task Tracking
- **Weekly Cycles:** View and manage tasks in 7-day high-focus sprints.
- **Weekly Reflections:** Built-in journaling for "Wins," "Obstacles," and "Next Week's Focus."
- **Performance Analytics:** Historical bar charts to track completion percentages across weeks.

### 📅 Habit Mastery
- **Monthly Matrix:** Full visibility into your daily consistency across customized habits.
- **Mental State Integration:** Track **Mood** and **Motivation** (1–10) to correlate habits with psychological well-being.
- **Top 10 Leaderboard:** Automatically ranks your most consistent habits to reinforce positive behavior.

### 🛡️ Secure & Synchronized
- **Real-time Synchronization:** High-frequency, debounced auto-sync ensures your data is saved to the cloud instantly.
- **JWT-Powered Security:** Industry-standard authentication with bcrypt password hashing and sensitive data isolation.
- **Sync Architecture:** Visual indicators in the UI provide real-time feedback on your cloud connection status.

### 📊 Data Sovereignty
- **CSV Export:** Full data transparency—export your tasks and habit logs to professional formats for offline analysis.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, Recharts, Lucide Icons, Vanilla CSS (Premium) |
| **Backend** | Node.js, Express, JWT, Helmet.js, Rate-Limiting |
| **Database** | MongoDB Atlas (NoSQL) |
| **Deployment** | Render (CI/CD Integrated) |

---

## 📁 System Architecture

```text
mindform/
├── backend/          # RESTful API Engine
│   ├── src/
│   │   ├── models/   # Data Schemas (User, Task, Habit, Fapless)
│   │   ├── routes/   # Express Router Implementation
│   │   └── middleware/# JWT Verification & Security Layer
├── frontend/         # High-Fidelity UI
│   ├── src/
│   │   ├── api/      # Modular API Client
│   │   ├── context/  # Global Auth & Session Management
│   │   └── views/    # Responsive View Components
```

---

## ⚡ Technical Setup

### Backend
1. `cd backend`
2. `npm install`
3. Configure `.env` (refer to `.env.example` for `MONGO_URI` and `JWT_SECRET`)
4. `npm start` (Runs on port 5000)

### Frontend
1. `cd frontend`
2. `npm install`
3. `npm run dev` (Runs on port 5173)

---

## 🔒 Security & Performance
- **Data Isolation:** All database queries are scoped by User ID for strict tenancy isolation.
- **Sanitization:** Implements Helmet.js and CORS protection for high-integrity production environments.
- **Optimized Builds:** Vite-powered bundling for lightning-fast asset delivery on mobile and desktop.

---

© 2026 Mindform. All Rights Reserved.
