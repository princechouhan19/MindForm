import React, { useEffect, useState } from 'react'
import { X, Copy, Check, Cable, ShieldCheck, Terminal } from 'lucide-react'

/* ═══════════════════════════════════════════════════════════════
   MCPModal — "Connect your tools" panel for the MindForm MCP server.

   The MCP server (backend/src/mcp/server.js) speaks Model Context
   Protocol over stdio and exposes 12 tools that read and edit the
   signed-in user's tasks, habits and goals — the same quick edits
   Coach proposes in the app. Rendered from Settings and Coach.
   ═══════════════════════════════════════════════════════════════ */

const TOOL_GROUPS = [
  { label: 'Tasks',  color: 'var(--cyan)',   tools: ['list_tasks', 'create_task', 'delete_task'] },
  { label: 'Habits', color: 'var(--amber)',  tools: ['list_habits', 'create_habit', 'update_habit', 'delete_habit', 'check_habit'] },
  { label: 'Goals',  color: 'var(--brand-secondary)', tools: ['list_goals', 'create_goal', 'complete_goal', 'delete_goal'] },
]

function CopyButton({ text, label = 'Copy' }) {
  const [done, setDone] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      ta.remove()
    }
    setDone(true)
    setTimeout(() => setDone(false), 1600)
  }
  return (
    <button onClick={copy} style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: 8,
      color: done ? 'var(--green)' : 'var(--text-secondary)', padding: '6px 12px',
      fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-display)',
      transition: 'all 0.15s', flexShrink: 0,
    }}>
      {done ? <Check size={12} /> : <Copy size={12} />} {done ? 'Copied' : label}
    </button>
  )
}

const CodeBlock = ({ children, note }) => (
  <div style={{ marginBottom: 14 }}>
    <div style={{
      position: 'relative', background: 'var(--bg-glass)', border: '1px solid var(--border)',
      borderRadius: 12, padding: '14px 16px', overflowX: 'auto',
    }}>
      <pre style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: 12, lineHeight: 1.6, color: 'var(--text-secondary)', whiteSpace: 'pre' }}>{children}</pre>
      <div style={{ position: 'absolute', top: 8, right: 8 }}><CopyButton text={children} /></div>
    </div>
    {note && <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 6 }}>{note}</div>}
  </div>
)

export default function MCPModal({ onClose }) {
  // ESC closes
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const token = localStorage.getItem('mf_token') || ''
  const claudeConfig = JSON.stringify({
    mcpServers: {
      mindform: {
        command: 'node',
        args: ['/path/to/mindform/backend/src/mcp/server.js'],
        env: {
          MF_URI: 'mongodb://127.0.0.1:27017/mindform',
          MF_TOKEN: '<your-mf-token>',
          JWT_SECRET: '<your-jwt-secret>',
        },
      },
    },
  }, null, 2)

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 90,
      background: 'rgba(10,11,15,0.7)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18,
    }}>
      <div role="dialog" aria-modal="true" aria-label="MCP server" onClick={e => e.stopPropagation()} className="mf-sheet"
        style={{ width: 'min(560px, 100%)', maxHeight: 'min(86dvh, 720px)', overflowY: 'auto', padding: 0 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '22px 24px 16px', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, background: 'var(--bg-card)', zIndex: 2, borderRadius: '20px 20px 0 0' }}>
          <div style={{ width: 38, height: 38, borderRadius: 12, background: 'color-mix(in srgb, var(--purple) 15%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Cable size={18} color="var(--purple, var(--brand-primary))" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>MCP Server</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Quick-edit MindForm from AI tools you already use</div>
          </div>
          <button onClick={onClose} aria-label="Close" style={{ background: 'none', color: 'var(--text-muted)', display: 'flex', padding: 7, borderRadius: 8, border: '1px solid var(--border)', cursor: 'pointer' }}>
            <X size={14} />
          </button>
        </div>

        <div style={{ padding: '18px 24px 26px' }}>
          <p style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--text-secondary)', margin: '0 0 16px' }}>
            MindForm ships a <strong style={{ color: 'var(--text-primary)' }}>Model Context Protocol (MCP) server</strong>.
            Point Claude Desktop, Cursor, Windsurf or any MCP client at it and your assistant can list, create, update
            and delete your tasks, habits and goals with plain tool calls — always scoped to your account, never to anyone else's.
          </p>

          {/* Tools */}
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 10 }}>12 TOOLS INCLUDED</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8, marginBottom: 20 }}>
            {TOOL_GROUPS.map(g => (
              <div key={g.label} style={{ background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: 12, padding: '10px 12px' }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: g.color, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 6 }}>{g.label}</div>
                {g.tools.map(t => (
                  <div key={t} style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-secondary)', padding: '2px 0' }}>{t}</div>
                ))}
              </div>
            ))}
          </div>

          {/* Quick start */}
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Terminal size={11} /> QUICK START
          </div>
          <CodeBlock note={'Run it from the backend folder. MF_TOKEN is your MindForm JWT (button below copies it from this browser).'}>
{`cd backend
MF_TOKEN=<your-token> npm run mcp`}
          </CodeBlock>
          {token && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
              <CopyButton text={token} label="Copy my MF_TOKEN" />
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Local only — the token never leaves this browser.</span>
            </div>
          )}

          {/* Claude Desktop config */}
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 10 }}>CLAUDE DESKTOP CONFIG</div>
          <CodeBlock note={'Paste into Claude Desktop → Settings → Developer → Edit Config, then restart the app.'}>
            {claudeConfig}
          </CodeBlock>

          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 14px' }}>
            <ShieldCheck size={15} color="var(--brand-success)" style={{ flexShrink: 0, marginTop: 1 }} />
            <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
              Full setup guide, tool schemas and security notes live in <code style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, background: 'var(--bg-glass)', padding: '1px 6px', borderRadius: 6 }}>backend/src/mcp/README.md</code>.
              The server is read/write for <em>your</em> account only, and every write mirrors what Coach can do in-app.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
