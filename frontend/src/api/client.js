const BASE_URL = import.meta.env.VITE_API_URL || '/api'

export const TOKEN_KEY = 'mf_token'

const getToken = () => localStorage.getItem(TOKEN_KEY)
const setToken = (t) => localStorage.setItem(TOKEN_KEY, t)
const clearToken = () => localStorage.removeItem(TOKEN_KEY)

// Backwards compatibility: migrate legacy token key once
try {
  const legacy = localStorage.getItem('prince_token')
  if (legacy && !localStorage.getItem(TOKEN_KEY)) {
    localStorage.setItem(TOKEN_KEY, legacy)
    localStorage.removeItem('prince_token')
  }
} catch { /* private mode */ }

async function request(method, path, body = null, { timeout = 15000 } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  const isAuthRoute = path.startsWith('/auth/login') || path.startsWith('/auth/register')
  const token = getToken()
  if (token && !isAuthRoute) headers['Authorization'] = `Bearer ${token}`

  const config = { method, headers }
  if (body) config.body = JSON.stringify(body)

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)
  config.signal = controller.signal

  let res
  try {
    res = await fetch(`${BASE_URL}${path}`, config)
  } catch (err) {
    clearTimeout(timer)
    console.error(`Fetch error [${method} ${BASE_URL}${path}]:`, err)
    if (err.name === 'AbortError') throw new Error('Request timed out. Check your connection and try again.')
    throw new Error('Failed to connect to server. Is the backend running?')
  }
  clearTimeout(timer)

  // Safe body parse: never crash on empty/HTML responses
  let data = null
  try { data = await res.json() } catch { data = null }

  if (!res.ok) {
    // Session expired → clean logout so the user sees the auth screen (do NOT trigger on login/register failures)
    if (res.status === 401 && getToken() && !isAuthRoute) {
      clearToken()
      // Soft reload so AuthContext re-evaluates from a clean state
      if (typeof window !== 'undefined' && !window.__mfLoggingOut) {
        window.__mfLoggingOut = true
        window.location.reload()
      }
    }
    const message = data?.message
      || (res.status === 401 ? (isAuthRoute ? 'Invalid email or password.' : 'Session expired. Please sign in again.')
        : res.status === 429 ? 'Too many requests — slow down and try again.'
        : res.status >= 500 ? 'Server error. Please try again shortly.'
        : 'Request failed.')
    const error = new Error(message)
    error.status = res.status
    throw error
  }
  return data
}

// Auth
export const authAPI = {
  register: (name, email, password) =>
    request('POST', '/auth/register', { name, email, password }),
  login: (email, password) =>
    request('POST', '/auth/login', { email, password }),
  me: () => request('GET', '/auth/me'),
  setToken, clearToken, getToken,
}

// Tasks
export const tasksAPI = {
  getWeek: (weekKey) => request('GET', `/tasks/${weekKey}`),
  getMonth: (monthKey) => request('GET', `/tasks/month/${monthKey}`),
  upsertWeek: (weekKey, payload) => request('PUT', `/tasks/${weekKey}`, payload),
}

// Habits
export const habitsAPI = {
  getMonth: (monthKey) => request('GET', `/habits/${monthKey}`),
  upsertMonth: (monthKey, payload) => request('PUT', `/habits/${monthKey}`, payload),
}

// Goals
export const goalsAPI = {
  getAll: () => request('GET', '/goals'),
  create: (payload) => request('POST', '/goals', payload),
  update: (id, payload) => request('PUT', `/goals/${id}`, payload),
  delete: (id) => request('DELETE', `/goals/${id}`),
}

// Fapless
export const faplessAPI = {
  get: () => request('GET', '/fapless'),
  update: (payload) => request('PUT', '/fapless', payload),
  relapse: (reason, dayCount, trigger) => request('POST', '/fapless/relapse', { reason, dayCount, trigger }),
  urgeLog: (payload) => request('POST', '/fapless/urge-log', payload),
  start: () => request('POST', '/fapless/start'),
  addAura: (points) => request('PUT', '/fapless/aura', { points }),
}

// Speak — communication & voice practice log
export const voiceAPI = {
  get: () => request('GET', '/voice'),
  update: (payload) => request('PUT', '/voice', payload),
}

// Social
export const socialAPI = {
  leaderboard: () => request('GET', '/social/leaderboard'),
  getMe: () => request('GET', '/social/me'),
  updateMe: (payload) => request('PUT', '/social/me', payload),
  getProfile: (userId) => request('GET', `/social/profile/${userId}`),
  follow: (userId) => request('POST', `/social/follow/${userId}`),
  unfollow: (userId) => request('DELETE', `/social/follow/${userId}`),
  getForumMessages: () => request('GET', '/social/forum'),
  postForumMessage: (text) => request('POST', '/social/forum', { text }),
}

// Admin
export const adminAPI = {
  getUsers: () => request('GET', '/social/admin/users'),
  getBadges: () => request('GET', '/social/admin/badges'),
  assignBadge: (userId, badgeId) => request('POST', `/social/admin/badge/${userId}`, { badgeId }),
  revokeBadge: (userId, badgeId) => request('DELETE', `/social/admin/badge/${userId}`, { badgeId }),
  deleteForumMsg: (msgId) => request('DELETE', `/social/admin/forum/${msgId}`),
}

// Cross-module aggregate for the Overview page
export const statsAPI = {
  summary: () => request('GET', '/stats/summary'),
}
