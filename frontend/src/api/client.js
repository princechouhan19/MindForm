const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const getToken = () => localStorage.getItem('prince_token')

async function request(method, path, body = null) {
  const headers = { 'Content-Type': 'application/json' }
  const token = getToken()
  if (token) headers['Authorization'] = `Bearer ${token}`

  const config = { method, headers }
  if (body) config.body = JSON.stringify(body)

  const res = await fetch(`${BASE_URL}${path}`, config)
  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.message || 'Request failed')
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
  relapse: (reason, dayCount) => request('POST', '/fapless/relapse', { reason, dayCount }),
  start: () => request('POST', '/fapless/start'),
  addAura: (points) => request('PUT', '/fapless/aura', { points }),
}
