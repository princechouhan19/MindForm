import React, { useState } from 'react'
import { Copy, Check } from 'lucide-react'

/* ═══════════════════════════════════════════════════════════════
   Shared copy-to-clipboard primitives.

   CopyButton  — small pill button, flips to "Copied" for 1.6 s
   CodeBlock   — mono pre block with a copy affordance + note line

   Used by the MCP modal, the docs pages and anywhere config text
   needs one-tap copying. Falls back to execCommand for browsers
   without the async clipboard API (or non-secure contexts).
   ═══════════════════════════════════════════════════════════════ */

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    try { document.execCommand('copy') } catch { /* best effort */ }
    ta.remove()
  }
}

export function CopyButton({ text, label = 'Copy', style = {} }) {
  const [done, setDone] = useState(false)
  const copy = async () => {
    await copyText(text)
    setDone(true)
    setTimeout(() => setDone(false), 1600)
  }
  return (
    <button onClick={copy} style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: 8,
      color: done ? 'var(--green)' : 'var(--text-secondary)', padding: '6px 12px',
      fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-display)',
      transition: 'all 0.15s', flexShrink: 0, ...style,
    }}>
      {done ? <Check size={12} /> : <Copy size={12} />} {done ? 'Copied' : label}
    </button>
  )
}

export default function CodeBlock({ children, code, note, label, style = {} }) {
  const raw = code !== undefined ? code : children
  const text = typeof raw === 'string' ? raw : String(raw ?? '')
  return (
    <div style={{ marginBottom: 14 }}>
      {(label || text.length > 60) && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 6 }}>
          {label && (
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', color: 'var(--text-muted)' }}>{label}</div>
          )}
        </div>
      )}
      <div style={{
        position: 'relative', background: 'var(--bg-glass)', border: '1px solid var(--border)',
        borderRadius: 12, padding: '14px 16px', overflowX: 'auto', ...style,
      }}>
        <pre style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: 12, lineHeight: 1.6, color: 'var(--text-secondary)', whiteSpace: 'pre' }}>{text}</pre>
        <div style={{ position: 'sticky', top: 8, float: 'right', marginLeft: 8 }}>
          <CopyButton text={text} />
        </div>
      </div>
      {note && <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 6 }}>{note}</div>}
    </div>
  )
}
