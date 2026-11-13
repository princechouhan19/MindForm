require('dotenv').config()
const express = require('express')
const path = require('path')
const cors = require('cors')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')
const mongoSanitize = require('express-mongo-sanitize')
const compression = require('compression')
const morgan = require('morgan')
const connectDB = require('./config/db')

const authRoutes    = require('./routes/auth')
const taskRoutes    = require('./routes/tasks')
const habitRoutes   = require('./routes/habits')
const goalRoutes    = require('./routes/goals')
const faplessRoutes = require('./routes/fapless')
const aiRoutes      = require('./routes/ai')
const socialRoutes  = require('./routes/social')
const voiceRoutes   = require('./routes/voice')
const mcpKeyRoutes  = require('./routes/mcp')
const mcpHttp       = require('./mcp/http')

const app = express()

// Trust proxy for Render/Cloud platforms
app.set('trust proxy', 1)

// Public origin of this deployment (Render injects RENDER_EXTERNAL_URL)
const PUBLIC_URL = process.env.RENDER_EXTERNAL_URL || process.env.PUBLIC_URL || ''

// Connect to DB
connectDB()

// Security middleware — configure CSP to allow same-origin API and React
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
      imgSrc: ["'self'", 'data:', 'blob:', 'https://api.iconify.design'],
      connectSrc: ["'self'", 'http://localhost:5000', 'https://api.iconify.design',
        ...(PUBLIC_URL ? [PUBLIC_URL] : []),
        ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : [])],
      workerSrc: ["'self'", 'blob:'],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false,
}))

// CORS — same-origin requests never trigger CORS, but allow the deployed
// frontend origin(s) too so a split deployment (static frontend + API) works.
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:4173', // vite preview
    ...(PUBLIC_URL ? [PUBLIC_URL] : []),
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { success: false, message: 'Too many requests, please try again later.' },
})

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { success: false, message: 'Too many auth attempts, please slow down.' },
})

// Per-IP registration limiter
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  message: { success: false, message: 'Too many registration attempts from this device. Please try again later.' },
  skipSuccessfulRequests: true,
})

app.use('/api/', limiter)
app.use('/api/auth', authLimiter)
app.use('/api/auth/register', registerLimiter)

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'))
}

// Body parsing
app.use(express.json({ limit: '2mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(require('cookie-parser')())

// Data sanitization against NoSQL query injection
app.use(mongoSanitize())

// Compress responses
app.use(compression())

// Malformed JSON → clean 400 (otherwise body-parser throws a raw 500)
app.use((err, req, res, next) => {
  if (err?.type === 'entity.parse.failed' || err instanceof SyntaxError) {
    return res.status(400).json({ success: false, message: 'Invalid JSON in request body.' })
  }
  next(err)
})

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Mind Form API is running 🚀',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
  })
})

// API Routes
app.use('/api/auth',    authRoutes)
app.use('/api/tasks',   taskRoutes)
app.use('/api/habits',  habitRoutes)
app.use('/api/goals',   goalRoutes)
app.use('/api/fapless', faplessRoutes)
app.use('/api/ai',      aiRoutes)
app.use('/api/social',  socialRoutes)
app.use('/api/voice',   voiceRoutes)
app.use('/api/mcp',     mcpKeyRoutes)   // MCP account keys (JWT-protected management)

// MCP server — Model Context Protocol over HTTP, authenticated by
// per-account keys (mfk_…), NOT JWTs. Mounted before the /api 404
// so clients like Claude Desktop, Cursor, Codex and Antigravity can
// POST JSON-RPC to /mcp directly.
app.use('/mcp', mcpHttp)

// Cross-module aggregate — powers the Overview ("Today") page in one round-trip
app.get('/api/stats/summary', require('./middleware/auth').protect, async (req, res) => {
  try {
    const now = new Date()
    const monthKey = `${now.getFullYear()}-${now.getMonth()}`

    const [goals, TaskWeek, HabitMonth, Fapless] = await Promise.all([
      require('../models/Goal').countDocuments({ user: req.user.id, status: 'active' }),
      require('../models/TaskWeek').countDocuments({ user: req.user.id, weekKey: { $regex: `^${monthKey}-w` } }),
      require('../models/HabitMonth').countDocuments({ user: req.user.id, monthKey }),
      require('../models/Fapless').findOne({ user: req.user.id }).lean(),
    ])

    const { computeStreakStats } = require('./utils/aura')
    const streak = computeStreakStats(Fapless || {})

    res.json({
      success: true,
      data: {
        activeGoals: goals,
        plannedWeeks: TaskWeek,
        trackedMonths: HabitMonth,
        streakDays: streak.streakDays,
        aura: streak.aura,
        level: streak.level,
      },
    })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to compute summary.' })
  }
})

// API 404 — must come after routes; returns JSON, never the SPA shell
app.use('/api', (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` })
})

// Serve static assets in production
if (process.env.NODE_ENV === 'production' || process.env.SERVE_FRONTEND === 'true') {
  app.use(express.static(path.join(__dirname, '../public')))

  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../public', 'index.html'))
  })
}

// Global error handler
const globalErrorHandler = require('./middleware/errorController')
app.use(globalErrorHandler)


const PORT = process.env.PORT || 5000
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`)

  // Keep Render free tier alive — ping self every 45 seconds
  if (process.env.NODE_ENV === 'production') {
    const https = require('https')
    const SELF_URL = process.env.RENDER_EXTERNAL_URL || `https://mindform.onrender.com`

    setInterval(() => {
      https.get(`${SELF_URL}/health`, (res) => {
        console.log(`🏓 Self-ping OK [${res.statusCode}]`)
      }).on('error', (err) => {
        console.warn(`⚠️  Self-ping failed: ${err.message}`)
      })
    }, 45 * 1000) // every 45 seconds

    console.log(`🏓 Self-ping active → ${SELF_URL}/health every 45s`)
  }
})

// Graceful shutdown
const shutdown = (signal) => {
  console.log(`\n${signal} received — closing server…`)
  server.close(() => process.exit(0))
  setTimeout(() => process.exit(1), 8000).unref()
}
process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))
