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
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:4173', // vite preview
  ],
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
  max: 10,
  message: { success: false, message: 'Too many auth attempts, please slow down.' },
})

// Strict per-IP registration limiter: max 3 new accounts per hour per IP
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
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

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Mind Form API is running 🚀',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
  })
})

const socialRoutes   = require('./routes/social')

// API Routes
app.use('/api/auth',    authRoutes)
app.use('/api/tasks',   taskRoutes)
app.use('/api/habits',  habitRoutes)
app.use('/api/goals',   goalRoutes)
app.use('/api/fapless', faplessRoutes)
app.use('/api/ai',      aiRoutes)
app.use('/api/social',  socialRoutes)

// Serve static assets in production
if (process.env.NODE_ENV === 'production' || process.env.SERVE_FRONTEND === 'true') {
  app.use(express.static(path.join(__dirname, '../public')))

  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../public', 'index.html'))
  })
} else {
  // 404 handler for API
  app.use('*', (req, res) => {
    res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` })
  })
}

// Global error handler
const globalErrorHandler = require('./middleware/errorController');
app.use(globalErrorHandler);


const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
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
