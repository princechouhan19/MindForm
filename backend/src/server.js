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
const voiceRoutes   = require('./routes/voice')
const aiRoutes      = require('./routes/ai')
const socialRoutes  = require('./routes/social')

const app = express()

// Trust proxy for Render/Cloud platforms
app.set('trust proxy', 1)

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
      connectSrc: ["'self'", 'http://localhost:5000', 'https://api.iconify.design'],
      workerSrc: ["'self'", 'blob:'],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false,
}))

// CORS
const isDev = (process.env.NODE_ENV || 'development') === 'development'
const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.RENDER_EXTERNAL_URL,
  'https://mindform.onrender.com',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173', // vite preview
  'http://127.0.0.1:4173',
  'http://localhost:5000',
  'http://127.0.0.1:5000',
].filter(Boolean)

app.use(cors((req, callback) => {
  const origin = req.header('Origin')
  let isAllowed = false

  if (!origin) {
    // Non-browser or same-origin requests without an Origin header
    isAllowed = true
  } else if (allowedOrigins.includes(origin)) {
    isAllowed = true
  } else if (/^https:\/\/([a-zA-Z0-9-]+\.)*onrender\.com$/.test(origin)) {
    // Allow any Render deployment origin
    isAllowed = true
  } else if (isDev && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
    isAllowed = true
  } else {
    // Allow if request Origin host matches server Host header (e.g. custom domains)
    try {
      const originHost = new URL(origin).host
      if (req.headers.host && originHost === req.headers.host) {
        isAllowed = true
      }
    } catch {
      isAllowed = false
    }
  }

  callback(null, {
    origin: isAllowed,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
}))

// Serve static assets (placed before body parsers for performance)
const publicPath = path.join(__dirname, '../public')
const hasPublicAssets = require('fs').existsSync(path.join(publicPath, 'index.html'))
if (process.env.NODE_ENV === 'production' || process.env.SERVE_FRONTEND === 'true' || process.env.RENDER || hasPublicAssets) {
  app.use(express.static(publicPath))
}

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDev ? 1000 : 200,
  message: { success: false, message: 'Too many requests, please try again later.' },
})

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 200 : 15,
  message: { success: false, message: 'Too many auth attempts, please slow down.' },
})

// Strict per-IP registration limiter
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: isDev ? 100 : 5,
  message: { success: false, message: 'Too many registration attempts from this device. Please try again later.' },
  skipSuccessfulRequests: false,
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
app.use('/api/voice',   voiceRoutes)
app.use('/api/ai',      aiRoutes)
app.use('/api/social',  socialRoutes)

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

// SPA catch-all — serve index.html for non-API client routes
if (process.env.NODE_ENV === 'production' || process.env.SERVE_FRONTEND === 'true' || process.env.RENDER || hasPublicAssets) {
  app.get('*', (req, res) => {
    // If request has a file extension (e.g. missing /assets/*.js, *.css, *.png), return 404 instead of index.html
    if (path.extname(req.path)) {
      return res.status(404).json({ success: false, message: `Asset ${req.originalUrl} not found.` })
    }
    res.sendFile(path.resolve(publicPath, 'index.html'))
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
