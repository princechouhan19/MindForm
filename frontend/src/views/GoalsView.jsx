import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Plus, Trash2, Target, CheckCircle2, Clock, XCircle, Pencil, X, Save,
  Link2, Loader, AlertCircle, Flag, ChevronDown, ChevronUp, RotateCcw,
  Zap, CalendarDays, TrendingUp, TrendingDown, Minus
} from 'lucide-react'
import { goalsAPI, tasksAPI, habitsAPI } from '../api/client'
import { useToast } from '../components/Toast'
import { useConfirm } from '../components/ConfirmDialog'
import { MFRing } from '../components/MFCharts'

const CATEGORIES = ['general', 'career', 'health', 'learning', 'finance', 'personal']

const STATUS_META = {
  active:    { color: 'var(--brand-primary)', label: 'Active' },
  completed: { color: 'var(--brand-success)', label: 'Completed' },
  abandoned: { color: 'var(--text-muted)',    label: 'Abandoned' },
}

// One-tap starters — reduce blank-page friction (goal-setting research:
// specific + measurable + deadline-driven goals are far more likely to complete)
const TEMPLATES = [
  {
    title: 'Read 12 books this year',
    category: 'learning',
    spanDays: 365,
    milestones: ['Book 1–3', 'Book 4–6', 'Book 7–9', 'Book 10–12'],
  },
  {
    title: 'Run a 5K under 30 minutes',
    category: 'health',
    spanDays: 90,
    milestones: ['Run 1 km non-stop', 'Run 3 km non-stop', 'Run 5 km (any pace)', '5K under 30 min'],
  },
  {
    title: 'Ship a personal project',
    category: 'career',
    spanDays: 60,
    milestones: ['Define scope & specs', 'Finish v0.1 prototype', 'Beta feedback round', 'Public launch'],
  },
  {
    title: 'Build a ₹50,000 emergency fund',
    category: 'finance',
    spanDays: 180,
    milestones: ['Save first ₹10,000', 'Reach ₹25,000', 'Reach ₹40,000', 'Hit ₹50,000'],
  },
]

function daysLeft(deadline) {
  const diff = new Date(deadline) - new Date()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function fmtDate(d) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

/* Pace = where progress *should* be today vs where it actually is.
   Based on the goal's creation→deadline window. */
function paceInfo(goal, overall) {
  const start = new Date(goal.createdAt || Date.now()).getTime()
  const end = new Date(goal.deadline).getTime()
  const now = Date.now()
  const span = end - start
  const expected = span > 0 ? Math.max(0, Math.min(100, Math.round(((now - start) / span) * 100))) : 0
  const left = daysLeft(goal.deadline)

  if (left < 0) {
    return { expected, chip: 'Overdue', color: 'var(--brand-error)', icon: AlertCircle, detail: `${Math.abs(left)}d past deadline` }
  }
  if (overall >= expected + 15) return { expected, chip: 'Ahead of pace', color: 'var(--brand-success)', icon: TrendingUp, detail: `${left}d left` }
  if (overall >= expected - 12) return { expected, chip: 'On track', color: 'var(--brand-primary)', icon: Minus, detail: `${left}d left` }
  return { expected, chip: 'Behind pace', color: 'var(--brand-orange)', icon: TrendingDown, detail: `${left}d left` }
}

/* Overall progress combines every available signal:
   milestone completion + linked task + linked habit performance. */
function goalProgress(goal, taskStats, habitStats) {
  const milestonePct = goal.milestones?.length
    ? Math.round((goal.milestones.filter(m => m.done).length / goal.milestones.length) * 100)
    : null

  const taskItems = (goal.linkedTasks || []).map(t => {
    const s = taskStats[t] || { done: 0, total: 0 }
    return { name: t, pct: s.total ? Math.round((s.done / s.total) * 100) : 0 }
  })
  const habitItems = (goal.linkedHabits || []).map(h => {
    const s = habitStats[h] || { done: 0, total: 0 }
    return { name: h, pct: s.total ? Math.round((s.done / s.total) * 100) : 0 }
  })
  const linked = [...taskItems, ...habitItems]
  const linkedPct = linked.length ? Math.round(linked.reduce((s, x) => s + x.pct, 0) / linked.length) : null

  const signals = [milestonePct, linkedPct].filter(v => v !== null)
  const overall = signals.length ? Math.round(signals.reduce((a, b) => a + b, 0) / signals.length) : 0

  return { overall, milestonePct, taskItems, habitItems, linked, linkedPct }
}

/* ── iOS-style segmented control ─────────────────────────────── */
function Segmented({ options, value, onChange }) {
  return (
    <div style={{
      display: 'inline-flex', background: 'var(--bg-glass)', borderRadius: 9, padding: 2,
      border: '1px solid var(--border)',
    }}>
      {options.map(o => {
        const active = value === o.id
        return (
          <button key={o.id} onClick={() => onChange(o.id)}
            style={{
              padding: '6px 14px', borderRadius: 7, fontSize: 12.5, fontWeight: 600,
              cursor: 'pointer', border: 'none', minHeight: 30,
              background: active ? 'var(--bg-card)' : 'transparent',
              color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
              boxShadow: active ? 'var(--shadow-sm)' : 'none',
              transition: 'all 0.18s var(--ease-apple)',
            }}>
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

/* ── Create / Edit form ──────────────────────────────────────── */
function GoalForm({ onSave, onCancel, initial, availableTasks, availableHabits, isEdit }) {
  const [form, setForm] = useState({
    title: initial?.title || '',
    description: initial?.description || '',
    deadline: initial?.deadline ? initial.deadline.slice(0, 10) : '',
    category: initial?.category || 'general',
    linkedTasks: initial?.linkedTasks || [],
    linkedHabits: initial?.linkedHabits || [],
    milestones: initial?.milestones?.map(m => ({ id: m.id, title: m.title, done: m.done })) || [],
    status: initial?.status || 'active',
  })
  const [newMilestone, setNewMilestone] = useState('')
  const [saving, setSaving] = useState(false)

  const toggle = (field, item) => {
    setForm(prev => ({
      ...prev,
      [field]: prev[field].includes(item)
        ? prev[field].filter(x => x !== item)
        : [...prev[field], item]
    }))
  }

  const addMilestone = () => {
    if (!newMilestone.trim()) return
    setForm(p => ({
      ...p,
      milestones: [...p.milestones, { id: Math.random().toString(36).slice(2, 10), title: newMilestone.trim(), done: false }],
    }))
    setNewMilestone('')
  }

  const applyTemplate = (t) => {
    const dl = new Date()
    dl.setDate(dl.getDate() + t.spanDays)
    setForm(p => ({
      ...p,
      title: t.title,
      category: t.category,
      deadline: p.deadline || dl.toISOString().slice(0, 10),
      milestones: t.milestones.map(title => ({ id: Math.random().toString(36).slice(2, 10), title, done: false })),
    }))
  }

  const handleSave = async () => {
    if (!form.title.trim() || !form.deadline) return
    setSaving(true)
    try { await onSave(form) } finally { setSaving(false) }
  }

  const input = {
    background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: 10,
    padding: '11px 14px', fontSize: 15, color: 'var(--text-primary)',
    width: '100%', fontFamily: 'var(--font-body)', outline: 'none',
  }
  const label = { fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 6, fontWeight: 600 }

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: 24, marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--text-primary)' }}>
          {isEdit ? 'Edit Goal' : 'New Goal'}
        </div>
        <button onClick={onCancel} aria-label="Close form"
          style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-glass)', border: 'none', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <X size={15} />
        </button>
      </div>

      {/* Templates — only on create, only until user types */}
      {!isEdit && !form.title && (
        <div style={{ marginBottom: 18 }}>
          <div style={{ ...label }}>Start from a template <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>— or write your own below</span></div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {TEMPLATES.map(t => (
              <button key={t.title} onClick={() => applyTemplate(t)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7, padding: '9px 14px', borderRadius: 'var(--radius-pill)',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  background: 'var(--brand-primary-dim)', border: '1px solid var(--brand-primary-glow)', color: 'var(--brand-primary)',
                  transition: 'all 0.15s', minHeight: 38,
                }}>
                <Zap size={13} /> {t.title}
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))', gap: 14, marginBottom: 14 }}>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={label}>Goal Title *</label>
          <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
            placeholder="e.g. Complete React Course" style={input} />
        </div>
        <div>
          <label style={label}><CalendarDays size={11} style={{ verticalAlign: -1 }} /> Deadline *</label>
          <input type="date" value={form.deadline} onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))}
            style={{ ...input, colorScheme: 'dark' }} />
        </div>
        <div>
          <label style={label}>Category</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {CATEGORIES.map(c => {
              const on = form.category === c
              return (
                <button key={c} onClick={() => setForm(p => ({ ...p, category: c }))}
                  style={{
                    padding: '8px 13px', borderRadius: 'var(--radius-pill)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
                    minHeight: 36, textTransform: 'capitalize',
                    border: `1px solid ${on ? 'var(--brand-primary)' : 'var(--border)'}`,
                    background: on ? 'var(--brand-primary-dim)' : 'transparent',
                    color: on ? 'var(--brand-primary)' : 'var(--text-secondary)',
                    transition: 'all 0.15s',
                  }}>
                  {c}
                </button>
              )
            })}
          </div>
        </div>
        {isEdit && (
          <div>
            <label style={label}>Status</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {Object.entries(STATUS_META).map(([s, meta]) => (
                <button key={s} onClick={() => setForm(p => ({ ...p, status: s }))}
                  style={{ padding: '8px 14px', borderRadius: 9, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', minHeight: 36, border: `1px solid ${form.status === s ? meta.color : 'var(--border)'}`, background: form.status === s ? `color-mix(in srgb, ${meta.color} 14%, transparent)` : 'transparent', color: form.status === s ? meta.color : 'var(--text-muted)', transition: 'all 0.15s' }}>
                  {meta.label}
                </button>
              ))}
            </div>
          </div>
        )}
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={label}>Description</label>
          <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
            rows={2} placeholder="What does success look like?" style={{ ...input, resize: 'vertical', lineHeight: 1.5 }} />
        </div>
      </div>

      {/* Milestones */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ ...label, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Flag size={12} /> Milestones — measurable checkpoints toward the goal
        </label>
        {form.milestones.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
            {form.milestones.map((m, i) => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: 9, padding: '8px 12px' }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', width: 18 }}>{i + 1}</span>
                <span style={{ flex: 1, fontSize: 13.5, color: 'var(--text-primary)' }}>{m.title}</span>
                <button onClick={() => setForm(p => ({ ...p, milestones: p.milestones.filter(x => x.id !== m.id) }))}
                  aria-label="Remove milestone"
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: 4 }}>
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={newMilestone} onChange={e => setNewMilestone(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addMilestone())}
            placeholder="Add a checkpoint (e.g. Finish chapter 1–3)" style={{ ...input, flex: 1, minWidth: 0 }} />
          <button onClick={addMilestone}
            style={{ flexShrink: 0, width: 44, height: 44, borderRadius: 11, background: 'var(--brand-primary)', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <Plus size={18} />
          </button>
        </div>
      </div>

      {/* Link Tasks */}
      {availableTasks.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <label style={{ ...label, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Link2 size={12} /> Link Tasks (progress flows in automatically)
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {availableTasks.map(t => {
              const on = form.linkedTasks.includes(t)
              return (
                <button key={t} onClick={() => toggle('linkedTasks', t)}
                  style={{ padding: '6px 12px', minHeight: 32, borderRadius: 'var(--radius-pill)', fontSize: 12, cursor: 'pointer', border: `1px solid ${on ? 'var(--brand-primary)' : 'var(--border)'}`, background: on ? 'var(--brand-primary-dim)' : 'transparent', color: on ? 'var(--brand-primary)' : 'var(--text-secondary)', transition: 'all 0.15s' }}>
                  {t}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Link Habits */}
      {availableHabits.length > 0 && (
        <div style={{ marginBottom: 18 }}>
          <label style={{ ...label, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Link2 size={12} /> Link Habits
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {availableHabits.map(h => {
              const on = form.linkedHabits.includes(h)
              return (
                <button key={h} onClick={() => toggle('linkedHabits', h)}
                  style={{ padding: '6px 12px', minHeight: 32, borderRadius: 'var(--radius-pill)', fontSize: 12, cursor: 'pointer', border: `1px solid ${on ? 'var(--brand-orange)' : 'var(--border)'}`, background: on ? 'var(--amber-dim)' : 'transparent', color: on ? 'var(--brand-orange)' : 'var(--text-secondary)', transition: 'all 0.15s' }}>
                  {h}
                </button>
              )
            })}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={handleSave} disabled={saving || !form.title.trim() || !form.deadline}
          style={{ background: 'var(--btn-primary-bg)', border: 'none', borderRadius: 980, color: '#fff', padding: '10px 22px', fontSize: 15, fontWeight: 400, letterSpacing: '-0.022em', cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8, opacity: saving ? 0.7 : 1, minHeight: 44, transition: 'transform 0.15s ease' }}>
          {saving ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={14} />}
          {saving ? 'Saving…' : 'Save Goal'}
        </button>
        <button onClick={onCancel}
          style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)', padding: '12px 20px', fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, minHeight: 44 }}>
          Cancel
        </button>
      </div>
    </div>
  )
}

/* ── Goal card ───────────────────────────────────────────────── */
function GoalCard({ goal, taskStats, habitStats, onEdit, onDelete, onToggleMilestone, onQuickAddMilestone, onSetStatus, isMobile }) {
  const [expanded, setExpanded] = useState(false)
  const [quickAdd, setQuickAdd] = useState('')
  const { overall, milestonePct, taskItems, habitItems } = goalProgress(goal, taskStats, habitStats)
  const pace = goal.status === 'active' ? paceInfo(goal, overall) : null
  const statusMeta = STATUS_META[goal.status] || STATUS_META.active
  const dl = daysLeft(goal.deadline)

  const ringColor = goal.status === 'completed' ? 'var(--brand-success)'
    : goal.status === 'abandoned' ? 'var(--text-muted)'
    : overall >= 80 ? 'var(--brand-success)' : overall >= 40 ? 'var(--brand-primary)' : 'var(--brand-orange)'

  const hasDetails = (goal.milestones?.length || 0) > 0 || taskItems.length > 0 || habitItems.length > 0 || goal.description

  const iconBtn = { background: 'none', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text-muted)', width: 40, height: 40, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s', flexShrink: 0 }

  return (
    <div style={{ background: 'var(--bg-card)', border: `1px solid ${goal.status === 'active' && dl < 0 ? 'var(--red-dim)' : 'var(--border)'}`, borderRadius: 'var(--radius-xl)', padding: isMobile ? '18px 16px' : '20px 22px', transition: 'border-color 0.15s' }}>
      {/* Top row: ring + identity */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        <MFRing percent={overall} size={64} stroke={7} color={ringColor} track="var(--border)" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{
              fontSize: 10.5, fontWeight: 600, color: statusMeta.color,
              background: `color-mix(in srgb, ${statusMeta.color} 12%, transparent)`,
              border: `1px solid color-mix(in srgb, ${statusMeta.color} 30%, transparent)`,
              borderRadius: 'var(--radius-pill)', padding: '2px 9px', letterSpacing: '0.04em', textTransform: 'uppercase',
            }}>{statusMeta.label}</span>
            <span style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--text-muted)', background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: 'var(--radius-pill)', padding: '2px 9px', textTransform: 'capitalize' }}>{goal.category}</span>
            {pace && (
              <span style={{ fontSize: 10.5, fontWeight: 600, color: pace.color, background: `color-mix(in srgb, ${pace.color} 12%, transparent)`, borderRadius: 'var(--radius-pill)', padding: '2px 9px', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <pace.icon size={10} /> {pace.chip}
              </span>
            )}
          </div>
          <div style={{ fontSize: isMobile ? 16.5 : 17.5, fontWeight: 600, color: 'var(--text-primary)', marginTop: 7, letterSpacing: '-0.01em', lineHeight: 1.3 }}>
            {goal.title}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)', marginTop: 5, flexWrap: 'wrap' }}>
            <Clock size={11} />
            {fmtDate(goal.deadline)}
            {goal.status === 'active' && (
              <span style={{ color: dl < 0 ? 'var(--brand-error)' : dl <= 7 ? 'var(--brand-orange)' : 'var(--text-muted)', fontWeight: 600 }}>
                · {dl < 0 ? `${Math.abs(dl)}d overdue` : dl === 0 ? 'due today' : `${dl}d left`}
              </span>
            )}
            {milestonePct !== null && (
              <span style={{ color: 'var(--text-muted)' }}>· {goal.milestones.filter(m => m.done).length}/{goal.milestones.length} milestones</span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          {goal.status === 'active' && (
            <button onClick={() => onSetStatus(goal, 'completed')} aria-label="Mark goal complete" title="Mark complete"
              style={{ ...iconBtn, color: 'var(--brand-success)', borderColor: 'var(--border)' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--brand-success)'; e.currentTarget.style.background = 'var(--green-dim)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'none' }}>
              <CheckCircle2 size={16} />
            </button>
          )}
          {goal.status !== 'active' && (
            <button onClick={() => onSetStatus(goal, 'active')} aria-label="Reopen goal" title="Reopen"
              style={iconBtn}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--brand-primary)'; e.currentTarget.style.borderColor = 'var(--brand-primary)' }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)' }}>
              <RotateCcw size={15} />
            </button>
          )}
          <button onClick={() => onEdit(goal)} aria-label="Edit goal" style={iconBtn}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--brand-primary)'; e.currentTarget.style.borderColor = 'var(--brand-primary)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)' }}>
            <Pencil size={15} />
          </button>
          <button onClick={() => onDelete(goal._id)} aria-label="Delete goal" style={iconBtn}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--brand-error)'; e.currentTarget.style.borderColor = 'var(--brand-error)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)' }}>
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* Description preview */}
      {goal.description && !expanded && (
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 12, lineHeight: 1.55, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {goal.description}
        </div>
      )}

      {/* Expand toggle */}
      {hasDetails && (
        <button onClick={() => setExpanded(e => !e)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, marginTop: 12, background: 'none', border: 'none',
            color: 'var(--brand-primary)', fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: '6px 0', minHeight: 32,
          }}>
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {expanded ? 'Hide details' : `Details${goal.milestones?.length ? ` · ${goal.milestones.length} milestones` : ''}${(taskItems.length + habitItems.length) ? ` · ${taskItems.length + habitItems.length} linked` : ''}`}
        </button>
      )}

      {/* Expanded details */}
      {expanded && (
        <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {goal.description && (
            <div style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{goal.description}</div>
          )}

          {/* Milestones checklist */}
          {(goal.milestones?.length || 0) > 0 && (
            <div style={{ background: 'var(--bg-glass)', borderRadius: 12, padding: '14px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Flag size={11} /> MILESTONES — {goal.milestones.filter(m => m.done).length}/{goal.milestones.length}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {goal.milestones.map(m => (
                  <label key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 6px', borderRadius: 8, cursor: 'pointer', minHeight: 36 }}>
                    <input type="checkbox" checked={m.done} onChange={() => onToggleMilestone(goal, m)}
                      style={{ width: 17, height: 17, accentColor: 'var(--brand-success)', cursor: 'pointer', flexShrink: 0 }} />
                    <span style={{ fontSize: 13.5, color: m.done ? 'var(--text-muted)' : 'var(--text-primary)', textDecoration: m.done ? 'line-through' : 'none', lineHeight: 1.35 }}>{m.title}</span>
                  </label>
                ))}
              </div>
              {/* Quick add inline */}
              <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                <input value={quickAdd} onChange={e => setQuickAdd(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && quickAdd.trim()) { onQuickAddMilestone(goal, quickAdd.trim()); setQuickAdd('') } }}
                  placeholder="Add milestone…" style={{ flex: 1, minWidth: 0, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: 'var(--text-primary)' }} />
                <button onClick={() => { if (quickAdd.trim()) { onQuickAddMilestone(goal, quickAdd.trim()); setQuickAdd('') } }}
                  style={{ flexShrink: 0, width: 36, height: 36, borderRadius: 9, background: 'var(--brand-primary-dim)', border: '1px solid var(--brand-primary-glow)', color: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <Plus size={15} />
                </button>
              </div>
            </div>
          )}

          {/* Linked progress */}
          {(taskItems.length > 0 || habitItems.length > 0) && (
            <div style={{ background: 'var(--bg-glass)', borderRadius: 12, padding: '14px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Link2 size={11} /> LINKED PROGRESS
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                {taskItems.map(item => (
                  <div key={item.name}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 4 }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{item.name}</span>
                      <span style={{ color: 'var(--brand-primary)', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{item.pct}%</span>
                    </div>
                    <div style={{ height: 5, background: 'var(--border)', borderRadius: 3 }}>
                      <div style={{ height: '100%', width: `${item.pct}%`, background: 'var(--brand-primary)', borderRadius: 3, transition: 'width 0.5s var(--ease-out-expo)' }} />
                    </div>
                  </div>
                ))}
                {habitItems.map(item => (
                  <div key={item.name}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 4 }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{item.name}</span>
                      <span style={{ color: 'var(--brand-orange)', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{item.pct}%</span>
                    </div>
                    <div style={{ height: 5, background: 'var(--border)', borderRadius: 3 }}>
                      <div style={{ height: '100%', width: `${item.pct}%`, background: 'var(--brand-orange)', borderRadius: 3, transition: 'width 0.5s var(--ease-out-expo)' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ── Main view ───────────────────────────────────────────────── */
export default function GoalsView() {
  const toast = useToast()
  const confirmDialog = useConfirm()
  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editGoal, setEditGoal] = useState(null)
  const [availableTasks, setAvailableTasks] = useState([])
  const [availableHabits, setAvailableHabits] = useState([])
  const [taskStats, setTaskStats] = useState({})
  const [habitStats, setHabitStats] = useState({})
  const [filter, setFilter] = useState('active')
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)

  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])

  // Load tasks & habits for linking/progress
  useEffect(() => {
    const now = new Date()
    const yr = now.getFullYear(), mo = now.getMonth()
    const monthKey = `${yr}-${mo}`

    Promise.all([
      tasksAPI.getMonth(monthKey).catch(() => null),
      habitsAPI.getMonth(monthKey).catch(() => null),
    ]).then(([taskRes, habitRes]) => {
      if (taskRes?.data && typeof taskRes.data === 'object') {
        const allTasks = new Set()
        const stats = {}
        // tasks are stored encoded as "name|time" — aggregate by decoded name
        const decode = (t) => (typeof t === 'string' && t.includes('|') ? t.split('|')[0] : t)
        Object.values(taskRes.data).forEach(week => {
          const tasks = week.tasks || []
          const checks = week.checks || {}
          tasks.forEach(t => {
            const name = decode(t)
            allTasks.add(name)
            if (!stats[name]) stats[name] = { done: 0, total: 0 }
            Object.entries(checks).forEach(([key, val]) => {
              const dashIdx = key.indexOf('-')
              const taskName = key.slice(dashIdx + 1)
              if (taskName === name) {
                stats[name].total++
                if (val) stats[name].done++
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
    try {
      await goalsAPI.create(form)
      setShowForm(false)
      loadGoals()
      toast.success('Goal created.')
    } catch (e) {
      toast.error(e.message || 'Could not create goal.')
      throw e
    }
  }

  const handleUpdate = async (form, goalId) => {
    try {
      await goalsAPI.update(goalId, form)
      setEditGoal(null)
      loadGoals()
      toast.success('Goal updated.')
    } catch (e) {
      toast.error(e.message || 'Could not update goal.')
      throw e
    }
  }

  const handleDelete = async (id) => {
    const ok = await confirmDialog({
      title: 'Delete this goal?',
      body: 'The goal and its linked progress will be removed. This can’t be undone.',
      confirmLabel: 'Delete', danger: true,
    })
    if (!ok) return
    try {
      await goalsAPI.delete(id)
      loadGoals()
      toast.success('Goal deleted.')
    } catch (e) {
      toast.error(e.message || 'Could not delete goal.')
    }
  }

  const handleSetStatus = async (goal, status) => {
    const completing = status === 'completed'
    if (completing) {
      const ok = await confirmDialog({
        title: 'Mark goal as completed?',
        body: '“' + goal.title + '” will move to Completed. You can reopen it anytime.',
        confirmLabel: 'Mark Complete',
      })
      if (!ok) return
    }
    try {
      await goalsAPI.update(goal._id, { status })
      loadGoals()
      toast.success(completing ? 'Goal completed. Well done.' : 'Goal reopened.')
    } catch (e) {
      toast.error(e.message || 'Could not update goal.')
    }
  }

  const handleToggleMilestone = async (goal, milestone) => {
    const next = goal.milestones.map(m => m.id === milestone.id ? { ...m, done: !m.done } : m)
    // optimistic update
    setGoals(prev => prev.map(g => g._id === goal._id ? { ...g, milestones: next } : g))
    try {
      await goalsAPI.update(goal._id, { milestones: next })
    } catch (e) {
      setGoals(prev => prev.map(g => g._id === goal._id ? { ...g, milestones: goal.milestones } : g))
      toast.error(e.message || 'Could not update milestone.')
    }
  }

  const handleQuickAddMilestone = async (goal, title) => {
    const next = [...(goal.milestones || []), { id: Math.random().toString(36).slice(2, 10), title, done: false }]
    setGoals(prev => prev.map(g => g._id === goal._id ? { ...g, milestones: next } : g))
    try {
      await goalsAPI.update(goal._id, { milestones: next })
    } catch (e) {
      loadGoals()
      toast.error(e.message || 'Could not add milestone.')
    }
  }

  const filteredGoals = useMemo(() =>
    filter === 'all' ? goals : goals.filter(g => g.status === filter),
  [goals, filter])

  const summary = useMemo(() => {
    const overallOf = g => goalProgress(g, taskStats, habitStats).overall
    const active = goals.filter(g => g.status === 'active')
    const completed = goals.filter(g => g.status === 'completed')
    const activeOverall = active.length ? Math.round(active.reduce((s, g) => s + overallOf(g), 0) / active.length) : 0
    return {
      total: goals.length,
      active: active.length,
      completed: completed.length,
      overdue: active.filter(g => daysLeft(g.deadline) < 0).length,
      activeOverall,
    }
  }, [goals, taskStats, habitStats])

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: isMobile ? '16px 16px 0' : '20px 24px 0', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontSize: isMobile ? 24 : 28, fontWeight: 600, letterSpacing: '-0.02em' }}>Goals</h1>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>
              Set targets, break them into milestones, and track pace.
            </div>
          </div>
          <button onClick={() => { setShowForm(true); setEditGoal(null) }}
            style={{ background: 'var(--btn-primary-bg)', border: 'none', borderRadius: 980, color: '#fff', padding: '10px 20px', fontSize: 14.5, fontWeight: 400, letterSpacing: '-0.022em', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, minHeight: 44, transition: 'transform 0.15s ease' }}>
            <Plus size={16} /> New Goal
          </button>
        </div>

        {/* Summary — Apple stat row */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'stretch', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 180px', display: 'flex', alignItems: 'center', gap: 14, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '14px 18px', minWidth: 0 }}>
            <MFRing percent={summary.activeOverall} size={54} stroke={7} color="var(--brand-primary)" />
            <div>
              <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>{summary.activeOverall}%</div>
              <div style={{ fontSize: 11.5, color: 'var(--text-muted)', fontWeight: 600 }}>avg. active progress</div>
            </div>
          </div>
          {[
            ['Active', summary.active, 'var(--brand-primary)'],
            ['Completed', summary.completed, 'var(--brand-success)'],
            ['Overdue', summary.overdue, 'var(--brand-error)'],
          ].map(([label, val, color]) => (
            <div key={label} style={{ flex: '1 1 120px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '14px 18px', display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0 }}>
              <div style={{ fontSize: 24, fontWeight: 600, fontFamily: 'var(--font-display)', color, letterSpacing: '-0.02em' }}>{val}</div>
              <div style={{ fontSize: 11.5, color: 'var(--text-muted)', fontWeight: 600 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Filter — segmented control */}
        <div style={{ marginBottom: 16 }}>
          <Segmented
            value={filter}
            onChange={setFilter}
            options={[
              { id: 'active', label: 'Active' },
              { id: 'completed', label: 'Completed' },
              { id: 'abandoned', label: 'Abandoned' },
              { id: 'all', label: 'All' },
            ]}
          />
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: isMobile ? '0 16px 80px' : '0 24px 24px' }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>

        {showForm && !editGoal && (
          <GoalForm onSave={handleCreate} onCancel={() => setShowForm(false)}
            availableTasks={availableTasks} availableHabits={availableHabits} isEdit={false} />
        )}
        {editGoal && (
          <GoalForm initial={editGoal} onSave={(form) => handleUpdate(form, editGoal._id)} onCancel={() => setEditGoal(null)}
            availableTasks={availableTasks} availableHabits={availableHabits} isEdit={true} />
        )}

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: 'var(--text-secondary)', gap: 10 }}>
            <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> Loading goals...
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', color: 'var(--brand-error)', padding: 40 }}>{error}</div>
        ) : filteredGoals.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '56px 16px', color: 'var(--text-muted)' }}>
            <Target size={44} style={{ marginBottom: 16, opacity: 0.3 }} />
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)' }}>
              {filter === 'active' ? 'No active goals' : `No ${filter} goals`}
            </div>
            <div style={{ fontSize: 13.5, marginBottom: 20 }}>
              Tap “New Goal” — or start from a template below.
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', maxWidth: 560, margin: '0 auto' }}>
              {TEMPLATES.map(t => (
                <button key={t.title} onClick={() => { setShowForm(true); setEditGoal(null); setTimeout(() => {}, 0) }}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 'var(--radius-pill)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', background: 'var(--bg-glass)', border: '1px solid var(--border)', color: 'var(--text-secondary)', minHeight: 36 }}>
                  <Zap size={12} color="var(--brand-primary)" /> {t.title}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {filteredGoals.map(goal => (
              <GoalCard
                key={goal._id}
                goal={goal}
                taskStats={taskStats}
                habitStats={habitStats}
                isMobile={isMobile}
                onEdit={(g) => { setEditGoal(g); setShowForm(false); document.querySelector('.view-scroll, [style*="overflow: auto"]')?.scrollTo?.(0, 0) }}
                onDelete={handleDelete}
                onToggleMilestone={handleToggleMilestone}
                onQuickAddMilestone={handleQuickAddMilestone}
                onSetStatus={handleSetStatus}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
