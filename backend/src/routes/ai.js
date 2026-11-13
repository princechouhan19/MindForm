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
    const { provider, model, apiKey, messages } = req.body
    const serverKey = SERVER_KEYS[provider]
    if (!provider || !model || (!apiKey && !serverKey) || !messages?.length) {
      return res.status(400).json({ success: false, message: 'model and messages are required — add your own API key (BYOK) or ask the host to enable a shared key.' })
    }
    const effectiveKey = apiKey || serverKey
    const usedServerKey = !apiKey

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
      if (provider === 'openai') {
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

module.exports = router
