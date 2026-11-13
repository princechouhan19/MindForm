import React, { useEffect, useState, useCallback } from 'react'
import { X, Cable, ShieldCheck, KeyRound, Plus, RefreshCw, Trash2, AlertTriangle, BookOpen, Clock, CheckCircle2 } from 'lucide-react'
import { mcpAPI } from '../api/client'
import { useToast } from './Toast'
import { useConfirm } from './ConfirmDialog'
import CodeBlock, { CopyButton } from './CodeBlock'
import MFButton from './ui'
import { mcpConfigs, PLATFORM_ORDER } from '../lib/mcp-configs'
import { navigateTo } from '../lib/nav'

/* ═══════════════════════════════════════════════════════════════
   MCPModal — "Connect your tools" panel for the MindForm MCP server.

   Auth model: per-account MCP keys (mfk_…), no JWT. Create → shown
   once → paste into Claude Desktop / Cursor / Codex / Antigravity /
   any MCP client. Rotate or revoke instantly. The server stores
   only a SHA-256 hash, so the plaintext can never be shown again.

   Rendered from Settings → MCP Server and Coach → Settings.
   ═══════════════════════════════════════════════════════════════ */

const TOOL_GROUPS = [
  { label: 'Tasks',  color: 'var(--cyan)',               tools: ['list_tasks', 'create_task', 'delete_task'] },
  { label: 'Habits', color: 'var(--amber)',              tools: ['list_habits', 'create_habit', 'update_habit', 'delete_habit', 'check_habit'] },
  { label: 'Goals',  color: 'var(--brand-secondary)',    tools: ['list_goals', 'create_goal', 'complete_goal', 'delete_goal'] },
  { label: 'Stats',  color: 'var(--purple)',             tools: ['get_overview'] },
]

const fmtDate = (d) => {
  try { return new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) } catch { return '—' }
}

export default function MCPModal({ onClose }) {
  const toast = useToast()
  const confirm = useConfirm()
  const [keys, setKeys] = useState(null)            // null = loading
  const [creating, setCreating] = useState(false)   // inline create form
  const [keyName, setKeyName] = useState('')
  const [busy, setBusy] = useState(false)
  const [freshKey, setFreshKey] = useState(null)    // plaintext shown once
  const [tab, setTab] = useState('claude')
  const [activeKey, setActiveKey] = useState('')    // plaintext (while modal open) to fill configs

  const base = (() => { try { return window.location.origin || 'https://mindform.onrender.com' } catch { return 'https://mindform.onrender.com' } })()

  const loadKeys = useCallback(async () => {
    try {
      const res = await mcpAPI.list()
      setKeys(res?.data || [])
    } catch (err) {
      setKeys([])
      toast.error(err.message || 'Could not load MCP keys.')
    }
  }, [toast])

  useEffect(() => {
    loadKeys()
  }, [loadKeys])

  // ESC closes the modal (accessibility)
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const handleCreate = async () => {
    const name = keyName.trim() || 'My key'
    setBusy(true)
    try {
      const res = await mcpAPI.create(name)
      const key = res?.data?.key
      if (!key) throw new Error('Key creation returned no key.')
      setFreshKey(key)
      setActiveKey(key)
      setCreating(false)
      setKeyName('')
      loadKeys()
      toast.success('Key created — copy it now, it will not be shown again.')
    } catch (err) {
      toast.error(err.message || 'Could not create the key.')
    } finally {
      setBusy(false)
    }
  }

  const handleRotate = async (k) => {
    const ok = await confirm({
      title: `Rotate “${k.name}”?`,
      body: 'A new key is generated and the old one stops working immediately. You will need to update any client that used the old key.',
      confirmLabel: 'Rotate',
      danger: false,
    })
    if (!ok) return
    try {
      const res = await mcpAPI.rotate(k.id)
      const key = res?.data?.key
      setFreshKey(key || null)
      if (key) setActiveKey(key)
      loadKeys()
      toast.success(key ? 'Key rotated — copy the new key below.' : 'Key rotated.')
    } catch (err) {
      toast.error(err.message || 'Could not rotate the key.')
    }
  }

  const handleRevoke = async (k) => {
    const ok = await confirm({
      title: `Revoke “${k.name}”?`,
      body: 'Every tool call with this key fails immediately. This cannot be undone — create a new key when you need one.',
      confirmLabel: 'Revoke',
      danger: true,
    })
    if (!ok) return
    try {
      await mcpAPI.revoke(k.id)
      if (freshKey && k.prefix && freshKey.startsWith(k.prefix)) { setFreshKey(null); setActiveKey('') }
      loadKeys()
      toast.success('Key revoked.')
    } catch (err) {
      toast.error(err.message || 'Could not revoke the key.')
    }
  }

  const cfg = mcpConfigs(base, activeKey || 'mfk_YOUR_KEY_HERE')
  const c = cfg[tab]

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 90,
      background: 'rgba(10,11,15,0.7)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18,
    }}>
      <div role="dialog" aria-modal="true" aria-label="MCP server" onClick={e => e.stopPropagation()} className="mf-sheet"
        style={{ width: 'min(600px, 100%)', maxHeight: 'min(88dvh, 760px)', overflowY: 'auto', padding: 0 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '22px 24px 16px', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, background: 'var(--bg-card)', zIndex: 2, borderRadius: '20px 20px 0 0' }}>
          <div style={{ width: 38, height: 38, borderRadius: 12, background: 'color-mix(in srgb, var(--purple) 15%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Cable size={18} color="var(--purple, var(--brand-primary))" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>MCP Server</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Quick-edit your data from Claude, Cursor, Codex & Antigravity</div>
          </div>
          <button onClick={onClose} aria-label="Close" style={{ background: 'none', color: 'var(--text-muted)', display: 'flex', padding: 7, borderRadius: 8, border: '1px solid var(--border)', cursor: 'pointer' }}>
            <X size={14} />
          </button>
        </div>

        <div style={{ padding: '18px 24px 26px' }}>
          <p style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--text-secondary)', margin: '0 0 16px' }}>
            MindForm ships a <strong style={{ color: 'var(--text-primary)' }}>Model Context Protocol (MCP) server</strong>.
            Connect it with a personal <strong style={{ color: 'var(--text-primary)' }}>account key</strong> — no password,
            no JWT — and your AI tools can list, create, update and delete your tasks, habits and goals with plain
            tool calls, always scoped to your account.
          </p>

          {/* ── Account keys ───────────────────────────── */}
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
            <KeyRound size={11} /> ACCOUNT KEYS
          </div>

          {/* Plaintext reveal (once) */}
          {freshKey && (
            <div style={{
              background: 'color-mix(in srgb, var(--brand-warning, #f59e0b) 8%, transparent)',
              border: '1px solid color-mix(in srgb, var(--brand-warning, #f59e0b) 35%, transparent)',
              borderRadius: 12, padding: '12px 14px', marginBottom: 14,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <AlertTriangle size={14} color="var(--brand-warning, #f59e0b)" />
                <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--brand-warning, #f59e0b)' }}>Copy it now — shown only once</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <code style={{
                  flex: 1, fontFamily: 'var(--font-mono)', fontSize: 11.5, wordBreak: 'break-all',
                  background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 10px', color: 'var(--text-primary)',
                }}>{freshKey}</code>
                <CopyButton text={freshKey} label="Copy key" />
              </div>
            </div>
          )}

          {/* Keys list */}
          {keys === null ? (
            <div style={{ fontSize: 12.5, color: 'var(--text-muted)', padding: '8px 2px 14px' }}>Loading keys…</div>
          ) : keys.length === 0 ? (
            <div style={{ fontSize: 12.5, color: 'var(--text-muted)', padding: '8px 2px 14px', lineHeight: 1.55 }}>
              No keys yet. Create one per machine or client — you can revoke each independently.
            </div>
          ) : (
            <div style={{ border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', marginBottom: 12 }}>
              {keys.map((k, i) => (
                <div key={k.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px',
                  borderTop: i ? '1px solid var(--border)' : 'none', flexWrap: 'wrap',
                }}>
                  <div style={{ flex: 1, minWidth: 140 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 13.5, fontWeight: 600, color: k.revoked ? 'var(--text-muted)' : 'var(--text-primary)', textDecoration: k.revoked ? 'line-through' : 'none' }}>{k.name}</span>
                      {k.revoked
                        ? <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--red)', background: 'color-mix(in srgb, var(--red) 12%, transparent)', padding: '2px 8px', borderRadius: 20 }}>REVOKED</span>
                        : <CheckCircle2 size={13} color="var(--brand-success)" />}
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{k.prefix}…</div>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: 1, minWidth: 130 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Clock size={10} /> created {fmtDate(k.createdAt)}</span>
                    <span>{k.lastUsedAt ? `last used ${fmtDate(k.lastUsedAt)}` : 'never used'}</span>
                  </div>
                  {!k.revoked && (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => handleRotate(k)} title="Rotate key" style={{
                        background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: 8,
                        color: 'var(--text-secondary)', padding: 7, cursor: 'pointer', display: 'flex',
                      }}><RefreshCw size={13} /></button>
                      <button onClick={() => handleRevoke(k)} title="Revoke key" style={{
                        background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: 8,
                        color: 'var(--text-muted)', padding: 7, cursor: 'pointer', display: 'flex',
                      }}
                        onMouseEnter={e => { e.currentTarget.style.color = 'var(--red)'; e.currentTarget.style.borderColor = 'var(--red)' }}
                        onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)' }}
                      ><Trash2 size={13} /></button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Create key */}
          {creating ? (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16 }}>
              <input
                autoFocus
                value={keyName}
                onChange={e => setKeyName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleCreate() }}
                placeholder="Key name — e.g. “MacBook Cursor”"
                maxLength={40}
                style={{
                  flex: 1, background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: 10,
                  padding: '10px 12px', fontSize: 13, color: 'var(--text-primary)',
                }}
              />
              <MFButton onClick={handleCreate} disabled={busy} size="sm">{busy ? 'Creating…' : 'Create'}</MFButton>
              <MFButton variant="glass" onClick={() => { setCreating(false); setKeyName('') }} size="sm">Cancel</MFButton>
            </div>
          ) : (
            <div style={{ marginBottom: 16 }}>
              <MFButton variant="secondary" size="sm" onClick={() => { setCreating(true); setFreshKey(null) }}>
                <Plus size={13} /> Create key
              </MFButton>
            </div>
          )}

          {/* ── Tools ──────────────────────────────────── */}
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 10 }}>13 TOOLS INCLUDED</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8, marginBottom: 20 }}>
            {TOOL_GROUPS.map(g => (
              <div key={g.label} style={{ background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: 12, padding: '10px 12px' }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: g.color, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 6 }}>{g.label}</div>
                {g.tools.map(t => (
                  <div key={t} style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-secondary)', padding: '2px 0' }}>{t}</div>
                ))}
              </div>
            ))}
          </div>

          {/* ── Platform setup ─────────────────────────── */}
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 10 }}>CONNECT YOUR PLATFORM</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
            {PLATFORM_ORDER.map(id => (
              <button key={id} onClick={() => setTab(id)} style={{
                background: tab === id ? 'color-mix(in srgb, var(--purple) 14%, transparent)' : 'var(--bg-glass)',
                border: `1px solid ${tab === id ? 'color-mix(in srgb, var(--purple) 45%, transparent)' : 'var(--border)'}`,
                borderRadius: 980, padding: '6px 13px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                color: tab === id ? 'var(--purple, var(--brand-primary))' : 'var(--text-secondary)',
                fontFamily: 'var(--font-display)', transition: 'all 0.15s',
              }}>{cfg[id].label}</button>
            ))}
          </div>

          {c.steps?.length > 0 && (
            <ol style={{ margin: '0 0 10px', padding: '0 0 0 18px', fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.7 }}>
              {c.steps.map(s => <li key={s}>{s}</li>)}
            </ol>
          )}
          <CodeBlock code={c.code} note={c.note} />

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 14px', marginTop: 6 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', flex: 1, minWidth: 220 }}>
              <ShieldCheck size={15} color="var(--brand-success)" style={{ flexShrink: 0, marginTop: 1 }} />
              <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                Keys are stored as SHA-256 hashes and scoped to your account only. Revoke any time — access ends on the next request.
              </div>
            </div>
            <button
              onClick={() => { onClose(); navigateTo('/docs/mcp') }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, flexShrink: 0,
                background: 'none', border: '1px solid var(--border)', borderRadius: 980,
                color: 'var(--cyan)', padding: '8px 14px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
                fontFamily: 'var(--font-display)',
              }}>
              <BookOpen size={13} /> Full guide
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
