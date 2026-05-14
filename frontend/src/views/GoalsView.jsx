import React, { useState, useEffect, useCallback } from 'react'
import { Plus, Trash2, Target, CheckCircle2, Clock, XCircle, Edit2, X, Save, Link2, BarChart2, Loader, AlertCircle } from 'lucide-react'
import { goalsAPI, tasksAPI, habitsAPI } from '../api/client'

const CATEGORIES = ['general', 'career', 'health', 'learning', 'finance', 'personal']
const STATUS_COLORS = {
  active: 'var(--cyan)',
  completed: 'var(--green)',
  abandoned: 'var(--red)',
}
const STATUS_ICONS = {
  active: Clock,
  completed: CheckCircle2,
  abandoned: XCircle,
}

function daysLeft(deadline) {
  const diff = new Date(deadline) - new Date()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function DeadlineBadge({ deadline }) {
  const days = daysLeft(deadline)
  const color = days < 0 ? 'var(--red)' : days <= 7 ? 'var(--amber)' : 'var(--green)'
  const label = days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? 'Due today' : `${days}d left`
  return (
    <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color, background: color + '18', padding: '2px 8px', borderRadius: 6, fontWeight: 700 }}>
      {label}
    </span>
  )
}

function GoalForm({ onSave, onCancel, initial, availableTasks, availableHabits }) {
  const [form, setForm] = useState({
    title: initial?.title || '',
    description: initial?.description || '',
    deadline: initial?.deadline ? initial.deadline.slice(0, 10) : '',
    category: initial?.category || 'general',
    linkedTasks: initial?.linkedTasks || [],
    linkedHabits: initial?.linkedHabits || [],
    status: initial?.status || 'active',
  })
  const [saving, setSaving] = useState(false)

  const toggle = (field, item) => {
    setForm(prev => ({
      ...prev,
      [field]: prev[field].includes(item)
        ? prev[field].filter(x => x !== item)
        : [...prev[field], item]
    }))
  }

  const handleSave = async () => {
    if (!form.title.trim() || !form.deadline) return
    setSaving(true)
    try { await onSave(form) } finally { setSaving(false) }
  }

  const input = {
    background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: 10,
    padding: '10px 14px', fontSize: 14, color: 'var(--text-primary)',
    width: '100%', fontFamily: 'var(--font-display)', outline: 'none',
  }

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 24, marginBottom: 20 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--cyan)', marginBottom: 18, letterSpacing: '0.1em' }}>
        {initial ? 'EDIT GOAL' : 'NEW GOAL'}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Goal Title *</label>
          <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
            placeholder="e.g. Complete React Course" style={input} />
        </div>
        <div>
          <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Deadline *</label>
          <input type="date" value={form.deadline} onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))}
            style={{ ...input, colorScheme: 'dark' }} />
        </div>
        <div>
          <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Category</label>
          <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
            style={{ ...input, cursor: 'pointer' }}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
          </select>
        </div>
        {initial && (
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Status</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {['active', 'completed', 'abandoned'].map(s => (
                <button key={s} onClick={() => setForm(p => ({ ...p, status: s }))}
                  style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: `1px solid ${form.status === s ? STATUS_COLORS[s] : 'var(--border)'}`, background: form.status === s ? STATUS_COLORS[s] + '22' : 'transparent', color: form.status === s ? STATUS_COLORS[s] : 'var(--text-muted)', transition: 'all 0.15s' }}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>
        )}
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Description</label>
          <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
            rows={2} placeholder="What does success look like?" style={{ ...input, resize: 'vertical', lineHeight: 1.5 }} />
        </div>
      </div>

      {/* Link Tasks */}
      {availableTasks.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}>
            <Link2 size={11} /> Link Tasks (track progress from your task list)
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {availableTasks.map(t => {
              const on = form.linkedTasks.includes(t)
              return (
                <button key={t} onClick={() => toggle('linkedTasks', t)}
                  style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer', border: `1px solid ${on ? 'var(--cyan)' : 'var(--border)'}`, background: on ? 'var(--cyan-dim)' : 'transparent', color: on ? 'var(--cyan)' : 'var(--text-secondary)', transition: 'all 0.15s' }}>
                  {t}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Link Habits */}
      {availableHabits.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}>
            <Link2 size={11} /> Link Habits
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {availableHabits.map(h => {
              const on = form.linkedHabits.includes(h)
              return (
                <button key={h} onClick={() => toggle('linkedHabits', h)}
                  style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer', border: `1px solid ${on ? 'var(--amber)' : 'var(--border)'}`, background: on ? 'var(--amber-dim)' : 'transparent', color: on ? 'var(--amber)' : 'var(--text-secondary)', transition: 'all 0.15s' }}>
                  {h}
                </button>
              )
            })}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={handleSave} disabled={saving || !form.title.trim() || !form.deadline}
          style={{ background: 'var(--brand-primary)', border: 'none', borderRadius: 10, color: '#000', padding: '10px 22px', fontSize: 14, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8, opacity: saving ? 0.7 : 1 }}>
          {saving ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={14} />}
          {saving ? 'Saving...' : 'Save Goal'}
        </button>
        <button onClick={onCancel}
          style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text-muted)', padding: '10px 18px', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
          <X size={14} /> Cancel
        </button>
      </div>
    </div>
  )
}

function GoalProgress({ goal, taskStats, habitStats }) {
  const taskItems = goal.linkedTasks.map(t => {
    const s = taskStats[t] || { done: 0, total: 0 }
    return { name: t, pct: s.total ? Math.round((s.done / s.total) * 100) : 0 }
  })
  const habitItems = goal.linkedHabits.map(h => {
    const s = habitStats[h] || { done: 0, total: 0 }
    return { name: h, pct: s.total ? Math.round((s.done / s.total) * 100) : 0 }
  })
  const all = [...taskItems, ...habitItems]
  const overall = all.length ? Math.round(all.reduce((s, x) => s + x.pct, 0) / all.length) : 0

  return (
    <div>
      {/* Overall progress bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <div style={{ flex: 1, height: 6, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${overall}%`, background: overall >= 80 ? 'var(--green)' : overall >= 50 ? 'var(--cyan)' : 'var(--amber)', borderRadius: 4, transition: 'width 0.5s ease' }} />
        </div>
        <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)', color: overall >= 80 ? 'var(--green)' : 'var(--cyan)', minWidth: 36 }}>{overall}%</span>
      </div>
      {/* Individual item progress */}
      {all.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {taskItems.map(item => (
            <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-secondary)', background: 'var(--bg-glass)', borderRadius: 6, padding: '3px 8px', border: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--cyan)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{item.pct}%</span>
              <span>{item.name}</span>
            </div>
          ))}
          {habitItems.map(item => (
            <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-secondary)', background: 'var(--bg-glass)', borderRadius: 6, padding: '3px 8px', border: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--amber)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{item.pct}%</span>
              <span>{item.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function GoalsView() {
  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editGoal, setEditGoal] = useState(null)
  const [availableTasks, setAvailableTasks] = useState([])
  const [availableHabits, setAvailableHabits] = useState([])
  const [taskStats, setTaskStats] = useState({})   // { taskName: { done, total } }
  const [habitStats, setHabitStats] = useState({}) // { habitName: { done, total } }
  const [filter, setFilter] = useState('active')

  // Load tasks & habits for linking/progress
  useEffect(() => {
    const now = new Date()
    const yr = now.getFullYear(), mo = now.getMonth()
    const monthKey = `${yr}-${mo}`
    // Get current week key
    const weekNum = Math.ceil(now.getDate() / 7)
    const weekKey = `${yr}-${mo}-w${weekNum}`

    Promise.all([
      tasksAPI.getMonth(monthKey).catch(() => null),
      habitsAPI.getMonth(monthKey).catch(() => null),
    ]).then(([taskRes, habitRes]) => {
      if (taskRes?.data && typeof taskRes.data === 'object') {
        // getMonth returns { weekKey: { tasks, checks, reflection } }
        const allTasks = new Set()
        const stats = {}
        Object.values(taskRes.data).forEach(week => {
          const tasks = week.tasks || []
          const checks = week.checks || {}
          tasks.forEach(t => {
            allTasks.add(t)
            if (!stats[t]) stats[t] = { done: 0, total: 0 }
            // Count from checks: keys are "day-taskName"
            Object.entries(checks).forEach(([key, val]) => {
              const dashIdx = key.indexOf('-')
              const taskName = key.slice(dashIdx + 1)
              if (taskName === t) {
                stats[t].total++
                if (val) stats[t].done++
              }
            })
          })
        })
        setAvailableTasks([...allTasks])
        setTaskStats(stats)
      }
      if (habitRes?.data) {
        const habits = habitRes.data.habits || []
        const checks = habitRes.data.checks || {}
        const days = new Date(yr, mo + 1, 0).getDate()
        const stats = {}
        habits.forEach(h => {
          stats[h.name] = { done: 0, total: days }
          for (let d = 1; d <= days; d++) {
            if (checks[`${d}-${h.name}`]) stats[h.name].done++
          }
        })
        setAvailableHabits(habits.map(h => h.name))
        setHabitStats(stats)
      }
    })
  }, [])

  const loadGoals = useCallback(() => {
    setLoading(true)
    goalsAPI.getAll()
      .then(res => setGoals(res.data || []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { loadGoals() }, [loadGoals])

  const handleCreate = async (form) => {
    await goalsAPI.create(form)
    setShowForm(false)
    loadGoals()
  }

  const handleUpdate = async (form) => {
    await goalsAPI.update(editGoal._id, form)
    setEditGoal(null)
    loadGoals()
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this goal?')) return
    await goalsAPI.delete(id)
    loadGoals()
  }

  const filteredGoals = filter === 'all' ? goals : goals.filter(g => g.status === filter)

  const summaryStats = {
    total: goals.length,
    active: goals.filter(g => g.status === 'active').length,
    completed: goals.filter(g => g.status === 'completed').length,
    overdue: goals.filter(g => g.status === 'active' && daysLeft(g.deadline) < 0).length,
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '20px 24px 0', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 13, color: 'var(--green)', fontWeight: 600, letterSpacing: '0.15em', marginBottom: 6 }}>GOALS</div>
            <h1 style={{ fontSize: 28, fontWeight: 800 }}>My Goals</h1>
          </div>
          <button onClick={() => { setShowForm(true); setEditGoal(null) }}
            style={{ background: 'linear-gradient(135deg, var(--green), #00a86b)', border: 'none', borderRadius: 12, color: '#000', padding: '10px 20px', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Plus size={16} /> Add Goal
          </button>
        </div>

        {/* Summary cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
          {[
            ['Total', summaryStats.total, 'var(--text-primary)', Target],
            ['Active', summaryStats.active, 'var(--cyan)', Clock],
            ['Completed', summaryStats.completed, 'var(--green)', CheckCircle2],
            ['Overdue', summaryStats.overdue, 'var(--red)', AlertCircle],
          ].map(([label, val, color, Icon]) => (
            <div key={label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={18} color={color} />
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 800, fontFamily: 'var(--font-mono)', color }}>{val}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
          {['all', 'active', 'completed', 'abandoned'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding: '6px 16px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: `1px solid ${filter === f ? 'var(--cyan)' : 'var(--border)'}`, background: filter === f ? 'var(--cyan-dim)' : 'transparent', color: filter === f ? 'var(--cyan)' : 'var(--text-muted)', transition: 'all 0.15s' }}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '0 24px 24px' }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>

        {/* Create / Edit form */}
        {showForm && !editGoal && (
          <GoalForm onSave={handleCreate} onCancel={() => setShowForm(false)}
            availableTasks={availableTasks} availableHabits={availableHabits} />
        )}
        {editGoal && (
          <GoalForm initial={editGoal} onSave={handleUpdate} onCancel={() => setEditGoal(null)}
            availableTasks={availableTasks} availableHabits={availableHabits} />
        )}

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: 'var(--text-secondary)', gap: 10 }}>
            <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> Loading goals...
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', color: 'var(--red)', padding: 40 }}>{error}</div>
        ) : filteredGoals.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
            <Target size={48} style={{ marginBottom: 16, opacity: 0.3 }} />
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>No goals yet</div>
            <div style={{ fontSize: 13 }}>Click "Add Goal" to set your first goal</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {filteredGoals.map(goal => {
              const StatusIcon = STATUS_ICONS[goal.status]
              const days = daysLeft(goal.deadline)
              return (
                <div key={goal._id} style={{ background: 'var(--bg-card)', border: `1px solid ${goal.status === 'active' && days < 0 ? 'rgba(255,71,87,0.3)' : 'var(--border)'}`, borderRadius: 'var(--radius-md)', padding: '20px 24px', transition: 'border-color 0.15s' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                    <div style={{ flex: 1 }}>
                      {/* Title row */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <StatusIcon size={18} color={STATUS_COLORS[goal.status]} />
                        <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>{goal.title}</span>
                        <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: 20, padding: '2px 8px', letterSpacing: '0.05em' }}>{goal.category}</span>
                        <DeadlineBadge deadline={goal.deadline} />
                      </div>

                      {goal.description && (
                        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.5 }}>{goal.description}</div>
                      )}

                      {/* Deadline */}
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Clock size={12} />
                        Deadline: <strong style={{ color: 'var(--text-secondary)' }}>{new Date(goal.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</strong>
                      </div>

                      {/* Progress */}
                      {(goal.linkedTasks.length > 0 || goal.linkedHabits.length > 0) && (
                        <div style={{ background: 'var(--bg-glass)', borderRadius: 10, padding: '12px 14px', border: '1px solid var(--border)' }}>
                          <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 5 }}>
                            <BarChart2 size={11} /> LINKED PROGRESS
                          </div>
                          <GoalProgress goal={goal} taskStats={taskStats} habitStats={habitStats} />
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                      <button onClick={() => { setEditGoal(goal); setShowForm(false) }}
                        style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-muted)', padding: '7px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'all 0.15s' }}
                        onMouseEnter={e => { e.currentTarget.style.color = 'var(--cyan)'; e.currentTarget.style.borderColor = 'var(--cyan)' }}
                        onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)' }}>
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => handleDelete(goal._id)}
                        style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-muted)', padding: '7px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'all 0.15s' }}
                        onMouseEnter={e => { e.currentTarget.style.color = 'var(--red)'; e.currentTarget.style.borderColor = 'var(--red)' }}
                        onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
