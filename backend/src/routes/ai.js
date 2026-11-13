const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/auth')
const TaskWeek = require('../models/TaskWeek')
const HabitMonth = require('../models/HabitMonth')
const Goal = require('../models/Goal')
const Fapless = require('../models/Fapless')

// ─── Server-side provider keys (optional) ───────────────────────
// The host can enable a shared key via env vars. A user's own key
// (BYOK) always takes priority; the shared key is only a fallback so
// Coach works out of the box on self-hosted deployments.
const SERVER_KEYS = {
  openai:    process.env.OPENAI_API_KEY,
  gemini:    process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY,
  anthropic: process.env.ANTHROPIC_API_KEY,
  mistral:   process.env.MISTRAL_API_KEY,
}

/* Default base URLs for the two built-in aggregators (editable from
   the client — the body's baseUrl always wins, after validation). */
const DEFAULT_BASE_URLS = {
  openrouter: 'https://openrouter.ai/api/v1',
  nvidia:     'https://integrate.api.nvidia.com/v1',
}
const IS_DEV = (process.env.NODE_ENV || 'development') === 'development'

/* ─── SSRF guard for user-supplied base URLs ───────────────────
   Custom providers point at third-party OpenAI-compatible APIs.
   We must never let a key-holder turn the backend into a proxy
   against private infrastructure, cloud metadata or itself.     */
function assertSafeBaseUrl(raw) {
  let u
  try { u = new URL(String(raw)) } catch {
    throw new Error('Invalid base URL — use a full URL like https://api.example.com/v1')
  }
  if (!['http:', 'https:'].includes(u.protocol)) {
    throw new Error('Base URL must start with http:// or https://')
  }
  if (IS_DEV === false && u.protocol !== 'https:') {
    throw new Error('Base URL must use HTTPS in production')
  }
  if (u.username || u.password) {
    throw new Error('Base URL must not embed credentials (user:pass@host)')
  }
  const host = u.hostname.toLowerCase().replace(/\.$/, '')
  const privateNames = ['localhost', '127.0.0.1', '0.0.0.0', '::1', '[::1]', 'metadata.google.internal']
  if (privateNames.includes(host) || host.endsWith('.local') || host.endsWith('.internal') || host.endsWith('.localhost')) {
    if (!IS_DEV) throw new Error(`Blocked host: ${host}`)
  }
  if (/^(10|127)\./.test(host) || /^192\.168\./.test(host) || /^169\.254\./.test(host) || /^172\.(1[6-9]|2\d|3[01])\./.test(host)) {
    if (!IS_DEV) throw new Error(`Blocked private address: ${host}`)
  }
  if (u.port && ['22', '23', '25', '445', '3306', '5432', '6379', '9200', '27017'].includes(u.port)) {
    throw new Error(`Blocked port: ${u.port}`)
  }
  return u.origin + u.pathname.replace(/\/+$/, '')
}

// ─── GET /api/ai/providers ──────────────────────────────────────
// Which providers have a server-side key (booleans only — never the keys).
router.get('/providers', protect, (req, res) => {
  res.json({ success: true, data: {
    openai: Boolean(SERVER_KEYS.openai),
    gemini: Boolean(SERVER_KEYS.gemini),
    anthropic: Boolean(SERVER_KEYS.anthropic),
    mistral: Boolean(SERVER_KEYS.mistral),
  } })
})

// ─── POST /api/ai/chat ──────────────────────────────────────────
// Body: { provider, model, apiKey?, messages: [{role,content}] }
// apiKey (BYOK) is optional when the host configured a shared key.
// Returns: { reply: string, usedServerKey?: boolean }
router.post('/chat', protect, async (req, res) => {
  try {
    const { provider, model, apiKey, messages, baseUrl } = req.body
    const serverKey = SERVER_KEYS[provider]
    const customPending = baseUrl || provider === 'openrouter' || provider === 'nvidia' || provider.startsWith('custom-')
    // Keyless custom endpoints (Ollama, LM Studio…) are allowed: no key,
    // no server key, but a validated base URL to send requests to.
    if (!provider || !model || (!apiKey && !serverKey && !customPending) || !messages?.length) {
      return res.status(400).json({ success: false, message: 'model and messages are required — add your own API key (BYOK) or ask the host to enable a shared key.' })
    }
    const effectiveKey = apiKey || serverKey
    const usedServerKey = !apiKey && Boolean(serverKey)

    // Custom / aggregator providers (OpenRouter, NVIDIA NIM, anything
    // OpenAI-compatible). The client supplies the base URL; we validate
    // it against the SSRF guard before any request leaves the server.
    let customBase = null
    if (baseUrl || provider === 'openrouter' || provider === 'nvidia' || provider.startsWith('custom-')) {
      try {
        customBase = assertSafeBaseUrl(baseUrl || DEFAULT_BASE_URLS[provider] || '')
      } catch (e) {
        return res.status(400).json({ success: false, message: e.message })
      }
    }

    const userId = req.user._id
    const now = new Date()
    const monthKey = `${now.getFullYear()}-${now.getMonth()}`

    // NOTE: schema field is `user`, not `userId` - the old { userId } query
    // silently returned nothing, so the AI never saw any user data.
    // ── Gather all user data ────────────────────────────────────
    const [tasks, habits, goals, fapless] = await Promise.allSettled([
      TaskWeek.find({ user: userId }).sort({ weekKey: -1 }).limit(8).lean(),
      HabitMonth.findOne({ user: userId, monthKey }).lean(),
      Goal.find({ user: userId }).lean(),
      Fapless.findOne({ user: userId }).lean(),
    ])

    const taskData  = tasks.status  === 'fulfilled' ? tasks.value  : []
    const habitData = habits.status === 'fulfilled' ? habits.value : null
    const goalData  = goals.status  === 'fulfilled' ? goals.value  : []
    const fapData   = fapless.status === 'fulfilled' ? fapless.value : null

    // ── Build system context from user data ─────────────────────
    const lines = [
      `You are a personal productivity AI assistant for ${req.user.name} on MindForm.`,
      `Today is ${now.toDateString()}. Be warm, direct, and actionable.`,
      '',
      '=== USER DATA CONTEXT ===',
    ]

    // Tasks summary
    if (taskData.length) {
      lines.push('\n[TASKS - recent weeks]')
      taskData.forEach(w => {
        if (!w.tasks?.length) return
        const checks = w.checks || {}
        const doneCount = Object.values(checks).filter(Boolean).length
        lines.push(`  Week ${w.weekKey}: ${w.tasks.join(', ')} | ${doneCount} checks completed`)
        if (w.reflection?.win)   lines.push(`    Win: ${w.reflection.win}`)
        if (w.reflection?.focus) lines.push(`    Focus next: ${w.reflection.focus}`)
      })
    }

    // Habits summary
    if (habitData?.habits?.length) {
      lines.push('\n[HABITS this month]')
      habitData.habits.forEach(h => {
        const checks = habitData.checks || {}
        const done = Object.entries(checks).filter(([k, v]) => v && k.includes(h.name)).length
        lines.push(`  ${h.emoji || ''} ${h.name} — ${done} days completed this month`)
      })
    }

    // Goals
    if (goalData.length) {
      lines.push('\n[GOALS]')
      goalData.forEach(g => {
        const status = g.completed ? '✅ Done' : g.deadline ? `Deadline: ${new Date(g.deadline).toDateString()}` : 'Active'
        lines.push(`  • ${g.title} [${g.category || 'General'}] — ${status}`)
        if (g.description) lines.push(`    ${g.description}`)
      })
    }

    // Fapless
    if (fapData) {
      const streak = fapData.currentStreak || 0
      lines.push(`\n[SELF-DISCIPLINE STREAK]`)
      lines.push(`  Current streak: ${streak} days | Level: ${fapData.level || 1} | Aura: ${fapData.aura || 0}`)
      if (fapData.relapses?.length) {
        lines.push(`  Total relapses: ${fapData.relapses.length}`)
      }
    }

    lines.push('=== END CONTEXT ===')
    lines.push('')
    lines.push([
      "=== ACTION PROTOCOL (Coach can edit the user's account) ===",
      'When the user asks you to create, add, change, replan, or delete tasks / habits / goals - or asks you to plan their week or build a routine - you MUST:',
      '1. Briefly explain your plan in plain text (1-3 short paragraphs max).',
      '2. Then append ONE fenced code block tagged `mf-actions` containing a JSON array of operations:',
      '',
      '```mf-actions',
      '[',
      '  { "type": "create_task",  "title": "Deep work - report draft (09:00)" },',
      '  { "type": "create_habit", "name": "Read 20 pages", "emoji": "\u{1F4DA}", "time": "21:30" },',
      '  { "type": "create_goal",  "title": "Run a half marathon", "category": "health", "deadline": "2027-03-01", "description": "5k to 10k to half, 3 runs a week" },',
      '  { "type": "update_habit", "name": "Read books", "newName": "Read 20 pages", "time": "21:30" },',
      '  { "type": "complete_goal", "title": "Read 12 books in 2026" },',
      '  { "type": "delete_habit",  "name": "Doomscroll before bed" },',
      '  { "type": "delete_task",   "title": "Old cancelled meeting" }',
      ']',
      '```',
      '',
      'Rules:',
      '- Allowed types: create_task, create_habit, create_goal, update_habit, complete_goal, delete_habit, delete_task.',
      '- create_goal REQUIRES deadline (YYYY-MM-DD). category must be one of: career, health, personal, general.',
      '- create_task: title only - include the time inside the title when relevant (e.g. "(07:00)"). Tasks apply to the CURRENT week; do not include day names.',
      '- create_habit: name + emoji + optional time (HH:MM).',
      '- update_habit: match an existing habit by exact name, then give newName and/or time and/or emoji.',
      '- Emit the mf-actions block ONLY when the user clearly wants to change their data or asked for a plan/routine. For pure questions, answer normally with NO block.',
      '- Valid JSON only: no comments, no trailing commas, double quotes.',
      '- Keep each plan focused: at most 10 actions per reply.',
    ].join('\n'))
    lines.push('')
    // Filter out messages with empty content to prevent provider validation errors (e.g. Mistral 400)
    const sanitizedMessages = messages.filter(m => m.content && m.content.trim().length > 0)

    const systemPrompt = lines.join('\n')

    // ── Call provider API ──────────────────────────────────────
    let reply = ''
    try {
      if (customBase) {
        // OpenAI-compatible path: OpenRouter, NVIDIA NIM, custom endpoints
        reply = await callOpenAICompatible(effectiveKey, model, systemPrompt, sanitizedMessages, customBase, { provider })
      } else if (provider === 'openai') {
        reply = await callOpenAI(effectiveKey, model, systemPrompt, sanitizedMessages)
      } else if (provider === 'gemini') {
        reply = await callGemini(effectiveKey, model, systemPrompt, sanitizedMessages)
      } else if (provider === 'anthropic') {
        reply = await callClaude(effectiveKey, model, systemPrompt, sanitizedMessages)
      } else if (provider === 'mistral') {
        reply = await callMistral(effectiveKey, model, systemPrompt, sanitizedMessages)
      } else {
        return res.status(400).json({ success: false, message: `Unknown provider: ${provider}` })
      }
      res.json({ success: true, reply, usedServerKey })
    } catch (apiErr) {
      // Extract specific error messages for better UX
      const msg = apiErr.message || ''
      let statusCode = 500
      let userMessage = 'AI service error. Please try again later.'

      if (msg.includes('401') || msg.toLowerCase().includes('invalid api key') || msg.toLowerCase().includes('authentication')) {
        statusCode = 401
        userMessage = 'Invalid API key. Please check your AI configuration.'
      } else if (msg.includes('429') || msg.toLowerCase().includes('rate limit') || msg.toLowerCase().includes('quota')) {
        statusCode = 429
        userMessage = 'Rate limit exceeded or insufficient quota. Please check your provider billing.'
      } else if (msg.includes('404') || msg.toLowerCase().includes('not found')) {
        statusCode = 404
        userMessage = `Model "${model}" not found or not available for your key.`
      }

      console.warn(`[AI Error] ${provider}:`, msg)
      res.status(statusCode).json({ success: false, message: userMessage, raw: msg })
    }
  } catch (err) {
    console.error('AI chat route error:', err)
    res.status(500).json({ success: false, message: 'Internal server error.' })
  }
})

// ─── OpenAI ────────────────────────────────────────────────────
async function callOpenAI(apiKey, model, system, messages) {
  const https = require('https')
  const body = JSON.stringify({
    model,
    messages: [{ role: 'system', content: system }, ...messages],
    max_tokens: 1024,
    temperature: 0.7,
  })
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.openai.com',
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Content-Length': Buffer.byteLength(body),
      },
    }, res => {
      let data = ''
      res.on('data', c => data += c)
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data)
          if (parsed.error) return reject(new Error(parsed.error.message))
          if (res.statusCode >= 400) return reject(new Error(parsed.message || `OpenAI error ${res.statusCode}`))
          const reply = parsed.choices?.[0]?.message?.content
          if (!reply) {
            console.warn('[AI] OpenAI returned empty content:', data)
            return reject(new Error('AI returned an empty response.'))
          }
          resolve(reply)
        } catch { reject(new Error('Invalid OpenAI response')) }
      })
    })
    req.on('error', reject)
    req.write(body)
    req.end()
  })
}

// ─── Gemini ────────────────────────────────────────────────────
async function callGemini(apiKey, model, system, messages) {
  const https = require('https')
  const geminiMessages = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))
  const body = JSON.stringify({
    system_instruction: { parts: [{ text: system }] },
    contents: geminiMessages,
    generationConfig: { maxOutputTokens: 1024, temperature: 0.7 },
  })
  const modelPath = model.startsWith('gemini') ? model : `gemini-${model}`
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models/${modelPath}:generateContent?key=${apiKey}`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    }, res => {
      let data = ''
      res.on('data', c => data += c)
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data)
          if (parsed.error) return reject(new Error(parsed.error.message))
          if (res.statusCode >= 400) return reject(new Error(`Gemini error ${res.statusCode}`))
          const reply = parsed.candidates?.[0]?.content?.parts?.[0]?.text
          if (!reply) {
            console.warn('[AI] Gemini returned empty content:', data)
            return reject(new Error('AI returned an empty response. (Safety filter might have triggered)'))
          }
          resolve(reply)
        } catch { reject(new Error('Invalid Gemini response')) }
      })
    })
    req.on('error', reject)
    req.write(body)
    req.end()
  })
}

// ─── Anthropic Claude ──────────────────────────────────────────
async function callClaude(apiKey, model, system, messages) {
  const https = require('https')
  const body = JSON.stringify({
    model,
    max_tokens: 1024,
    system,
    messages,
  })
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(body),
      },
    }, res => {
      let data = ''
      res.on('data', c => data += c)
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data)
          if (parsed.error) return reject(new Error(parsed.error.message))
          if (res.statusCode >= 400) return reject(new Error(`Claude error ${res.statusCode}`))
          const reply = parsed.content?.[0]?.text
          if (!reply) {
            console.warn('[AI] Claude returned empty content:', data)
            return reject(new Error('AI returned an empty response.'))
          }
          resolve(reply)
        } catch { reject(new Error('Invalid Claude response')) }
      })
    })
    req.on('error', reject)
    req.write(body)
    req.end()
  })
}

// ─── Mistral ───────────────────────────────────────────────────
async function callMistral(apiKey, model, system, messages) {
  const https = require('https')
  const body = JSON.stringify({
    model,
    messages: [{ role: 'system', content: system }, ...messages],
    max_tokens: 1024,
    temperature: 0.7,
  })
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.mistral.ai',
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Content-Length': Buffer.byteLength(body),
      },
    }, res => {
      let data = ''
      res.on('data', c => data += c)
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data)
          if (parsed.error) return reject(new Error(parsed.error.message || JSON.stringify(parsed.error)))
          if (res.statusCode >= 400) {
            const errBody = parsed.message || data
            return reject(new Error(`Mistral error ${res.statusCode}: ${errBody}`))
          }
          const reply = parsed.choices?.[0]?.message?.content
          if (!reply) {
            console.warn('[AI] Mistral returned empty content:', data)
            return reject(new Error('AI returned an empty response.'))
          }
          resolve(reply)
        } catch { reject(new Error('Invalid Mistral response')) }
      })
    })
    req.on('error', reject)
    req.write(body)
    req.end()
  })
}

// ─── OpenAI-compatible (OpenRouter · NVIDIA NIM · custom) ────────
// One caller for every endpoint that speaks /chat/completions.
// baseUrl is pre-validated by assertSafeBaseUrl. Uses fetch with a
// hard timeout so a hanging provider can never pin the request.
async function callOpenAICompatible(apiKey, model, system, messages, baseUrl, { provider = 'custom' } = {}) {
  const body = JSON.stringify({
    model,
    messages: [{ role: 'system', content: system }, ...messages],
    max_tokens: 1024,
    temperature: 0.7,
  })
  const headers = { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
  if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`
  // OpenRouter attribution headers (optional but recommended by their docs)
  if (provider === 'openrouter') {
    headers['HTTP-Referer'] = process.env.PUBLIC_URL || process.env.RENDER_EXTERNAL_URL || 'https://mindform.onrender.com'
    headers['X-Title'] = 'MindForm'
  }

  let res
  try {
    res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers,
      body,
      signal: AbortSignal.timeout(45000),
    })
  } catch (e) {
    if (e?.name === 'TimeoutError' || e?.name === 'AbortError') throw new Error('Provider timed out after 45s')
    throw new Error(`Could not reach ${baseUrl} — check the base URL and your connection.`)
  }

  let parsed = null
  try { parsed = await res.json() } catch { parsed = null }
  if (parsed?.error) throw new Error(parsed.error.message || JSON.stringify(parsed.error))
  if (!res.ok) throw new Error(`${provider} error ${res.status}: ${(parsed && (parsed.message || parsed.details)) || 'request failed'}`)
  const reply = parsed?.choices?.[0]?.message?.content
  if (!reply) throw new Error('AI returned an empty response.')
  return reply
}

// ─── POST /api/ai/test — validate a provider config ─────────────
// Used by the Coach settings "Test connection" button. Checks the
// key against the provider's /models endpoint (or a tiny chat call
// when models are not listable) and reports plain-language results.
router.post('/test', protect, async (req, res) => {
  try {
    const { provider, baseUrl, apiKey } = req.body
    const serverKey = SERVER_KEYS[provider]
    const effectiveKey = apiKey || serverKey

    let modelsUrl = null
    let headers = {}
    if (baseUrl || provider === 'openrouter' || provider === 'nvidia' || provider.startsWith('custom-')) {
      let base
      try { base = assertSafeBaseUrl(baseUrl || DEFAULT_BASE_URLS[provider] || '') } catch (e) {
        return res.status(400).json({ success: false, ok: false, message: e.message })
      }
      modelsUrl = `${base}/models`
      if (effectiveKey) headers['Authorization'] = `Bearer ${effectiveKey}`
      if (provider === 'openrouter') {
        headers['HTTP-Referer'] = process.env.PUBLIC_URL || 'https://mindform.onrender.com'
        // OpenRouter's /models is public, so it can't validate a key —
        // use the authenticated /key endpoint instead.
        modelsUrl = `${base}/key`
      }
    } else if (provider === 'openai') {
      modelsUrl = 'https://api.openai.com/v1/models'
      headers['Authorization'] = `Bearer ${effectiveKey}`
    } else if (provider === 'mistral') {
      modelsUrl = 'https://api.mistral.ai/v1/models'
      headers['Authorization'] = `Bearer ${effectiveKey}`
    } else if (provider === 'anthropic') {
      modelsUrl = 'https://api.anthropic.com/v1/models'
      headers['x-api-key'] = effectiveKey
      headers['anthropic-version'] = '2023-06-01'
    } else if (provider === 'gemini') {
      modelsUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(effectiveKey || '')}`
    } else {
      return res.status(400).json({ success: false, ok: false, message: `Unknown provider: ${provider}` })
    }

    if (!effectiveKey && !modelsUrl.includes('generativelanguage') && !String(provider).startsWith('custom-')) {
      return res.status(400).json({ success: false, ok: false, message: 'Add an API key first.' })
    }

    let r
    try {
      r = await fetch(modelsUrl, { headers, signal: AbortSignal.timeout(15000) })
    } catch (e) {
      return res.json({ success: true, ok: false, message: `Could not reach the provider (${e.name === 'TimeoutError' ? 'timed out' : 'network error'}). Check the base URL.` })
    }

    let data = null
    try { data = await r.json() } catch { data = null }
    if (!r.ok) {
      const detail = data?.error?.message || data?.message || ''
      const friendly = r.status === 401 ? 'Invalid API key.' : r.status === 403 ? 'Key valid but lacks access to models.' : `Provider returned ${r.status}.`
      return res.json({ success: true, ok: false, message: `${friendly}${detail ? ' ' + detail : ''}` })
    }

    const ids = (data?.data || data?.models || []).map(m => m.id || m.name).filter(Boolean)
    return res.json({
      success: true,
      ok: true,
      message: ids.length ? `Connection OK — ${ids.length} models available.` : 'Connection OK.',
      count: ids.length,
      sample: ids.slice(0, 3),
    })
  } catch (err) {
    console.error('AI test route error:', err)
    res.status(500).json({ success: false, ok: false, message: 'Internal server error.' })
  }
})

module.exports = router
