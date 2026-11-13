import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  Bot, Send, Settings2, Key, ChevronDown, Trash2,
  Sparkles, User, AlertCircle, CheckCircle, Loader,
  MessageSquare, X, Eye, EyeOff, Zap, Check,
  Brain, CalendarPlus, Repeat, ListChecks, Target as TargetIcon, Pencil,
  ShieldCheck, Cable, Server, Plus, Globe, ArrowUpRight,
} from 'lucide-react'
import { tasksAPI, habitsAPI, goalsAPI, BASE_URL, aiAPI } from '../api/client'
import { getAllProviders, ProviderLogo, fetchModelCatalog, validateBaseUrl, addCustomProvider, updateCustomProvider, removeCustomProvider } from '../lib/ai-providers.jsx'
import { useToast } from '../components/Toast'
import { useConfirm } from '../components/ConfirmDialog'
import MCPModal from '../components/MCPModal'

// Provider logos, catalogue, custom-provider store and the live
// model-catalogue fetcher now live in src/lib/ai-providers.js — one
// source of truth for Coach and the docs pages.

const STORAGE_KEY = 'mf_ai_config'
const KEYS_KEY    = 'mf_ai_keys'   // stores { openai: 'sk-...', gemini: 'AIza...', ... }
const CHAT_KEY    = 'mf_ai_chat'

function loadConfig() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') } catch { return {} }
}
function loadKeys() {
  try { return JSON.parse(localStorage.getItem(KEYS_KEY) || '{}') } catch { return {} }
}
function saveConfig(cfg) { localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg)) }
function saveKeys(keys) { localStorage.setItem(KEYS_KEY, JSON.stringify(keys)) }
function loadChat()   {
  try {
    const data = JSON.parse(localStorage.getItem(CHAT_KEY) || '{}')
    if (!data.msgs || !data.ts) return []
    // 24 hours = 86,400,000 ms
    if (Date.now() - data.ts > 86400000) {
      localStorage.removeItem(CHAT_KEY)
      return []
    }
    return data.msgs
  } catch { return [] }
}
function saveChat(msgs) {
  if (!msgs.length) {
    localStorage.removeItem(CHAT_KEY)
    return
  }
  const data = { msgs: msgs.slice(-60), ts: Date.now() }
  localStorage.setItem(CHAT_KEY, JSON.stringify(data))
}

// ── Coach action engine ────────────────────────────────────────
// Same week/month-key math as TaskTracker / HabitTracker so Coach
// writes into exactly the buckets the user sees.
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
function currentWeekKey() {
  const today = new Date()
  const y = today.getFullYear(), m = today.getMonth()
  const total = getWeeksInMonth(y, m)
  for (let w = 1; w <= total; w++) {
    if (getWeekDays(y, m, w).includes(today.getDate())) return `${y}-${m}-w${w}`
  }
  return `${y}-${m}-w1`
}
const currentMonthKey = () => `${new Date().getFullYear()}-${new Date().getMonth()}`

/* Pull ```mf-actions JSON blocks out of an assistant reply. */
export function splitActions(content) {
  const actions = []
  const text = (content || '').replace(/```mf-actions\s*([\s\S]*?)```/g, (_, body) => {
    try {
      const parsed = JSON.parse(body.trim())
      if (Array.isArray(parsed)) actions.push(...parsed.filter(a => a && typeof a === 'object' && a.type))
    } catch { /* malformed block: drop it, keep the prose */ }
    return ''
  })
  return { text: text.replace(/\n{3,}/g, '\n\n').trim(), actions }
}

/* Apply one proposed action to the user's account (merge-then-upsert,
   so Coach never clobbers existing tasks/habits). Returns 'ok'|'exists'. */
export async function applyCoachAction(a) {
  const same = (x, y) => (x || '').trim().toLowerCase() === (y || '').trim().toLowerCase()
  switch (a.type) {
    case 'create_task': {
      const wk = currentWeekKey()
      const res = await tasksAPI.getWeek(wk)
      const cur = res?.data || {}
      const tasks = Array.isArray(cur.tasks) ? [...cur.tasks] : []
      if (tasks.some(t => same(t, a.title))) return 'exists'
      tasks.push(a.title)
      await tasksAPI.upsertWeek(wk, { tasks, checks: cur.checks || {}, reflection: cur.reflection || {} })
      return 'ok'
    }
    case 'delete_task': {
      const wk = currentWeekKey()
      const res = await tasksAPI.getWeek(wk)
      const cur = res?.data || {}
      const tasks = (cur.tasks || []).filter(t => !same(t, a.title))
      await tasksAPI.upsertWeek(wk, { tasks, checks: cur.checks || {}, reflection: cur.reflection || {} })
      return 'ok'
    }
    case 'create_habit': {
      const mk = currentMonthKey()
      const res = await habitsAPI.getMonth(mk)
      const cur = res?.data || {}
      const habits = Array.isArray(cur.habits) ? [...cur.habits] : []
      if (habits.some(h => same(h?.name, a.name))) return 'exists'
      habits.push({ name: a.name, emoji: a.emoji || '✨', time: a.time || '' })
      await habitsAPI.upsertMonth(mk, { habits, checks: cur.checks || {}, mental: cur.mental || {} })
      return 'ok'
    }
    case 'update_habit': {
      const mk = currentMonthKey()
      const res = await habitsAPI.getMonth(mk)
      const cur = res?.data || {}
      const habits = (cur.habits || []).map(h => same(h?.name, a.name)
        ? { ...h, name: a.newName || h.name, time: a.time ?? h.time, emoji: a.emoji || h.emoji }
        : h)
      await habitsAPI.upsertMonth(mk, { habits, checks: cur.checks || {}, mental: cur.mental || {} })
      return 'ok'
    }
    case 'delete_habit': {
      const mk = currentMonthKey()
      const res = await habitsAPI.getMonth(mk)
      const cur = res?.data || {}
      const habits = (cur.habits || []).filter(h => !same(h?.name, a.name))
      await habitsAPI.upsertMonth(mk, { habits, checks: cur.checks || {}, mental: cur.mental || {} })
      return 'ok'
    }
    case 'create_goal': {
      await goalsAPI.create({
        title: a.title,
        description: a.description || '',
        category: (a.category || 'general').toLowerCase(),
        deadline: a.deadline,
      })
      return 'ok'
    }
    case 'complete_goal': {
      const res = await goalsAPI.getAll()
      const list = res?.data || res || []
      const g = (Array.isArray(list) ? list : []).find(x => same(x?.title, a.title))
      if (!g) throw new Error(`Goal “${a.title}” not found`)
      await goalsAPI.update(g._id || g.id, { status: 'completed' })
      return 'ok'
    }
    default:
      throw new Error(`Unknown action: ${a.type}`)
  }
}

/* Visual metadata per action type. */
const ACTION_META = {
  create_task:   { label: 'New task',    icon: CalendarPlus, color: 'var(--cyan)' },
  delete_task:   { label: 'Remove task', icon: Trash2,       color: 'var(--red)' },
  create_habit:  { label: 'New habit',   icon: Repeat,       color: 'var(--amber)' },
  update_habit:  { label: 'Update habit',icon: Pencil,       color: 'var(--amber)' },
  delete_habit:  { label: 'Remove habit',icon: Trash2,       color: 'var(--red)' },
  create_goal:   { label: 'New goal',    icon: TargetIcon,   color: 'var(--brand-secondary)' },
  complete_goal: { label: 'Complete goal', icon: CheckCircle, color: 'var(--green)' },
}

function actionSummary(a) {
  if (a.type === 'create_task' || a.type === 'delete_task')  return a.title
  if (a.type === 'create_habit' || a.type === 'delete_habit') return [a.emoji, a.name, a.time].filter(Boolean).join('  ·  ')
  if (a.type === 'update_habit') return [a.name, '→', a.newName, a.time].filter(Boolean).join('  ')
  if (a.type === 'complete_goal') return a.title
  if (a.type === 'create_goal') return [a.title, a.category, a.deadline].filter(Boolean).join('  ·  ')
  return JSON.stringify(a)
}

function ActionRow({ action, status, onApply }) {
  const meta = ACTION_META[action.type] || { label: action.type, icon: Sparkles, color: 'var(--text-secondary)' }
  const Icon = meta.icon
  const done = status === 'ok' || status === 'exists'
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      background: 'var(--bg-glass)', border: '1px solid var(--border)',
      borderRadius: 12, padding: '10px 12px', marginTop: 8,
      opacity: done ? 0.75 : 1,
    }}>
      <div style={{
        width: 30, height: 30, borderRadius: 9, flexShrink: 0,
        background: `color-mix(in srgb, ${meta.color} 14%, transparent)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={14} style={{ color: meta.color }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: meta.color }}>{meta.label}</div>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{actionSummary(action)}</div>
      </div>
      {done
        ? <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: 'var(--green)', flexShrink: 0 }}>
            <Check size={13} /> {status === 'exists' ? 'Already there' : 'Applied'}
          </span>
        : status === 'error'
          ? <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--red)', flexShrink: 0 }}>Failed</span>
          : <button onClick={onApply} style={{
              background: 'var(--btn-primary-bg)', color: '#000', border: 'none', borderRadius: 980,
              padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', flexShrink: 0,
              fontFamily: 'var(--font-display)', transition: 'transform 0.15s',
            }}>Apply</button>
      }
    </div>
  )
}

function ActionsBlock({ actions, statuses, onApply, onApplyAll }) {
  const allDone = actions.every((_, i) => {
    const s = statuses?.[i]
    return s === 'applied' || s === 'exists'
  })
  return (
    <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px dashed var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
          Proposed changes · {actions.length}
        </span>
        {!allDone && actions.length > 1 && (
          <button onClick={onApplyAll} style={{
            background: 'none', border: '1px solid var(--brand-primary-glow)', color: 'var(--cyan)',
            borderRadius: 980, padding: '4px 12px', fontSize: 11.5, fontWeight: 600, cursor: 'pointer',
            fontFamily: 'var(--font-display)',
          }}>Apply all</button>
        )}
      </div>
      {actions.map((a, i) => (
        <ActionRow key={i} action={a} status={statuses?.[i]} onApply={() => onApply(i)} />
      ))}
    </div>
  )
}

// ── Markdown-lite renderer ──────────────────────────────────────
function MdText({ text }) {
  const parseInline = (str) => {
    if (!str) return null
    const parts = str.split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
    return parts.map((p, i) => {
      if (p.startsWith('**') && p.endsWith('**')) {
        return <strong key={i} style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{p.slice(2, -2)}</strong>
      }
      if (p.startsWith('`') && p.endsWith('`') && p.length > 2) {
        return <code key={i} style={{
          fontFamily: 'var(--font-mono)', fontSize: 12.5,
          background: 'var(--bg-glass)', border: '1px solid var(--border)',
          borderRadius: 6, padding: '1px 6px', color: 'var(--text-primary)',
        }}>{p.slice(1, -1)}</code>
      }
      return p
    })
  }

  const lines = text.split('\n')
  const blocks = []
  let codeBuffer = null
  lines.forEach((ln, i) => {
    const trimmed = ln.trim()
    if (trimmed.startsWith('```')) {
      if (codeBuffer) {
        blocks.push(
          <pre key={`code-${blocks.length}`} style={{
            background: 'var(--bg-glass)', border: '1px solid var(--border)',
            borderRadius: 10, padding: '12px 14px', margin: '10px 0',
            overflowX: 'auto', fontFamily: 'var(--font-mono)', fontSize: 12.5,
            color: 'var(--text-primary)', lineHeight: 1.55,
          }}>{codeBuffer.join('\n')}</pre>
        )
        codeBuffer = null
      } else {
        codeBuffer = []
      }
      return
    }
    if (codeBuffer) { codeBuffer.push(ln); return }
    blocks.push(<Line key={i} trimmed={trimmed} ln={ln} parseInline={parseInline} />)
  })
  if (codeBuffer) {
    blocks.push(
      <pre key="code-tail" style={{
        background: 'var(--bg-glass)', border: '1px solid var(--border)',
        borderRadius: 10, padding: '12px 14px', margin: '10px 0',
        overflowX: 'auto', fontFamily: 'var(--font-mono)', fontSize: 12.5,
        color: 'var(--text-primary)', lineHeight: 1.55,
      }}>{codeBuffer.join('\n')}</pre>
    )
  }
  return <div style={{ lineHeight: 1.6, fontSize: 14.5, color: 'var(--text-secondary)' }}>{blocks}</div>
}

function Line({ trimmed, ln, parseInline }) {
  // Headings
  if (trimmed.startsWith('### ')) return <div style={{ fontWeight: 600, fontSize: 16, color: 'var(--text-primary)', margin: '14px 0 6px' }}>{parseInline(trimmed.slice(4))}</div>
  if (trimmed.startsWith('## '))  return <div style={{ fontWeight: 600, fontSize: 18, color: 'var(--text-primary)', margin: '16px 0 8px' }}>{parseInline(trimmed.slice(3))}</div>
  if (trimmed.startsWith('# '))   return <div style={{ fontWeight: 600, fontSize: 20, color: 'var(--text-primary)', margin: '18px 0 10px' }}>{parseInline(trimmed.slice(2))}</div>

  // Lists
  if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ')) {
    return <div style={{ display: 'flex', gap: 8, paddingLeft: 4, margin: '4px 0' }}>
      <span style={{ color: 'var(--cyan)', fontWeight: 600 }}>•</span>
      <div style={{ flex: 1 }}>{parseInline(trimmed.slice(2))}</div>
    </div>
  }

  // Numbered
  const numMatch = trimmed.match(/^(\d+\.)\s+(.*)/)
  if (numMatch) {
    return <div style={{ display: 'flex', gap: 8, paddingLeft: 4, margin: '8px 0 4px' }}>
      <span style={{ color: 'var(--cyan)', fontWeight: 600, fontFamily: 'var(--font-mono)', fontSize: 13 }}>{numMatch[1]}</span>
      <div style={{ flex: 1, color: 'var(--text-primary)', fontWeight: 600 }}>{parseInline(numMatch[2])}</div>
    </div>
  }

  // Normal text
  return (
    <div style={{ margin: trimmed === '' ? '8px 0' : '4px 0', minHeight: trimmed === '' ? 10 : 'auto' }}>
      {parseInline(ln)}
    </div>
  )
}
// ── Custom Dropdown ───────────────────────────────────────────
function CustomSelect({ value, options, onChange, placeholder }) {
  const [open, setOpen] = useState(false)
  const ref = useRef()
  const active = options.find(o => o.id === value)

  useEffect(() => {
    const click = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', click)
    return () => document.removeEventListener('mousedown', click)
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%' }}>
      <button onClick={() => setOpen(!open)} style={{
        width: '100%', background: 'var(--bg-glass)', border: '1px solid var(--border)',
        borderRadius: 10, padding: '12px 14px', fontSize: 13, textAlign: 'left',
        color: active ? 'var(--text-primary)' : 'var(--text-muted)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer',
      }}>
        {active ? active.label : placeholder}
        <ChevronDown size={14} style={{ color: 'var(--text-muted)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.25s' }} />
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 100,
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 12, overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
          animation: 'fadeIn 0.15s ease',
        }}>
          {options.map(o => (
            <button key={o.id} onClick={() => { onChange(o.id); setOpen(false) }} style={{
              width: '100%', padding: '10px 14px', border: 'none', background: value === o.id ? 'var(--cyan-dim)' : 'transparent',
              color: value === o.id ? 'var(--cyan)' : 'var(--text-secondary)', fontSize: 13, textAlign: 'left',
              cursor: 'pointer', transition: 'all 0.15s',
            }} onMouseEnter={e => { if (value !== o.id) e.currentTarget.style.background = 'var(--border)' }} onMouseLeave={e => { if (value !== o.id) e.currentTarget.style.background = 'transparent' }}>
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Searchable model picker (aggregators + custom providers) ──
// OpenRouter and NVIDIA NIM expose hundreds of models, so this
// picker searches the catalogue live (12 h cache, graceful fallback
// to the built-in list) and accepts an exact model ID as a last
// resort.
function ModelSearchSelect({ value, onChange, provider, baseUrl, apiKey }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [catalog, setCatalog] = useState(null) // { models, source, error }
  const [loading, setLoading] = useState(false)
  const ref = useRef()

  useEffect(() => {
    const click = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', click)
    return () => document.removeEventListener('mousedown', click)
  }, [])

  const load = async (force = false) => {
    if (!force && catalog) return
    setLoading(true)
    const res = await fetchModelCatalog(provider, { baseUrl, apiKey })
    setCatalog(res)
    setLoading(false)
  }

  useEffect(() => { if (open && !catalog) load() }, [open]) // eslint-disable-line

  const models = catalog?.models || provider.models || []
  const q = query.trim().toLowerCase()
  const filtered = q ? models.filter(m => m.id.toLowerCase().includes(q) || (m.label || '').toLowerCase().includes(q)).slice(0, 120) : models.slice(0, 120)
  const exact = q && !models.some(m => m.id.toLowerCase() === q)
  const selected = models.find(m => m.id === value)

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%' }}>
      <button onClick={() => setOpen(!open)} type="button" style={{
        width: '100%', background: 'var(--bg-glass)', border: '1px solid var(--border)',
        borderRadius: 10, padding: '12px 14px', fontSize: 13, textAlign: 'left',
        color: value ? 'var(--text-primary)' : 'var(--text-muted)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, cursor: 'pointer',
      }}>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selected ? selected.label : value ? value : 'Search models…'}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {catalog?.source === 'live' && <span style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--green)' }}>{models.length} LIVE</span>}
          {catalog?.source === 'cache' && <span style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--text-muted)' }}>{models.length}</span>}
          {catalog?.source === 'fallback' && <span style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--amber)' }}>OFFLINE LIST</span>}
          <ChevronDown size={14} style={{ color: 'var(--text-muted)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.25s' }} />
        </span>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 120,
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 12, overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
          animation: 'fadeIn 0.15s ease',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 10px', borderBottom: '1px solid var(--border)' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--text-muted)', flexShrink: 0 }}>
              <circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.5" y2="16.5" strokeLinecap="round" />
            </svg>
            <input
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={`Search ${models.length} models…`}
              style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 12.5, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}
            />
            <button onClick={() => load(true)} title="Refresh catalogue" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: 4 }}>
              <Loader size={12} style={loading ? { animation: 'spin 1s linear infinite' } : {}} />
            </button>
          </div>

          <div style={{ maxHeight: 220, overflowY: 'auto' }}>
            {loading && !models.length && (
              <div style={{ padding: '14px', fontSize: 12, color: 'var(--text-muted)' }}>Loading catalogue…</div>
            )}
            {!loading && !filtered.length && !exact && (
              <div style={{ padding: '14px', fontSize: 12, color: 'var(--text-muted)' }}>No models match “{query}”.</div>
            )}
            {filtered.map(m => (
              <button key={m.id} type="button" onClick={() => { onChange(m.id); setOpen(false); setQuery('') }} style={{
                width: '100%', padding: '9px 13px', border: 'none', textAlign: 'left', cursor: 'pointer',
                background: value === m.id ? 'var(--cyan-dim)' : 'transparent',
                color: value === m.id ? 'var(--cyan)' : 'var(--text-secondary)', fontSize: 12.5,
                display: 'flex', justifyContent: 'space-between', gap: 10, transition: 'background 0.12s',
              }}
                onMouseEnter={e => { if (value !== m.id) e.currentTarget.style.background = 'var(--border)' }}
                onMouseLeave={e => { if (value !== m.id) e.currentTarget.style.background = 'transparent' }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.label}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.id}</span>
              </button>
            ))}
            {exact && (
              <button onClick={() => { onChange(query.trim()); setOpen(false); setQuery('') }} style={{
                width: '100%', padding: '10px 13px', border: 'none', background: 'var(--cyan-dim)',
                color: 'var(--cyan)', fontSize: 12.5, textAlign: 'left', cursor: 'pointer', fontWeight: 600,
              }}>
                Use exact ID: <span style={{ fontFamily: 'var(--font-mono)' }}>{query.trim()}</span>
              </button>
            )}
          </div>
          {catalog?.error && (
            <div style={{ padding: '7px 12px', fontSize: 10.5, color: 'var(--amber)', borderTop: '1px solid var(--border)' }}>{catalog.error}</div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Settings panel ──────────────────────────────────────────
function AISettings({ config, onSave, onClose, serverProviders = {} }) {
  const [providers, setProviders] = useState(getAllProviders)
  const [provider, setProvider] = useState(config.provider || 'openai')
  const [model, setModel]    = useState(config.model    || '')
  const [baseUrls, setBaseUrls] = useState(config.baseUrls || {})
  // Per-provider keys: load saved keys and pre-fill for the current provider
  const [allKeys,  setAllKeys]  = useState(loadKeys)
  const [showKey,  setShowKey]  = useState(false)
  const [showMCP,  setShowMCP]  = useState(false)
  const [customForm, setCustomForm] = useState(null) // null | 'new' | { id, name, baseUrl }
  const [customErr, setCustomErr] = useState('')
  const [urlErr, setUrlErr] = useState('')
  const [testState, setTestState] = useState(null) // 'testing' | { ok, message }

  const toast = useToast()
  const confirm = useConfirm()

  // ESC closes the settings sheet (accessibility)
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const prov = providers.find(p => p.id === provider)
  const apiKey = allKeys[provider] || ''
  const baseUrl = (baseUrls[provider] ?? prov?.baseUrl ?? '').trim()
  const editableUrl = Boolean(prov?.editable || provider.startsWith('custom-'))
  const serverHas = Boolean(serverProviders[provider])
  const keyless = Boolean(provider.startsWith('custom-') && baseUrl)
  const canSave = Boolean(model) && (Boolean(apiKey.trim()) || serverHas || keyless)

  // When switching providers, model resets and the URL/key re-resolve
  const handleProviderSwitch = (id) => {
    setProvider(id)
    setModel('')
    setTestState(null)
    setUrlErr('')
  }

  const setApiKey = (val) => setAllKeys(prev => ({ ...prev, [provider]: val }))
  const setBaseUrl = (val) => {
    setBaseUrls(prev => ({ ...prev, [provider]: val }))
    setUrlErr(validateBaseUrl(val))
    setTestState(null)
  }

  /* ── Custom providers ─────────────────────────────────────── */
  const openCustomForm = (p = null) => {
    setCustomForm(p ? { id: p.id, name: p.name, baseUrl: p.baseUrl } : { id: null, name: '', baseUrl: '' })
    setCustomErr('')
  }

  const handleSaveCustom = () => {
    const name = (customForm.name || '').trim()
    const url = (customForm.baseUrl || '').trim()
    if (!name) { setCustomErr('Give the provider a name.'); return }
    const urlProblem = validateBaseUrl(url)
    if (urlProblem) { setCustomErr(urlProblem); return }
    const list = customForm.id
      ? updateCustomProvider(customForm.id, { name, baseUrl: url })
      : addCustomProvider({ name, baseUrl: url })
    setProviders(list)
    const created = list.find(x => (customForm.id ? x.id === customForm.id : x.name === name && x.baseUrl === url.replace(/\/+$/, '')))
    setCustomForm(null)
    setCustomErr('')
    if (created) handleProviderSwitch(created.id)
    toast.success(customForm.id ? 'Provider updated.' : 'Custom provider added.')
  }

  const handleDeleteCustom = async (p) => {
    const ok = await confirm({
      title: `Remove “${p.name}”?`,
      body: 'The provider entry is deleted from this browser. Any key saved for it stays in local storage until you clear it.',
      confirmLabel: 'Remove',
      danger: true,
    })
    if (!ok) return
    const list = removeCustomProvider(p.id)
    setProviders(list)
    if (provider === p.id) handleProviderSwitch('openai')
    toast.success('Provider removed.')
  }

  /* ── Connection test ──────────────────────────────────────── */
  const handleTest = async () => {
    setTestState('testing')
    try {
      const res = await aiAPI.testProvider({
        provider,
        baseUrl: editableUrl ? baseUrl : undefined,
        apiKey: apiKey.trim() || undefined,
      })
      setTestState({ ok: Boolean(res?.ok), message: res?.message || (res?.ok ? 'Connection OK.' : 'Test failed.') })
    } catch (e) {
      setTestState({ ok: false, message: e.message || 'Test failed.' })
    }
  }

  const handleSave = () => {
    if (!canSave) return
    saveKeys(allKeys)              // persist all provider keys
    onSave({
      provider,
      model,
      apiKey: apiKey.trim(),
      useServerKey: !apiKey.trim() && serverHas && !keyless, // host-enabled shared key
      baseUrls,                    // per-provider (editable) base URLs
    })
    onClose()
  }

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 50,
      background: 'rgba(10,11,15,0.85)', backdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{
        width: '100%', maxWidth: 500, maxHeight: 'calc(100dvh - 48px)', overflowY: 'auto',
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 20, padding: '28px 28px 24px',
        animation: 'fadeIn 0.2s ease',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--cyan-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Settings2 size={18} color="var(--cyan)" />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 16 }}>Coach settings</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Your key stays on your device</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', color: 'var(--text-muted)', display: 'flex', padding: 6, borderRadius: 8, border: '1px solid var(--border)' }}>
            <X size={14} />
          </button>
        </div>

        {/* Provider grid — first-party + aggregators + your custom ones */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 10 }}>PROVIDER</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {providers.map(p => (
              <div key={p.id} style={{ position: 'relative' }}>
                <button onClick={() => handleProviderSwitch(p.id)} style={{
                  width: '100%', padding: '12px 14px', borderRadius: 12, cursor: 'pointer', textAlign: 'left',
                  background: provider === p.id ? (p.color || 'var(--cyan)') + '18' : 'var(--bg-glass)',
                  border: `1px solid ${provider === p.id ? (p.color || 'var(--cyan)') + '60' : 'var(--border)'}`,
                  transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <ProviderLogo id={p.id} size={18} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      color: provider === p.id ? (p.color || 'var(--cyan)') : 'var(--text-secondary)',
                    }}>{p.name}</div>
                    <div style={{ fontSize: 9, marginTop: 2, color: allKeys[p.id] ? 'var(--green)' : serverProviders[p.id] ? 'var(--cyan)' : 'transparent' }}>
                      {allKeys[p.id] ? '● Your key saved' : serverProviders[p.id] ? '● Shared key available' : '·'}
                    </div>
                  </div>
                </button>
                {/* custom providers: edit / remove affordances */}
                {p.id.startsWith('custom-') && (
                  <div style={{ position: 'absolute', top: 6, right: 6, display: 'flex', gap: 4 }}>
                    <button onClick={(e) => { e.stopPropagation(); openCustomForm(p) }} title="Edit provider" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: 7, color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: 4 }}>
                      <Pencil size={11} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteCustom(p) }} title="Remove provider" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: 7, color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: 4 }}
                      onMouseEnter={e => { e.currentTarget.style.color = 'var(--red)'; e.currentTarget.style.borderColor = 'var(--red)' }}
                      onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)' }}>
                      <Trash2 size={11} />
                    </button>
                  </div>
                )}
              </div>
            ))}
            {/* Add-custom tile */}
            <button onClick={() => openCustomForm(null)} style={{
              padding: '12px 14px', borderRadius: 12, cursor: 'pointer', textAlign: 'left',
              background: 'transparent', border: '1px dashed var(--border)',
              color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 10,
              transition: 'all 0.15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--cyan)'; e.currentTarget.style.color = 'var(--cyan)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)' }}>
              <Plus size={18} style={{ color: 'currentColor' }} />
              <div>
                <div style={{ fontSize: 12, fontWeight: 600 }}>Custom provider</div>
                <div style={{ fontSize: 9, marginTop: 2, opacity: 0.8 }}>Any OpenAI-compatible URL</div>
              </div>
            </button>
          </div>
        </div>

        {/* Custom provider form */}
        {customForm && (
          <div style={{ background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: 14, padding: '14px 16px', marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 10 }}>
              {customForm.id ? 'EDIT CUSTOM PROVIDER' : 'ADD CUSTOM PROVIDER'}
            </div>
            <input
              value={customForm.name}
              onChange={e => setCustomForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Name — e.g. “Ollama local” or “Together AI”"
              maxLength={40}
              style={{ width: '100%', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 12px', fontSize: 13, color: 'var(--text-primary)', marginBottom: 8 }}
            />
            <input
              value={customForm.baseUrl}
              onChange={e => setCustomForm(f => ({ ...f, baseUrl: e.target.value }))}
              placeholder="Base URL — e.g. http://localhost:11434/v1"
              style={{ width: '100%', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 12px', fontSize: 13, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}
            />
            {customErr && <div style={{ fontSize: 11.5, color: 'var(--red)', marginTop: 7 }}>{customErr}</div>}
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 7, lineHeight: 1.5 }}>
              Must expose <code style={{ fontFamily: 'var(--font-mono)' }}>/chat/completions</code>. Works with Ollama, LM Studio, vLLM, Together, Groq and friends.
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button onClick={handleSaveCustom} style={{
                flex: 1, background: 'var(--btn-primary-bg)', color: '#000', border: 'none', borderRadius: 10,
                padding: '10px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-display)',
              }}>{customForm.id ? 'Save changes' : 'Add provider'}</button>
              <button onClick={() => { setCustomForm(null); setCustomErr('') }} style={{
                background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: 10,
                padding: '10px 14px', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer',
              }}>Cancel</button>
            </div>
          </div>
        )}

        {/* Base URL (editable defaults + custom providers) */}
        {editableUrl && !customForm && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', color: 'var(--text-muted)' }}>BASE URL</div>
              {provider !== provider.indexOf('custom') && prov?.defaultBaseUrl && baseUrl !== prov.defaultBaseUrl && (
                <button onClick={() => setBaseUrl(prov.defaultBaseUrl)} style={{
                  background: 'none', border: 'none', color: 'var(--cyan)', fontSize: 11, fontWeight: 600,
                  cursor: 'pointer', padding: 0, fontFamily: 'var(--font-display)',
                }}>Reset to default</button>
              )}
            </div>
            <div style={{ position: 'relative' }}>
              <Globe size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                value={baseUrl}
                onChange={e => setBaseUrl(e.target.value)}
                placeholder={prov?.defaultBaseUrl || 'https://your-provider.com/v1'}
                style={{
                  width: '100%', background: 'var(--bg-glass)', border: `1px solid ${urlErr ? 'var(--red)' : 'var(--border)'}`,
                  borderRadius: 10, padding: '12px 14px 12px 36px',
                  fontSize: 12.5, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)',
                }}
              />
            </div>
            {urlErr
              ? <div style={{ fontSize: 11, color: 'var(--red)', marginTop: 6 }}>{urlErr}</div>
              : <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
                  {prov?.defaultBaseUrl ? `Default: ${prov.defaultBaseUrl} — editable.` : 'Send requests to this OpenAI-compatible endpoint.'}
                </div>}
          </div>
        )}

        {/* Model selector */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 8 }}>MODEL</div>
          {editableUrl || prov?.searchable ? (
            <ModelSearchSelect
              value={model}
              onChange={setModel}
              provider={prov || { id: provider, models: [] }}
              baseUrl={baseUrl}
              apiKey={apiKey.trim() || undefined}
            />
          ) : (
            <CustomSelect
              value={model}
              options={prov?.models || []}
              onChange={setModel}
              placeholder="Select AI model..."
            />
          )}
          {prov?.note && (
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.5 }}>{prov.note}</div>
          )}
        </div>

        {/* API Key (BYOK) */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', color: 'var(--text-muted)' }}>API KEY (BYOK)</div>
            {serverHas && (
              <button onClick={() => setApiKey('')} style={{
                background: apiKey.trim() ? 'none' : 'var(--cyan-dim)', border: `1px solid ${apiKey.trim() ? 'var(--border)' : 'var(--brand-primary-glow)'}`,
                color: apiKey.trim() ? 'var(--text-muted)' : 'var(--cyan)', borderRadius: 980,
                padding: '4px 12px', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-display)',
              }}>
                {apiKey.trim() ? 'Use shared key instead' : '✓ Using MindForm shared key'}
              </button>
            )}
          </div>
          <div style={{ position: 'relative' }}>
            <Key size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={e => { setApiKey(e.target.value); setTestState(null) }}
              placeholder={serverHas && !apiKey ? 'Optional — shared key active' : (prov?.placeholder || 'Your API key...')}
              style={{
                width: '100%', background: 'var(--bg-glass)', border: '1px solid var(--border)',
                borderRadius: 10, padding: '12px 44px 12px 36px',
                fontSize: 13, color: 'var(--text-primary)', fontFamily: 'var(--font-display)',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--cyan)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
            <button onClick={() => setShowKey(v => !v)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', color: 'var(--text-muted)', display: 'flex' }}>
              {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          {prov?.keyUrl && (
            <a href={prov.keyUrl} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: 'var(--cyan)', marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}>
              Get a {prov.name} key <ArrowUpRight size={11} />
            </a>
          )}
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
            <AlertCircle size={10} /> {serverHas ? 'Leave empty to use the host’s shared key, or bring your own.' : 'Stored only in your browser — never sent to MindForm servers.'}
          </div>
        </div>

        {/* Test connection */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <button onClick={handleTest} disabled={testState === 'testing'} style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: 980,
            color: 'var(--text-secondary)', padding: '8px 16px', fontSize: 12.5, fontWeight: 600,
            cursor: testState === 'testing' ? 'wait' : 'pointer', fontFamily: 'var(--font-display)',
          }}>
            <Zap size={12} color={testState?.ok ? 'var(--green)' : testState && !testState.ok ? 'var(--red)' : 'var(--amber)'} />
            {testState === 'testing' ? 'Testing…' : 'Test connection'}
          </button>
          {testState && testState !== 'testing' && (
            <span style={{ fontSize: 11.5, color: testState.ok ? 'var(--green)' : 'var(--red)', lineHeight: 1.4, flex: 1 }}>{testState.message}</span>
          )}
        </div>

        {/* Coach permissions — what a configured key unlocks */}
        <div style={{ background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: 14, padding: '14px 16px', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <ShieldCheck size={14} color="var(--brand-success)" />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-secondary)' }}>COACH PERMISSIONS</span>
          </div>
          {[
            ['Read your tasks, habits, goals and streak', true],
            ['Propose create · update · delete (CRUD) edits', canSave],
            ['Write to your account — only after you tap Apply', canSave],
          ].map(([label, on]) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0' }}>
              {on
                ? <Check size={12} color="var(--brand-success)" style={{ flexShrink: 0 }} />
                : <span style={{ width: 12, height: 12, borderRadius: '50%', border: '1.5px solid var(--border)', flexShrink: 0 }} />}
              <span style={{ fontSize: 12, color: on ? 'var(--text-secondary)' : 'var(--text-muted)' }}>{label}</span>
            </div>
          ))}
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8, lineHeight: 1.5 }}>
            {canSave
              ? 'Your own API key (BYOK) unlocks full read + edit proposals. Nothing changes until you approve it.'
              : 'Add a key (or pick a provider with a shared key) to unlock Coach’s edit powers.'}
          </div>
        </div>

        {/* MCP quick-edit entry */}
        <button onClick={() => setShowMCP(true)} style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left',
          background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: 14,
          padding: '12px 16px', marginBottom: 20, cursor: 'pointer', transition: 'border-color 0.15s',
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--purple, var(--brand-primary))' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)' }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: 'color-mix(in srgb, var(--purple) 15%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Cable size={15} color="var(--purple, var(--brand-primary))" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>MCP server</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>Account keys for Claude, Cursor, Codex & Antigravity</div>
          </div>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--cyan)', display: 'flex', alignItems: 'center', gap: 4 }}><Server size={12} /> Setup</span>
        </button>

        <button
          onClick={handleSave}
          disabled={!canSave}
          style={{
            width: '100%', padding: '13px',
            background: canSave ? 'var(--btn-primary-bg)' : 'var(--bg-glass)',
            border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600,
            color: canSave ? '#000' : 'var(--text-muted)',
            cursor: canSave ? 'pointer' : 'not-allowed',
            fontFamily: 'var(--font-display)',
            transition: 'all 0.15s',
          }}
        >
          Save Configuration
        </button>
      </div>
      {showMCP && <MCPModal onClose={() => setShowMCP(false)} />}
    </div>
  )
}

// ── Chat bubble ────────────────────────────────────────────────
function Bubble({ msg, msgIndex, onApply, onApplyAll, actionStatuses }) {
  const isUser = msg.role === 'user'
  const { text, actions } = isUser ? { text: msg.content, actions: [] } : splitActions(msg.content)
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: 16 }}>
      {!isUser && (
        <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--bg-glass)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
          <Brain size={14} color="var(--cyan)" />
        </div>
      )}
      <div style={{
        maxWidth: '78%',
        background: isUser ? 'var(--brand-primary-dim)' : 'var(--bg-card)',
        border: `1px solid ${isUser ? 'var(--brand-primary-glow)' : 'var(--border)'}`,
        borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
        padding: '12px 16px',
      }}>
        {isUser
          ? <div style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--text-primary)' }}>{msg.content}</div>
          : <MdText text={text || 'Done.'} />
        }
        {!isUser && actions.length > 0 && (
          <ActionsBlock
            actions={actions}
            statuses={actionStatuses?.[msgIndex]}
            onApply={i => onApply(msgIndex, i, actions[i])}
            onApplyAll={() => onApplyAll(msgIndex)}
          />
        )}
        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 6, textAlign: isUser ? 'right' : 'left' }}>
          {msg.time}
        </div>
      </div>
      {isUser && (
        <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--bg-glass)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
          <User size={13} color="var(--text-secondary)" />
        </div>
      )}
    </div>
  )
}

// ── Suggestions ────────────────────────────────────────────────
const SUGGESTIONS = [
  'Plan my week around my goals and habits',
  'Propose 3 habits that would move me forward fastest',
  'Replan my habits — keep what works, fix what doesn\u2019t',
  'Help me set a 90-day goal with a realistic deadline',
  'What should I focus on today?',
  'Analyze my task completion and give tips',
]

/* One-tap quick starts above the input. */
const QUICK_ACTIONS = [
  { label: 'Plan my week',     icon: CalendarPlus, prompt: 'Plan my week: look at my goals, habits and streak, then propose the tasks I should add this week. Include an mf-actions block.' },
  { label: 'Add habits',       icon: Repeat,       prompt: 'Propose 2-3 new habits that would move me toward my goals fastest. Include an mf-actions block to add them.' },
  { label: 'Replan habits',    icon: ListChecks,   prompt: 'Review my current habits. Replan them: replace or update the weak ones, keep the strong ones. Include an mf-actions block.' },
  { label: 'Set a goal',       icon: TargetIcon,   prompt: 'Help me define one meaningful goal for the next 90 days based on my data, with a realistic deadline. Include an mf-actions block.' },
  { label: 'Edit goals',       icon: Pencil,       prompt: 'Review my goals and suggest edits — updated deadlines, completed ones marked done. Include an mf-actions block.' },
  { label: 'Today\u2019s focus', icon: Sparkles,     prompt: 'Based on my tasks, habits and streak, what should I focus on today? Give me a short, concrete plan.' },
]

// ─── Main AIChatView ────────────────────────────────────────────
export default function CoachView() {
  const [config, setConfig]       = useState(loadConfig)
  const [msgs, setMsgs]           = useState(loadChat)
  const [input, setInput]         = useState('')
  const [loading, setLoading]     = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [error, setError]         = useState('')
  // Which providers have a host-configured shared key (booleans; never keys)
  const [serverProviders, setServerProviders] = useState({})
  // actionStatuses: { [msgIndex]: { [actionIdx]: 'applied'|'exists'|'error' } }
  const [actionStatuses, setActionStatuses] = useState({})
  const toast = useToast()
  const bottomRef = useRef(null)
  const inputRef  = useRef(null)

  // Ask the backend which providers it can serve with a shared key.
  // A BYOK key still wins — this only enables keyless setups.
  useEffect(() => {
    const token = localStorage.getItem('mf_token') || localStorage.getItem('prince_token')
    if (!token) return
    fetch(`${BASE_URL}/ai/providers`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (d?.success && d.data) setServerProviders(d.data) })
      .catch(() => {})
  }, [])

  const hasOwnKey = Boolean(config.apiKey)
  const hasServerKey = Boolean(config.useServerKey && serverProviders[config.provider])
  const isReady = Boolean(config.provider && config.model && (hasOwnKey || hasServerKey))
  // Resolve the active provider from the full catalogue (first-party,
  // aggregators and the user's custom providers).
  const prov = getAllProviders().find(p => p.id === config.provider)
  const activeBaseUrl = config.baseUrls?.[config.provider] || prov?.baseUrl || ''
  const activeModelLabel = prov?.models?.find(m => m.id === config.model)?.label || config.model

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs, loading])

  useEffect(() => { saveChat(msgs) }, [msgs])

  // ── Apply proposed actions to the account (Coach writes, user approves) ──
  const applyOne = useCallback(async (msgIndex, actionIdx, action) => {
    setActionStatuses(prev => ({
      ...prev,
      [msgIndex]: { ...prev[msgIndex], [actionIdx]: 'applying' },
    }))
    try {
      const r = await applyCoachAction(action)
      setActionStatuses(prev => ({
        ...prev,
        [msgIndex]: { ...prev[msgIndex], [actionIdx]: r },
      }))
      if (r === 'ok') toast.success('Added to your account.')
    } catch (e) {
      setActionStatuses(prev => ({
        ...prev,
        [msgIndex]: { ...prev[msgIndex], [actionIdx]: 'error' },
      }))
      toast.error(e.message || 'Could not apply change.')
    }
  }, [toast])

  const applyAll = useCallback(async (msgIndex) => {
    const { actions } = splitActions(msgs[msgIndex]?.content || '')
    for (let i = 0; i < actions.length; i++) {
      await applyOne(msgIndex, i, actions[i])
    }
  }, [msgs, applyOne])

  const sendMessage = async (text) => {
    const content = (text || input).trim()
    if (!content || !isReady || loading) return
    setInput('')
    setError('')

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    const userMsg = { role: 'user', content, time }
    const updated = [...msgs, userMsg]
    setMsgs(updated)
    setLoading(true)

    try {
      const token = localStorage.getItem('mf_token') || localStorage.getItem('prince_token')
      const res = await fetch(`${BASE_URL}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          provider: config.provider,
          model: config.model,
          apiKey: config.apiKey || undefined,
          baseUrl: activeBaseUrl || undefined,   // OpenRouter / NVIDIA / custom endpoints
          messages: updated.map(({ role, content }) => ({ role, content })),
        }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.success) {
        // If auth error, we can specifically flag it
        const isAuthError = res.status === 401 || data?.message?.toLowerCase().includes('api key')
        setError({
          message: data?.message || (res.status === 401 ? 'Your session expired — sign in again.' : 'AI request failed'),
          isAuth: isAuthError
        })
        return
      }
      const aTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      const reply = data.reply?.trim()
      if (!reply) {
        setError({ message: 'AI returned an empty response.', isAuth: false })
      } else {
        setMsgs(prev => [...prev, { role: 'assistant', content: reply, time: aTime }])
      }
    } catch (err) {
      console.error('Frontend AI Error:', err)
      setError({ message: err.message || 'Failed to connect to AI service.', isAuth: false })
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  const handleConfig = (cfg) => {
    setConfig(cfg)
    saveConfig(cfg)
  }

  const clearChat = () => { setMsgs([]); saveChat([]) }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
      <style>{`@keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} } @keyframes lp-blink { 0%,100%{opacity:1} 50%{opacity:0} } .ai-input:focus { border-color: var(--cyan) !important; outline: none; } .ai-suggest:hover { background: var(--bg-card-hover) !important; border-color: var(--cyan) !important; color: var(--cyan) !important; }`}</style>

      {/* ── Settings Panel ── */}
      {showSettings && <AISettings config={config} onSave={handleConfig} onClose={() => setShowSettings(false)} serverProviders={serverProviders} />}

      {/* ── Header ── */}
      <div style={{ padding: '16px 20px 12px', flexShrink: 0, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 12, background: 'var(--brand-primary-dim)', border: '1px solid var(--brand-primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Brain size={18} color="var(--cyan)" />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 16 }}>Coach</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {isReady
                ? <span style={{ color: 'var(--green)' }}>● {prov?.name || config.provider} · {activeModelLabel}{hasServerKey && !hasOwnKey ? ' · shared key' : ''} · can edit your plan</span>
                : <span style={{ color: 'var(--amber)' }}>● Pick a provider & add your API key to start</span>
              }
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {msgs.length > 0 && (
            <button onClick={clearChat} title="Clear chat" style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-muted)', padding: '7px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--red)'; e.currentTarget.style.color = 'var(--red)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)' }}>
              <Trash2 size={13} />
            </button>
          )}
          <button onClick={() => setShowSettings(true)} style={{ background: isReady ? 'var(--bg-glass)' : 'var(--cyan-dim)', border: `1px solid ${isReady ? 'var(--border)' : 'var(--brand-primary-glow)'}`, borderRadius: 8, color: isReady ? 'var(--text-secondary)' : 'var(--cyan)', padding: '7px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, transition: 'all 0.15s' }}>
            <Key size={13} /> {isReady ? 'Settings' : 'Add API Key'}
          </button>
        </div>
      </div>

      {/* ── Messages ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 8px', display: 'flex', flexDirection: 'column' }}>

        {/* Empty state */}
        {msgs.length === 0 && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 28 }}>
            <div>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🧠</div>
              <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>Meet Coach.</div>
              <div style={{ fontSize: 14, color: 'var(--text-muted)', maxWidth: 400, lineHeight: 1.6 }}>
                I read your tasks, habits, goals and streak — then I can plan your week and write the changes straight into your account. You approve every edit before it lands.
              </div>
            </div>

            {!isReady && (
              <div style={{ background: 'var(--amber-dim)', border: '1px solid var(--amber-glow)', borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12, maxWidth: 380 }}>
                <AlertCircle size={16} color="var(--amber)" style={{ flexShrink: 0 }} />
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', textAlign: 'left' }}>
                  Add your API key to get started. Your key is stored locally and never sent to us.
                  <button onClick={() => setShowSettings(true)} style={{ display: 'block', marginTop: 6, background: 'none', color: 'var(--cyan)', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-display)', padding: 0 }}>
                    Configure now →
                  </button>
                </div>
              </div>
            )}

            {isReady && (
              <div style={{ width: '100%', maxWidth: 500 }}>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 12 }}>SUGGESTED QUESTIONS</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {SUGGESTIONS.map(s => (
                    <button key={s} className="ai-suggest" onClick={() => sendMessage(s)} style={{
                      background: 'var(--bg-card)', border: '1px solid var(--border)',
                      borderRadius: 10, padding: '11px 16px', fontSize: 13,
                      color: 'var(--text-secondary)', cursor: 'pointer', textAlign: 'left',
                      fontFamily: 'var(--font-display)', transition: 'all 0.15s',
                    }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Messages */}
        {msgs.map((m, i) => <Bubble key={i} msg={m} msgIndex={i} onApply={applyOne} onApplyAll={applyAll} actionStatuses={actionStatuses} />)}

        {/* Loading */}
        {loading && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 16 }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--bg-glass)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Bot size={14} color="var(--cyan)" />
            </div>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '18px 18px 18px 4px', padding: '14px 18px', display: 'flex', gap: 5, alignItems: 'center' }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--cyan)', animation: `lp-blink 1.2s ${i * 0.2}s ease-in-out infinite` }} />
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, background: 'var(--red-dim)', border: '1px solid var(--red-dim)', borderRadius: 12, padding: '14px 18px', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <AlertCircle size={14} color="var(--red)" style={{ flexShrink: 0 }} />
              <div style={{ flex: 1, fontSize: 13, color: 'var(--red)', fontWeight: 600 }}>{error.message}</div>
              <button onClick={() => setError('')} style={{ background: 'none', color: 'var(--text-muted)', display: 'flex', padding: 4 }}><X size={14} /></button>
            </div>
            {error.isAuth && (
              <button onClick={() => { setError(''); setShowSettings(true) }} style={{
                alignSelf: 'flex-start', background: 'var(--red)', color: '#fff', border: 'none',
                borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'var(--font-display)', marginLeft: 24,
              }}>
                Update AI Configuration
              </button>
            )}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Input area ── */}
      <div style={{ padding: '12px 16px 16px', flexShrink: 0, borderTop: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
        {/* Quick starts */}
        {isReady && (
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 10, marginBottom: 4, scrollbarWidth: 'none' }}>
            {QUICK_ACTIONS.map(q => {
              const QIcon = q.icon
              return (
                <button key={q.label} onClick={() => sendMessage(q.prompt)} disabled={loading}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0,
                    background: 'var(--bg-card)', border: '1px solid var(--border)',
                    borderRadius: 980, padding: '8px 14px', fontSize: 12.5, fontWeight: 500,
                    color: 'var(--text-secondary)', cursor: loading ? 'wait' : 'pointer',
                    fontFamily: 'var(--font-display)', whiteSpace: 'nowrap', transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--cyan)'; e.currentTarget.style.color = 'var(--cyan)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)' }}>
                  <QIcon size={13} style={{ color: 'var(--cyan)' }} />
                  {q.label}
                </button>
              )
            })}
          </div>
        )}
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
          <textarea
            ref={inputRef}
            className="ai-input"
            value={input}
            onChange={e => {
              setInput(e.target.value)
              // auto-grow up to max-height
              const el = e.target
              el.style.height = 'auto'
              el.style.height = Math.min(el.scrollHeight, 120) + 'px'
            }}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
            placeholder={isReady ? 'Ask anything about your habits, tasks, goals… (Enter to send)' : 'Configure your API key first…'}
            disabled={!isReady || loading}
            rows={1}
            style={{
              flex: 1, background: 'var(--bg-glass)', border: '1px solid var(--border)',
              borderRadius: 12, padding: '12px 14px', fontSize: 14.5,
              color: 'var(--text-primary)', fontFamily: 'var(--font-body)',
              resize: 'none', lineHeight: 1.5,
              maxHeight: 120, overflowY: 'auto',
              opacity: isReady ? 1 : 0.5,
              transition: 'border-color 0.15s',
            }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!isReady || !input.trim() || loading}
            style={{
              width: 44, height: 44, borderRadius: 12, flexShrink: 0,
              background: isReady && input.trim() && !loading
                ? 'var(--btn-primary-bg)'
                : 'var(--bg-glass)',
              border: `1px solid ${isReady && input.trim() ? 'transparent' : 'var(--border)'}`,
              color: isReady && input.trim() && !loading ? '#fff' : 'var(--text-muted)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: isReady && input.trim() && !loading ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s',
            }}
          >
            {loading ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={16} />}
          </button>
        </div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Zap size={9} />
          Coach proposes, you approve — edits land in Tasks, Habits & Goals · Powered by your own API key
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
