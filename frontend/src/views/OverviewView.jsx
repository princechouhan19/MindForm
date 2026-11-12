import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { ArrowUpRight, Flame, CheckSquare, Activity, Target, ChevronRight, Loader, Sparkles, Users2, Mic } from 'lucide-react'
import { tasksAPI, habitsAPI, goalsAPI, faplessAPI } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { MFBarChart, MFRing } from '../components/MFCharts'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

function getWeekKey(date) {
  const y = date.getFullYear()
  const m = date.getMonth()
  const firstDay = new Date(y, m, 1)
  const startOffset = firstDay.getDay()
  const weekNum = Math.ceil((startOffset + date.getDate()) / 7)
  return `${y}-${m}-w${weekNum}`
}

function greeting() {
  const h = new Date().getHours()
  if (h < 5) return 'Good night'
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

// Combined task + habit completion for each of the last `days` days
// (Apple Health-style trend for the dashboard)
function buildTrend(taskByWeek, habitByMonth, days = 14) {
  const now = new Date()
  const out = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
    const dayNum = d.getDate()
    const wk = taskByWeek[getWeekKey(d)]
    const names = (wk?.tasks || []).map(t => String(t).split('|')[0])
    const tChecks = wk?.checks || {}
    const tDone = names.filter(n => tChecks[`${dayNum}-${n}`]).length
    const tPct = names.length ? (tDone / names.length) * 100 : null
    const hm = habitByMonth[`${d.getFullYear()}-${d.getMonth()}`]
    const hChecks = hm?.checks || {}
    const habits = hm?.habits || []
    const hDone = habits.filter(h => hChecks[`${dayNum}-${h.name}`]).length
    const hPct = habits.length ? (hDone / habits.length) * 100 : null
    const signals = [tPct, hPct].filter(v => v !== null)
    const combined = signals.length ? Math.round(signals.reduce((a, b) => a + b, 0) / signals.length) : null
    out.push({
      label: i === 0 ? 'Today' : WEEKDAYS[d.getDay()][0],
      value: combined ?? 0,
      isToday: i === 0,
    })
  }
  return out
}

function Ring({ percent, size = 92, color = 'var(--brand-primary)', label }) {
  return <MFRing percent={percent} size={size} stroke={8} color={color} label={label} />
}

function ModuleCard({ icon: Icon, color, title, value, sub, onClick, delay = 0 }) {
  const [entered, setEntered] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setEntered(true), delay)
    return () => clearTimeout(t)
  }, [delay])
  return (
    <button
      onClick={onClick}
      className="animate-in"
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 12,
        padding: '20px 22px', borderRadius: 'var(--radius-xl)',
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        color: 'var(--text-primary)', textAlign: 'left', cursor: 'pointer',
        width: '100%', fontFamily: 'var(--font-body)',
        opacity: entered ? 1 : 0,
        transition: 'opacity 0.5s var(--ease-out-expo), transform 0.25s var(--ease-apple), border-color 0.25s, box-shadow 0.3s',
        transform: entered ? 'none' : 'translateY(14px)',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-bright)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        <div style={{
          width: 38, height: 38, borderRadius: 11,
          background: `color-mix(in srgb, ${color} 13%, transparent)`,
          border: `1px solid color-mix(in srgb, ${color} 26%, transparent)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={17} style={{ color }} />
        </div>
        <ArrowUpRight size={16} style={{ color: 'var(--text-muted)' }} />
      </div>
      <div>
        <div style={{ fontSize: 28, fontWeight: 600, fontFamily: 'var(--font-display)', letterSpacing: '-0.022em', lineHeight: 1.05 }}>{value}</div>
        <div style={{ fontSize: 13.5, fontWeight: 600, marginTop: 3 }}>{title}</div>
        {sub && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, fontWeight: 600 }}>{sub}</div>}
      </div>
    </button>
  )
}

export default function OverviewView({ onNavigate }) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [taskDone, setTaskDone] = useState(0)
  const [taskTotal, setTaskTotal] = useState(0)
  const [habitDone, setHabitDone] = useState(0)
  const [habitTotal, setHabitTotal] = useState(0)
  const [goals, setGoals] = useState({ active: 0, completed: 0, closest: null })
  const [streak, setStreak] = useState({ days: 0, level: null, aura: 0 })
  const [trend, setTrend] = useState([])

  const today = new Date()
  const dayName = WEEKDAYS[today.getDay()]
  const dateLabel = `${MONTHS[today.getMonth()]} ${today.getDate()}`

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const now = new Date()
        const monthKey = `${now.getFullYear()}-${now.getMonth()}`
        const weekKey = getWeekKey(now)
        const dayNum = now.getDate()

        // Tasks — today's checks + 14-day trend (fetch both months if the window crosses one)
        try {
          const monthKeys = new Set()
          for (let i = 0; i < 14; i++) {
            const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
            monthKeys.add(`${d.getFullYear()}-${d.getMonth()}`)
          }
          const taskByWeek = {}
          for (const mk of monthKeys) {
            try {
              const wk = await tasksAPI.getMonth(mk)
              Object.entries(wk?.data || {}).forEach(([k, v]) => { taskByWeek[k] = v })
            } catch { /* non-fatal */ }
          }
          const habitByMonth = {}
          for (const mk of monthKeys) {
            try {
              const hm = await habitsAPI.getMonth(mk)
              if (hm?.data) habitByMonth[mk] = hm.data
            } catch { /* non-fatal */ }
          }

          const week = taskByWeek[weekKey]
          const names = (week?.tasks || []).map(t => String(t).split('|')[0])
          const checks = week?.checks || {}
          const done = names.filter(n => checks[`${dayNum}-${n}`]).length
          if (!cancelled) { setTaskTotal(names.length); setTaskDone(done) }

          if (!cancelled) setTrend(buildTrend(taskByWeek, habitByMonth, 14))
        } catch { /* non-fatal */ }

        // Habits (today's checks)
        try {
          const hm = await habitsAPI.getMonth(monthKey)
          const habits = hm?.data?.habits || []
          const checks = hm?.data?.checks || {}
          const done = habits.filter(h => checks[`${dayNum}-${h.name}`]).length
          if (!cancelled) { setHabitTotal(habits.length); setHabitDone(done) }
        } catch { /* non-fatal */ }

        // Goals
        try {
          const g = await goalsAPI.getAll()
          const list = (g?.data || []).filter(x => x && x.title)
          const active = list.filter(x => x.status === 'active').length
          const completed = list.filter(x => x.status === 'completed').length
          const withDeadline = list
            .filter(x => x.status === 'active' && x.deadline)
            .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))[0]
          if (!cancelled) setGoals({ active, completed, closest: withDeadline })
        } catch { /* non-fatal */ }

        // Streak
        try {
          const f = await faplessAPI.get()
          const d = f?.data
          if (d?.startDate) {
            const days = Math.max(0, Math.floor((Date.now() - new Date(d.startDate).getTime()) / 86400000))
            if (!cancelled) setStreak(s => ({ ...s, days }))
          }
        } catch { /* non-fatal */ }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const firstName = (user?.name || '').split(' ')[0]

  const taskPct = taskTotal ? (taskDone / taskTotal) * 100 : 0
  const habitPct = habitTotal ? (habitDone / habitTotal) * 100 : 0

  const closestGoal = goals.closest
  const daysLeft = closestGoal ? Math.max(0, Math.ceil((new Date(closestGoal.deadline) - today) / 86400000)) : null

  return (
    <div className="view-scroll" style={{ padding: '0 clamp(16px,3vw,32px) 60px', overflowY: 'auto', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '28px 6px 10px' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          {dayName}, {dateLabel}
        </div>
        <h1 style={{ fontSize: 32, fontWeight: 600, fontFamily: 'var(--font-display)', letterSpacing: '-0.022em', marginTop: 6, marginBottom: 4 }}>
          {greeting()}{firstName ? `, ${firstName}` : ''}.
        </h1>
        <p style={{ fontSize: 15.5, color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}>
          Here’s where your discipline stands today.
        </p>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '90px 0', color: 'var(--text-muted)' }}>
          <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} />
          <span style={{ fontSize: 14 }}>Loading your day…</span>
        </div>
      ) : (
        <>
          {/* Progress duo */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(300px, 100%), 1fr))',
            gap: 16, marginTop: 18,
          }}>
            {/* Tasks */}
            <button
              onClick={() => onNavigate('tasks')}
              className="animate-in"
              style={{
                display: 'flex', alignItems: 'center', gap: 20, padding: '22px 24px',
                borderRadius: 'var(--radius-xl)', background: 'var(--bg-card)',
                border: '1px solid var(--border)', cursor: 'pointer', textAlign: 'left',
                color: 'var(--text-primary)', fontFamily: 'var(--font-body)', width: '100%',
                transition: 'border-color 0.25s, transform 0.25s var(--ease-apple)',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-bright)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none' }}
            >
              <Ring percent={taskPct} color="var(--cyan)" label="Tasks" />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: '-0.01em' }}>Today’s tasks</div>
                <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>
                  {taskTotal ? `${taskDone} of ${taskTotal} complete` : 'No tasks scheduled — add some'}
                </div>
                {taskTotal > 0 && taskDone < taskTotal && (
                  <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 6 }}>
                    {taskTotal - taskDone} left — finish strong.
                  </div>
                )}
                {taskTotal > 0 && taskDone === taskTotal && (
                  <div style={{ fontSize: 12.5, color: 'var(--green)', marginTop: 6, fontWeight: 600 }}>
                    All clear. Beautiful work. 🎉
                  </div>
                )}
              </div>
            </button>

            {/* Habits */}
            <button
              onClick={() => onNavigate('habits')}
              className="animate-in"
              style={{
                display: 'flex', alignItems: 'center', gap: 20, padding: '22px 24px',
                borderRadius: 'var(--radius-xl)', background: 'var(--bg-card)',
                border: '1px solid var(--border)', cursor: 'pointer', textAlign: 'left',
                color: 'var(--text-primary)', fontFamily: 'var(--font-body)', width: '100%',
                transition: 'border-color 0.25s, transform 0.25s var(--ease-apple)',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-bright)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none' }}
            >
              <Ring percent={habitPct} color="var(--amber)" label="Habits" />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: '-0.01em' }}>Habit check-in</div>
                <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>
                  {habitTotal ? `${habitDone} of ${habitTotal} done today` : 'No habits yet — start a chain'}
                </div>
                {habitTotal > 0 && habitDone < habitTotal && (
                  <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 6 }}>
                    {habitTotal - habitDone} remaining — keep the chain alive.
                  </div>
                )}
              </div>
            </button>
          </div>

          {/* 14-day activity trend — Apple Health style */}
          {trend.length > 0 && (
            <div className="animate-in" style={{
              marginTop: 16, padding: '18px 20px 8px',
              borderRadius: 'var(--radius-xl)', background: 'var(--bg-card)',
              border: '1px solid var(--border)',
            }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
                <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em' }}>Last 14 days</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
                  daily completion · tasks & habits
                </div>
              </div>
              <MFBarChart
                data={trend}
                height={110}
                color="var(--brand-primary)"
                emphasizeMax={false}
                highlightIndex={trend.length - 1}
                showTicks
              />
            </div>
          )}

          {/* Stat row */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(210px, 100%), 1fr))',
            gap: 16, marginTop: 16,
          }}>
            <ModuleCard icon={Flame} color="var(--red)" title="Current streak" value={streak.days} sub={streak.days > 0 ? 'days and counting' : 'not started'} onClick={() => onNavigate('fapless')} delay={80} />
            <ModuleCard icon={Target} color="var(--brand-secondary)" title="Active goals" value={goals.active} sub={goals.completed ? `${goals.completed} completed` : 'set your next one'} onClick={() => onNavigate('goals')} delay={140} />
            {closestGoal && (
              <ModuleCard
                icon={Target} color="var(--green)" title={closestGoal.title}
                value={daysLeft} sub={daysLeft === 1 ? 'day to deadline' : 'days to deadline'}
                onClick={() => onNavigate('goals')} delay={200}
              />
            )}
          </div>

          {/* Quick nav */}
          <div style={{ marginTop: 26 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>
              Jump to
            </div>
            <div style={{
              background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--border)', overflow: 'hidden',
            }}>
              {[
                { id: 'tasks', icon: CheckSquare, color: 'var(--cyan)', label: 'Task Tracker', desc: 'Plan and check off today’s tasks' },
                { id: 'habits', icon: Activity, color: 'var(--amber)', label: 'Habit Tracker', desc: 'Your 30-day consistency grid' },
                { id: 'goals', icon: Target, color: 'var(--brand-secondary)', label: 'Goals', desc: 'Long-term targets with linked progress' },
                { id: 'fapless', icon: Flame, color: 'var(--red)', label: 'Fapless', desc: 'Discipline streaks, levels and aura' },
                { id: 'voice', icon: Mic, color: 'var(--brand-teal)', label: 'Speak', desc: 'Voice & communication studio — new' },
                { id: 'social', icon: Users2, color: 'var(--pink)', label: 'Social', desc: 'Leaderboard, forum and your profile' },
                { id: 'ai', icon: Sparkles, color: 'var(--purple)', label: 'AI Coach', desc: 'Advice grounded in your data' },
              ].map(({ id, icon: Icon, color, label, desc }, i) => (
                <button
                  key={id}
                  onClick={() => onNavigate(id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14, width: '100%',
                    padding: '14px 18px', background: 'none', border: 'none',
                    borderBottom: i < 6 ? '1px solid var(--border)' : 'none',
                    color: 'var(--text-primary)', textAlign: 'left', cursor: 'pointer',
                    fontFamily: 'var(--font-body)', transition: 'background 0.18s', minHeight: 56,
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-glass)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  <div style={{
                    width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                    background: `color-mix(in srgb, ${color} 13%, transparent)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon size={16} style={{ color }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 600 }}>{label}</div>
                    <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{desc}</div>
                  </div>
                  <ChevronRight size={17} style={{ color: 'var(--text-muted)' }} />
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
