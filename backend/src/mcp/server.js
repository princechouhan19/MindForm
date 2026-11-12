/* ═══════════════════════════════════════════════════════════════
   MindForm MCP server — Model Context Protocol over stdio.

   Lets any MCP client (Claude Desktop, Cursor, …) read and edit the
   signed-in user's tasks, habits and goals with plain tool calls —
   the same quick edits Coach proposes in the app.

   Run:
     MF_URI=mongodb://127.0.0.1:27017/mindform \
     MF_TOKEN=<jwt from the app> \
     node src/mcp/server.js

   Tools (all scoped to the token's user):
     list_tasks / create_task / delete_task
     list_habits / create_habit / update_habit / delete_habit / check_habit
     list_goals / create_goal / complete_goal / delete_goal
   ═══════════════════════════════════════════════════════════════ */
const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const TaskWeek = require('../models/TaskWeek')
const HabitMonth = require('../models/HabitMonth')
const Goal = require('../models/Goal')

/* Convenience: fall back to backend/.env so a local setup works with
   just MF_TOKEN set. Explicit env vars always win. */
function loadBackendEnv() {
  try {
    const fs = require('fs')
    const path = require('path')
    const envPath = path.join(__dirname, '../../.env')
    for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
      if (m && process.env[m[1]] === undefined) {
        process.env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim()
      }
    }
  } catch { /* no .env — fine */ }
}
loadBackendEnv()

const MF_URI = process.env.MF_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/mindform'
const MF_TOKEN = process.env.MF_TOKEN || process.argv.find(a => a.startsWith('--token='))?.slice(8)
const JWT_SECRET = process.env.JWT_SECRET || 'mindform_dev_secret_change_me'

if (!MF_TOKEN) {
  console.error('MF_TOKEN is required (a JWT from logging into MindForm).')
  process.exit(1)
}

/* ── Same bucket math as the app ── */
const monthKeyOf = (d = new Date()) => `${d.getFullYear()}-${d.getMonth()}`
function getWeekDays(year, month, weekNum) {
  const firstDay = new Date(year, month, 1)
  const startOffset = firstDay.getDay()
  const weekStart = (weekNum - 1) * 7 - startOffset
  const days = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(year, month, weekStart + i + 1)
    days.push(d.getMonth() === month ? d.getDate() : null)
  }
  return days
}
function getWeeksInMonth(year, month) {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  return Math.ceil((firstDay.getDay() + lastDay.getDate()) / 7)
}
function currentWeekKey(d = new Date()) {
  const y = d.getFullYear(), m = d.getMonth()
  const total = getWeeksInMonth(y, m)
  for (let w = 1; w <= total; w++) {
    if (getWeekDays(y, m, w).includes(d.getDate())) return `${y}-${m}-w${w}`
  }
  return `${y}-${m}-w1`
}
const same = (x, y) => (x || '').trim().toLowerCase() === (y || '').trim().toLowerCase()
/* lean() returns plain objects; live docs return Maps — accept both. */
const toObj = (v) => (v instanceof Map ? Object.fromEntries(v) : (v || {}))

/* ── Tool implementations (scope everything to the token user) ── */
function authUser() {
  const payload = jwt.verify(MF_TOKEN, JWT_SECRET)
  return payload.id || payload._id || payload.sub
}

const TOOLS = [
  {
    name: 'list_tasks', description: 'List this week\'s MindForm tasks with their check-off state.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    async run() {
      const doc = await TaskWeek.findOne({ user: authUser(), weekKey: currentWeekKey() }).lean()
      const tasks = doc?.tasks || []
      const checks = toObj(doc?.checks)
      return { weekKey: currentWeekKey(), tasks: tasks.map(t => ({ title: t, done: !!checks[`1-${t}`] })) }
    },
  },
  {
    name: 'create_task', description: 'Add a task to the current week. Include the time inside the title, e.g. "Deep work (09:00)".',
    inputSchema: { type: 'object', properties: { title: { type: 'string' } }, required: ['title'], additionalProperties: false },
    async run({ title }) {
      const weekKey = currentWeekKey()
      const doc = await TaskWeek.findOneAndUpdate(
        { user: authUser(), weekKey },
        { $addToSet: { tasks: String(title) }, $setOnInsert: { checks: {}, reflection: {} }, $set: { updatedAt: new Date() } },
        { upsert: true, new: true }
      )
      return { ok: true, weekKey, tasks: doc.tasks }
    },
  },
  {
    name: 'delete_task', description: 'Remove a task from the current week by exact title.',
    inputSchema: { type: 'object', properties: { title: { type: 'string' } }, required: ['title'], additionalProperties: false },
    async run({ title }) {
      const weekKey = currentWeekKey()
      const doc = await TaskWeek.findOne({ user: authUser(), weekKey })
      if (!doc) return { ok: false, message: 'No tasks this week.' }
      doc.tasks = doc.tasks.filter(t => !same(t, title))
      await doc.save()
      return { ok: true, tasks: doc.tasks }
    },
  },
  {
    name: 'list_habits', description: 'List this month\'s habits with completion counts.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    async run() {
      const mk = monthKeyOf()
      const doc = await HabitMonth.findOne({ user: authUser(), monthKey: mk }).lean()
      const habits = doc?.habits || []
      const checks = toObj(doc?.checks)
      return {
        monthKey: mk,
        habits: habits.map(h => ({
          name: h.name, emoji: h.emoji, time: h.time,
          doneDays: Object.entries(checks).filter(([k, v]) => v && k.endsWith(`-${h.name}`)).length,
        })),
      }
    },
  },
  {
    name: 'create_habit', description: 'Add a habit to the current month.',
    inputSchema: {
      type: 'object',
      properties: { name: { type: 'string' }, emoji: { type: 'string' }, time: { type: 'string', description: 'HH:MM' } },
      required: ['name'], additionalProperties: false,
    },
    async run({ name, emoji, time }) {
      const mk = monthKeyOf()
      const exists = await HabitMonth.findOne({ user: authUser(), monthKey: mk, 'habits.name': name })
      if (exists) return { ok: false, message: `Habit "${name}" already exists this month.` }
      await HabitMonth.findOneAndUpdate(
        { user: authUser(), monthKey: mk },
        { $push: { habits: { name, emoji: emoji || '✨', time: time || '' } }, $setOnInsert: { checks: {}, mental: {} }, $set: { updatedAt: new Date() } },
        { upsert: true }
      )
      return { ok: true }
    },
  },
  {
    name: 'update_habit', description: 'Rename/reschedule an existing habit (match by exact name).',
    inputSchema: {
      type: 'object',
      properties: { name: { type: 'string' }, newName: { type: 'string' }, emoji: { type: 'string' }, time: { type: 'string' } },
      required: ['name'], additionalProperties: false,
    },
    async run({ name, newName, emoji, time }) {
      const mk = monthKeyOf()
      const doc = await HabitMonth.findOne({ user: authUser(), monthKey: mk })
      if (!doc) return { ok: false, message: 'No habits this month.' }
      const h = doc.habits.find(x => same(x.name, name))
      if (!h) return { ok: false, message: `Habit "${name}" not found.` }
      if (newName) h.name = newName
      if (emoji) h.emoji = emoji
      if (time !== undefined) h.time = time
      await doc.save()
      return { ok: true }
    },
  },
  {
    name: 'delete_habit', description: 'Remove a habit from the current month by exact name.',
    inputSchema: { type: 'object', properties: { name: { type: 'string' } }, required: ['name'], additionalProperties: false },
    async run({ name }) {
      const mk = monthKeyOf()
      await HabitMonth.findOneAndUpdate(
        { user: authUser(), monthKey: mk },
        { $pull: { habits: { name } }, $set: { updatedAt: new Date() } }
      )
      return { ok: true }
    },
  },
  {
    name: 'check_habit', description: 'Toggle today\'s check-in for a habit.',
    inputSchema: { type: 'object', properties: { name: { type: 'string' }, done: { type: 'boolean' } }, required: ['name'], additionalProperties: false },
    async run({ name, done = true }) {
      const mk = monthKeyOf()
      const doc = await HabitMonth.findOne({ user: authUser(), monthKey: mk })
      if (!doc) return { ok: false, message: 'No habits this month.' }
      const h = doc.habits.find(x => same(x.name, name))
      if (!h) return { ok: false, message: `Habit "${name}" not found.` }
      const key = `${new Date().getDate()}-${h.name}`
      doc.checks.set(key, !!done)
      await doc.save()
      return { ok: true, key, done: !!done }
    },
  },
  {
    name: 'list_goals', description: 'List all goals with status, category and deadline.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    async run() {
      const goals = await Goal.find({ user: authUser() }).lean()
      return goals.map(g => ({
        id: String(g._id), title: g.title, category: g.category,
        status: g.status, deadline: g.deadline, description: g.description,
      }))
    },
  },
  {
    name: 'create_goal', description: 'Create a goal. deadline is required (YYYY-MM-DD).',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string' }, description: { type: 'string' },
        category: { type: 'string', enum: ['career', 'health', 'personal', 'general'] },
        deadline: { type: 'string', description: 'YYYY-MM-DD' },
      },
      required: ['title', 'deadline'], additionalProperties: false,
    },
    async run({ title, description, category, deadline }) {
      const g = await Goal.create({
        user: authUser(), title, description: description || '',
        category: (category || 'general').toLowerCase(), deadline: new Date(deadline),
      })
      return { ok: true, id: String(g._id) }
    },
  },
  {
    name: 'complete_goal', description: 'Mark a goal completed by exact title.',
    inputSchema: { type: 'object', properties: { title: { type: 'string' } }, required: ['title'], additionalProperties: false },
    async run({ title }) {
      const g = await Goal.findOne({ user: authUser() }).where('title').equals(new RegExp(`^${title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'))
      if (!g) return { ok: false, message: `Goal "${title}" not found.` }
      g.status = 'completed'
      await g.save()
      return { ok: true }
    },
  },
  {
    name: 'delete_goal', description: 'Delete a goal by exact title.',
    inputSchema: { type: 'object', properties: { title: { type: 'string' } }, required: ['title'], additionalProperties: false },
    async run({ title }) {
      const res = await Goal.deleteOne({ user: authUser(), title: new RegExp(`^${title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') })
      return { ok: res.deletedCount > 0 }
    },
  },
]

/* ── Minimal MCP (JSON-RPC 2.0 over stdio) ── */
const PROTOCOL_VERSION = '2024-11-05'

function rpc(result, id) { process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id, result }) + '\n') }
function rpcError(code, message, id) { process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id, error: { code, message } }) + '\n') }

async function handleMessage(msg) {
  const { id, method, params } = msg
  try {
    switch (method) {
      case 'initialize':
        return rpc({
          protocolVersion: PROTOCOL_VERSION,
          capabilities: { tools: {} },
          serverInfo: { name: 'mindform', version: '1.0.0', title: 'MindForm' },
        }, id)
      case 'notifications/initialized':
      case 'notifications/cancelled':
        return // no response for notifications
      case 'ping':
        return rpc({}, id)
      case 'tools/list':
        return rpc({ tools: TOOLS.map(t => ({ name: t.name, description: t.description, inputSchema: t.inputSchema })) }, id)
      case 'tools/call': {
        const tool = TOOLS.find(t => t.name === params?.name)
        if (!tool) return rpcError(-32602, `Unknown tool: ${params?.name}`, id)
        const result = await tool.run(params.arguments || {})
        return rpc({ content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }, id)
      }
      default:
        if (id !== undefined) rpcError(-32601, `Method not found: ${method}`, id)
    }
  } catch (e) {
    if (id !== undefined) rpcError(e.name === 'JsonWebTokenError' ? -32001 : -32603, e.message, id)
  }
}

let buffer = ''
process.stdin.setEncoding('utf8')
process.stdin.on('data', chunk => {
  buffer += chunk
  let idx
  while ((idx = buffer.indexOf('\n')) >= 0) {
    const line = buffer.slice(0, idx).trim()
    buffer = buffer.slice(idx + 1)
    if (!line) continue
    try { handleMessage(JSON.parse(line)) } catch { /* ignore malformed line */ }
  }
})

mongoose.connect(MF_URI, { serverSelectionTimeoutMS: 5000 }).then(() => {
  console.error(`[mindform-mcp] connected — ${TOOLS.length} tools ready`)
}).catch(e => {
  console.error('[mindform-mcp] MongoDB connection failed:', e.message)
  process.exit(1)
})
