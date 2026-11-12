import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  Bot, Send, Settings2, Key, ChevronDown, Trash2,
  Sparkles, User, AlertCircle, CheckCircle, Loader,
  MessageSquare, X, Eye, EyeOff, Zap, Check,
  Brain, CalendarPlus, Repeat, ListChecks, Target as TargetIcon, Pencil,
} from 'lucide-react'
import { tasksAPI, habitsAPI, goalsAPI } from '../api/client'
import { useToast } from '../components/Toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// ── Provider / Model catalog ────────────────────────────────────
const PROVIDERS = [
  {
    id: 'openai', name: 'OpenAI', color: '#10a37f',
    logo: 'https://api.iconify.design/logos:openai-icon.svg',
    placeholder: 'sk-...',
    models: [
      { id: 'gpt-4o',             label: 'GPT-4o' },
      { id: 'gpt-4o-mini',        label: 'GPT-4o Mini' },
      { id: 'gpt-4-turbo',        label: 'GPT-4 Turbo' },
      { id: 'o1-mini',            label: 'OpenAI o1 Mini' },
      { id: 'gpt-3.5-turbo',      label: 'GPT-3.5 Turbo' },
    ],
  },
  {
    id: 'gemini', name: 'Google Gemini', color: '#4285f4',
    logo: 'https://api.iconify.design/logos:google-gemini.svg',
    placeholder: 'AIza...',
    models: [
      { id: 'gemini-2.0-flash',        label: 'Gemini 2.0 Flash (Fast & Free)' },
      { id: 'gemini-1.5-pro',          label: 'Gemini 1.5 Pro' },
      { id: 'gemini-1.5-flash',        label: 'Gemini 1.5 Flash' },
      { id: 'gemini-1.5-flash-8b',     label: 'Gemini 1.5 Flash 8B (Lite)' },
      { id: 'gemini-1.0-pro',          label: 'Gemini 1.0 Pro (Legacy)' },
    ],
  },
  {
    id: 'anthropic', name: 'Anthropic Claude', color: '#d97706',
    logo: 'https://api.iconify.design/logos:anthropic-icon.svg',
    placeholder: 'sk-ant-...',
    models: [
      { id: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet' },
      { id: 'claude-3-5-haiku-20241022',  label: 'Claude 3.5 Haiku' },
      { id: 'claude-3-opus-20240229',     label: 'Claude 3 Opus' },
    ],
  },
  {
    id: 'mistral', name: 'Mistral AI', color: '#ff7000',
    logo: 'https://api.iconify.design/logos:mistral-ai-icon.svg',
    placeholder: '...',
    models: [
      { id: 'mistral-large-latest',   label: 'Mistral Large' },
      { id: 'mistral-small-latest',   label: 'Mistral Small' },
      { id: 'open-mixtral-8x7b',      label: 'Mixtral 8×7B' },
    ],
  },
]

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

// ── Settings panel ──────────────────────────────────────────────
function AISettings({ config, onSave, onClose }) {
  const [provider, setProvider] = useState(config.provider || 'openai')
  const [model,    setModel]    = useState(config.model    || '')
  // Per-provider keys: load saved keys and pre-fill for the current provider
  const [allKeys,  setAllKeys]  = useState(loadKeys)
  const [showKey,  setShowKey]  = useState(false)

  // ESC closes the settings sheet (accessibility)
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const prov   = PROVIDERS.find(p => p.id === provider)
  const apiKey = allKeys[provider] || ''

  // When switching providers, model resets and key pre-fills from saved keys
  const handleProviderSwitch = (id) => {
    setProvider(id)
    setModel('')
  }

  const setApiKey = (val) => setAllKeys(prev => ({ ...prev, [provider]: val }))

  const handleSave = () => {
    if (!model || !apiKey.trim()) return
    saveKeys(allKeys)              // persist all provider keys
    onSave({ provider, model, apiKey: apiKey.trim() })
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
        width: '100%', maxWidth: 480,
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 20, padding: '28px 28px 24px',
        animation: 'fadeIn 0.2s ease',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--cyan-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Settings2 size={18} color="var(--cyan)" />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 16 }}>AI Configuration</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Your key stays on your device</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', color: 'var(--text-muted)', display: 'flex', padding: 6, borderRadius: 8, border: '1px solid var(--border)' }}>
            <X size={14} />
          </button>
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 10 }}>PROVIDER</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {PROVIDERS.map(p => (
              <button key={p.id} onClick={() => handleProviderSwitch(p.id)} style={{
                padding: '12px 14px', borderRadius: 12, cursor: 'pointer', textAlign: 'left',
                background: provider === p.id ? p.color + '18' : 'var(--bg-glass)',
                border: `1px solid ${provider === p.id ? p.color + '60' : 'var(--border)'}`,
                transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <img src={p.logo} alt="" style={{ width: 18, height: 18, objectFit: 'contain' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: provider === p.id ? p.color : 'var(--text-secondary)' }}>{p.name}</div>
                  {allKeys[p.id] && <div style={{ fontSize: 9, color: 'var(--green)', marginTop: 2 }}>● Key saved</div>}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Model selector */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 8 }}>MODEL</div>
          <CustomSelect
            value={model}
            options={prov?.models || []}
            onChange={setModel}
            placeholder="Select AI model..."
          />
        </div>

        {/* API Key */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 8 }}>
            API KEY
          </div>
          <div style={{ position: 'relative' }}>
            <Key size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder={prov?.placeholder || 'Your API key...'}
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
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
            <AlertCircle size={10} /> API key is stored only in your browser — never sent to our servers.
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={!model || !apiKey.trim()}
          style={{
            width: '100%', padding: '13px',
            background: !model || !apiKey.trim() ? 'var(--bg-glass)' : 'var(--btn-primary-bg)',
            border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600,
            color: !model || !apiKey.trim() ? 'var(--text-muted)' : '#000',
            cursor: !model || !apiKey.trim() ? 'not-allowed' : 'pointer',
            fontFamily: 'var(--font-display)',
            transition: 'all 0.15s',
          }}
        >
          Save Configuration
        </button>
      </div>
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
  // actionStatuses: { [msgIndex]: { [actionIdx]: 'applied'|'exists'|'error' } }
  const [actionStatuses, setActionStatuses] = useState({})
  const toast = useToast()
  const bottomRef = useRef(null)
  const inputRef  = useRef(null)

  const isReady = config.provider && config.model && config.apiKey
  const prov = PROVIDERS.find(p => p.id === config.provider)

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
          apiKey: config.apiKey,
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
      {showSettings && <AISettings config={config} onSave={handleConfig} onClose={() => setShowSettings(false)} />}

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
                ? <span style={{ color: 'var(--green)' }}>● {prov?.name} · {prov?.models.find(m => m.id === config.model)?.label} · can edit your plan</span>
                : <span style={{ color: 'var(--amber)' }}>● Configure API key to start</span>
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
