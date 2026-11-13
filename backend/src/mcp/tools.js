const TaskWeek = require('../models/TaskWeek')
const HabitMonth = require('../models/HabitMonth')
const Goal = require('../models/Goal')
const Fapless = require('../models/Fapless')

/* ═══════════════════════════════════════════════════════════════
   MCP tool implementations — shared by the HTTP MCP endpoint
   (backend/src/mcp/http.js). Every function is scoped to the
   userId resolved from the account key; there is no cross-user
   access by construction.

   13 tools: tasks (3), habits (5), goals (4), overview (1).
   ═══════════════════════════════════════════════════════════════ */

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
const esc = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

function buildTools() {
  const list = [
    {
      name: 'list_tasks', description: "List this week's MindForm tasks with their check-off state.",
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      async run(userId) {
        const doc = await TaskWeek.findOne({ user: userId, weekKey: currentWeekKey() }).lean()
        const tasks = doc?.tasks || []
        const checks = toObj(doc?.checks)
        return { weekKey: currentWeekKey(), tasks: tasks.map(t => ({ title: t, done: !!checks[`1-${t}`] })) }
      },
    },
    {
      name: 'create_task', description: 'Add a task to the current week. Include the time inside the title, e.g. "Deep work (09:00)".',
      inputSchema: { type: 'object', properties: { title: { type: 'string', maxLength: 200 } }, required: ['title'], additionalProperties: false },
      async run(userId, { title }) {
        const weekKey = currentWeekKey()
        const doc = await TaskWeek.findOneAndUpdate(
          { user: userId, weekKey },
          { $addToSet: { tasks: String(title) }, $setOnInsert: { checks: {}, reflection: {} }, $set: { updatedAt: new Date() } },
          { upsert: true, new: true }
        )
        return { ok: true, weekKey, tasks: doc.tasks }
      },
    },
    {
      name: 'delete_task', description: 'Remove a task from the current week by exact title.',
      inputSchema: { type: 'object', properties: { title: { type: 'string' } }, required: ['title'], additionalProperties: false },
      async run(userId, { title }) {
        const weekKey = currentWeekKey()
        const doc = await TaskWeek.findOne({ user: userId, weekKey })
        if (!doc) return { ok: false, message: 'No tasks this week.' }
        doc.tasks = doc.tasks.filter(t => !same(t, title))
        await doc.save()
        return { ok: true, tasks: doc.tasks }
      },
    },
    {
      name: 'list_habits', description: "List this month's habits with completion counts.",
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      async run(userId) {
        const mk = monthKeyOf()
        const doc = await HabitMonth.findOne({ user: userId, monthKey: mk }).lean()
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
        properties: { name: { type: 'string', maxLength: 80 }, emoji: { type: 'string', maxLength: 8 }, time: { type: 'string', description: 'HH:MM' } },
        required: ['name'], additionalProperties: false,
      },
      async run(userId, { name, emoji, time }) {
        const mk = monthKeyOf()
        const exists = await HabitMonth.findOne({ user: userId, monthKey: mk, 'habits.name': name })
        if (exists) return { ok: false, message: `Habit "${name}" already exists this month.` }
        await HabitMonth.findOneAndUpdate(
          { user: userId, monthKey: mk },
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
      async run(userId, { name, newName, emoji, time }) {
        const mk = monthKeyOf()
        const doc = await HabitMonth.findOne({ user: userId, monthKey: mk })
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
      async run(userId, { name }) {
        const mk = monthKeyOf()
        await HabitMonth.findOneAndUpdate(
          { user: userId, monthKey: mk },
          { $pull: { habits: { name } }, $set: { updatedAt: new Date() } }
        )
        return { ok: true }
      },
    },
    {
      name: 'check_habit', description: "Toggle today's check-in for a habit.",
      inputSchema: { type: 'object', properties: { name: { type: 'string' }, done: { type: 'boolean' } }, required: ['name'], additionalProperties: false },
      async run(userId, { name, done = true }) {
        const mk = monthKeyOf()
        const doc = await HabitMonth.findOne({ user: userId, monthKey: mk })
        if (!doc) return { ok: false, message: 'No habits this month.' }
        const h = doc.habits.find(x => same(x.name, name))
        if (!h) return { ok: false, message: `Habit "${name}" not found.` }
        const key = `${new Date().getDate()}-${h.name}`
        if (doc.checks instanceof Map) doc.checks.set(key, !!done)
        else doc.checks[key] = !!done
        await doc.save()
        return { ok: true, key, done: !!done }
      },
    },
    {
      name: 'list_goals', description: 'List all goals with status, category and deadline.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      async run(userId) {
        const goals = await Goal.find({ user: userId }).lean()
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
          title: { type: 'string', maxLength: 120 }, description: { type: 'string', maxLength: 500 },
          category: { type: 'string', enum: ['career', 'health', 'personal', 'general'] },
          deadline: { type: 'string', description: 'YYYY-MM-DD' },
        },
        required: ['title', 'deadline'], additionalProperties: false,
      },
      async run(userId, { title, description, category, deadline }) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(String(deadline))) {
          return { ok: false, message: 'deadline must be YYYY-MM-DD.' }
        }
        const d = new Date(deadline)
        if (Number.isNaN(d.getTime())) return { ok: false, message: 'deadline is not a valid date.' }
        const g = await Goal.create({
          user: userId, title, description: description || '',
          category: (category || 'general').toLowerCase(), deadline: d,
        })
        return { ok: true, id: String(g._id) }
      },
    },
    {
      name: 'complete_goal', description: 'Mark a goal completed by exact title.',
      inputSchema: { type: 'object', properties: { title: { type: 'string' } }, required: ['title'], additionalProperties: false },
      async run(userId, { title }) {
        const g = await Goal.findOne({ user: userId, title: new RegExp(`^${esc(title)}$`, 'i') })
        if (!g) return { ok: false, message: `Goal "${title}" not found.` }
        g.status = 'completed'
        await g.save()
        return { ok: true }
      },
    },
    {
      name: 'delete_goal', description: 'Delete a goal by exact title.',
      inputSchema: { type: 'object', properties: { title: { type: 'string' } }, required: ['title'], additionalProperties: false },
      async run(userId, { title }) {
        const res = await Goal.deleteOne({ user: userId, title: new RegExp(`^${esc(title)}$`, 'i') })
        return { ok: res.deletedCount > 0 }
      },
    },
    {
      name: 'get_overview', description: 'One-call overview: streak, aura, level, active goals and this week’s task/habit progress.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      async run(userId) {
        const now = new Date()
        const mk = monthKeyOf(now)
        const wk = currentWeekKey(now)
        const [taskDoc, habitDoc, activeGoals, completedGoals, fap] = await Promise.all([
          TaskWeek.findOne({ user: userId, weekKey: wk }).lean(),
          HabitMonth.findOne({ user: userId, monthKey: mk }).lean(),
          Goal.countDocuments({ user: userId, status: 'active' }),
          Goal.countDocuments({ user: userId, status: 'completed' }),
          Fapless.findOne({ user: userId }).lean(),
        ])
        const { computeStreakStats } = require('../utils/aura')
        const streak = computeStreakStats(fap || {})
        const checks = toObj(taskDoc?.checks)
        const tasks = (taskDoc?.tasks || []).map(t => ({ title: t, done: !!checks[`1-${t}`] }))
        const habitChecks = toObj(habitDoc?.checks)
        const habits = (habitDoc?.habits || []).map(h => ({
          name: h.name,
          doneDays: Object.entries(habitChecks).filter(([k, v]) => v && k.endsWith(`-${h.name}`)).length,
        }))
        return {
          today: now.toDateString(),
          weekKey: wk, monthKey: mk,
          streakDays: streak.streakDays, aura: streak.aura, level: streak.level,
          goals: { active: activeGoals, completed: completedGoals },
          tasks, habits,
        }
      },
    },
  ]
  return list
}

const TOOLS = buildTools()

module.exports = { TOOLS, monthKeyOf, currentWeekKey, getWeekDays, getWeeksInMonth }
