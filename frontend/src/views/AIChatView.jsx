import React, { useState, useEffect, useRef } from 'react'
import {
  Bot, Send, Settings2, Key, ChevronDown, Trash2,
  Sparkles, User, AlertCircle, CheckCircle, Loader,
  MessageSquare, X, Eye, EyeOff, Zap,
} from 'lucide-react'

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

// ── Markdown-lite renderer ──────────────────────────────────────
function MdText({ text }) {
  const parseInline = (str) => {
    if (!str) return null
    const parts = str.split(/(\*\*[^*]+\*\*)/g)
    return parts.map((p, i) => {
      if (p.startsWith('**') && p.endsWith('**')) {
        return <strong key={i} style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{p.slice(2, -2)}</strong>
      }
      return p
    })
  }

  const lines = text.split('\n')
  return (
    <div style={{ lineHeight: 1.6, fontSize: 14, color: 'var(--text-secondary)' }}>
      {lines.map((ln, i) => {
        const trimmed = ln.trim()
        if (trimmed.startsWith('```')) return null
        
        // Headings
        if (trimmed.startsWith('### ')) return <div key={i} style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)', margin: '14px 0 6px' }}>{parseInline(trimmed.slice(4))}</div>
        if (trimmed.startsWith('## '))  return <div key={i} style={{ fontWeight: 700, fontSize: 18, color: 'var(--text-primary)', margin: '16px 0 8px' }}>{parseInline(trimmed.slice(3))}</div>
        if (trimmed.startsWith('# '))   return <div key={i} style={{ fontWeight: 800, fontSize: 20, color: 'var(--text-primary)', margin: '18px 0 10px' }}>{parseInline(trimmed.slice(2))}</div>
        
        // Lists
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ')) {
          return <div key={i} style={{ display: 'flex', gap: 8, paddingLeft: 4, margin: '4px 0' }}>
            <span style={{ color: 'var(--cyan)', fontWeight: 700 }}>•</span>
            <div style={{ flex: 1 }}>{parseInline(trimmed.slice(2))}</div>
          </div>
        }
        
        // Numbered
        const numMatch = trimmed.match(/^(\d+\.)\s+(.*)/)
        if (numMatch) {
          return <div key={i} style={{ display: 'flex', gap: 8, paddingLeft: 4, margin: '8px 0 4px' }}>
            <span style={{ color: 'var(--cyan)', fontWeight: 800, fontFamily: 'var(--font-mono)', fontSize: 13 }}>{numMatch[1]}</span>
            <div style={{ flex: 1, color: 'var(--text-primary)', fontWeight: 600 }}>{parseInline(numMatch[2])}</div>
          </div>
        }

        // Normal text
        return (
          <div key={i} style={{ margin: trimmed === '' ? '8px 0' : '4px 0', minHeight: trimmed === '' ? 10 : 'auto' }}>
            {parseInline(ln)}
          </div>
        )
      })}
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
            }} onMouseEnter={e => { if (value !== o.id) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }} onMouseLeave={e => { if (value !== o.id) e.currentTarget.style.background = 'transparent' }}>
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
              <div style={{ fontWeight: 800, fontSize: 16 }}>AI Configuration</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Your key stays on your device</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', color: 'var(--text-muted)', display: 'flex', padding: 6, borderRadius: 8, border: '1px solid var(--border)' }}>
            <X size={14} />
          </button>
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 10 }}>PROVIDER</div>
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
                  <div style={{ fontSize: 12, fontWeight: 700, color: provider === p.id ? p.color : 'var(--text-secondary)' }}>{p.name}</div>
                  {allKeys[p.id] && <div style={{ fontSize: 9, color: 'var(--green)', marginTop: 2 }}>● Key saved</div>}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Model selector */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 8 }}>MODEL</div>
          <CustomSelect
            value={model}
            options={prov?.models || []}
            onChange={setModel}
            placeholder="Select AI model..."
          />
        </div>

        {/* API Key */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 8 }}>
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
            background: !model || !apiKey.trim() ? 'var(--bg-glass)' : `linear-gradient(135deg, ${prov?.color || 'var(--cyan)'}, var(--cyan))`,
            border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700,
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
function Bubble({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: 16 }}>
      {!isUser && (
        <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg, var(--cyan-dim), rgba(167,139,250,0.2))', border: '1px solid var(--border-bright)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
          <Bot size={14} color="var(--cyan)" />
        </div>
      )}
      <div style={{
        maxWidth: '78%',
        background: isUser ? 'linear-gradient(135deg, var(--cyan-dim), rgba(0,119,255,0.12))' : 'var(--bg-card)',
        border: `1px solid ${isUser ? 'rgba(0,229,255,0.25)' : 'var(--border)'}`,
        borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
        padding: '12px 16px',
      }}>
        {isUser
          ? <div style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--text-primary)' }}>{msg.content}</div>
          : <MdText text={msg.content} />
        }
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
  'How am I progressing on my goals this month?',
  'What habits should I prioritize today?',
  'Analyze my task completion and give tips',
  'Help me stay consistent with my streak',
  'What\'s my biggest productivity weakness?',
  'Create a daily routine based on my habits',
]

// ─── Main AIChatView ────────────────────────────────────────────
export default function AIChatView() {
  const [config, setConfig]       = useState(loadConfig)
  const [msgs, setMsgs]           = useState(loadChat)
  const [input, setInput]         = useState('')
  const [loading, setLoading]     = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [error, setError]         = useState('')
  const bottomRef = useRef(null)
  const inputRef  = useRef(null)

  const isReady = config.provider && config.model && config.apiKey
  const prov = PROVIDERS.find(p => p.id === config.provider)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs, loading])

  useEffect(() => { saveChat(msgs) }, [msgs])

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
      const token = localStorage.getItem('prince_token')
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
      const data = await res.json()
      if (!res.ok || !data.success) {
        // If auth error, we can specifically flag it
        const isAuthError = res.status === 401 || data.message?.toLowerCase().includes('api key')
        setError({
          message: data.message || 'AI request failed',
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
          <div style={{ width: 38, height: 38, borderRadius: 12, background: 'linear-gradient(135deg, var(--cyan-dim), rgba(167,139,250,0.18))', border: '1px solid rgba(0,229,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={18} color="var(--cyan)" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16 }}>MindForm AI</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {isReady
                ? <span style={{ color: 'var(--green)' }}>● {prov?.name} · {prov?.models.find(m => m.id === config.model)?.label}</span>
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
          <button onClick={() => setShowSettings(true)} style={{ background: isReady ? 'var(--bg-glass)' : 'var(--cyan-dim)', border: `1px solid ${isReady ? 'var(--border)' : 'rgba(0,229,255,0.3)'}`, borderRadius: 8, color: isReady ? 'var(--text-secondary)' : 'var(--cyan)', padding: '7px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, transition: 'all 0.15s' }}>
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
              <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Your Personal AI Coach</div>
              <div style={{ fontSize: 14, color: 'var(--text-muted)', maxWidth: 380, lineHeight: 1.6 }}>
                I have access to your tasks, habits, goals, and streak — so I can give you truly personalized advice.
              </div>
            </div>

            {!isReady && (
              <div style={{ background: 'rgba(255,183,0,0.08)', border: '1px solid rgba(255,183,0,0.25)', borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12, maxWidth: 380 }}>
                <AlertCircle size={16} color="var(--amber)" style={{ flexShrink: 0 }} />
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', textAlign: 'left' }}>
                  Add your API key to get started. Your key is stored locally and never sent to us.
                  <button onClick={() => setShowSettings(true)} style={{ display: 'block', marginTop: 6, background: 'none', color: 'var(--cyan)', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-display)', padding: 0 }}>
                    Configure now →
                  </button>
                </div>
              </div>
            )}

            {isReady && (
              <div style={{ width: '100%', maxWidth: 500 }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 12 }}>SUGGESTED QUESTIONS</div>
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
        {msgs.map((m, i) => <Bubble key={i} msg={m} />)}

        {/* Loading */}
        {loading && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 16 }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg, var(--cyan-dim), rgba(167,139,250,0.2))', border: '1px solid var(--border-bright)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, background: 'rgba(255,71,87,0.08)', border: '1px solid rgba(255,71,87,0.25)', borderRadius: 12, padding: '14px 18px', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <AlertCircle size={14} color="var(--red)" style={{ flexShrink: 0 }} />
              <div style={{ flex: 1, fontSize: 13, color: 'var(--red)', fontWeight: 500 }}>{error.message}</div>
              <button onClick={() => setError('')} style={{ background: 'none', color: 'var(--text-muted)', display: 'flex', padding: 4 }}><X size={14} /></button>
            </div>
            {error.isAuth && (
              <button onClick={() => { setError(''); setShowSettings(true) }} style={{
                alignSelf: 'flex-start', background: 'var(--red)', color: '#fff', border: 'none',
                borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 700,
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
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
          <textarea
            ref={inputRef}
            className="ai-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
            placeholder={isReady ? 'Ask anything about your habits, tasks, goals… (Enter to send)' : 'Configure your API key first…'}
            disabled={!isReady || loading}
            rows={1}
            style={{
              flex: 1, background: 'var(--bg-glass)', border: '1px solid var(--border)',
              borderRadius: 12, padding: '12px 14px', fontSize: 14,
              color: 'var(--text-primary)', fontFamily: 'var(--font-display)',
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
                ? `linear-gradient(135deg, var(--cyan), #0077ff)`
                : 'var(--bg-glass)',
              border: `1px solid ${isReady && input.trim() ? 'transparent' : 'var(--border)'}`,
              color: isReady && input.trim() && !loading ? '#000' : 'var(--text-muted)',
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
          Powered by your own API key · RAG-personalized with your MindForm data · Shift+Enter for new line
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
