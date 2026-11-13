import React, { useEffect, useRef, useState } from 'react'
import { ArrowLeft, Cable, Brain, BookOpen, ChevronRight, KeyRound, Terminal, ShieldCheck, Wrench, HelpCircle, ArrowUpRight, Bot } from 'lucide-react'
import SiteFooter from '../components/Footer'
import CodeBlock from '../components/CodeBlock'
import MFButton from '../components/ui'
import { navigateTo } from '../lib/nav'
import { mcpConfigs, PLATFORM_ORDER } from '../lib/mcp-configs'

/* ═══════════════════════════════════════════════════════════════
   DocsView — in-app documentation centre (/docs, /docs/mcp,
   /docs/ai-coach). Same scroll contract as SubPages: the page owns
   its own scroll container and always opens at the top.
   ═══════════════════════════════════════════════════════════════ */

import { DOCS_PAGES } from '../lib/docs-registry.jsx'

const origin = () => {
  try { return window.location.origin || 'https://mindform.onrender.com' } catch { return 'https://mindform.onrender.com' }
}

/* ── Tools reference (mirrors backend/src/mcp/tools.js) ─────── */
const TOOL_TABLE = [
  ['list_tasks',    'Tasks',  "This week's tasks with check-off state"],
  ['create_task',   'Tasks',  'Add a task to the current week (time inside the title, e.g. "(09:00)")'],
  ['delete_task',   'Tasks',  'Remove a task from the current week by exact title'],
  ['list_habits',   'Habits', "This month's habits with completion counts"],
  ['create_habit',  'Habits', 'Add a habit (name, emoji, optional time)'],
  ['update_habit',  'Habits', 'Rename / reschedule / re-emoji an existing habit'],
  ['delete_habit',  'Habits', 'Remove a habit by exact name'],
  ['check_habit',   'Habits', "Toggle today's check-in for a habit"],
  ['list_goals',    'Goals',  'All goals with status, category and deadline'],
  ['create_goal',   'Goals',  'Create a goal — deadline required (YYYY-MM-DD)'],
  ['complete_goal', 'Goals',  'Mark a goal completed by exact title'],
  ['delete_goal',   'Goals',  'Delete a goal by exact title'],
  ['get_overview',  'Stats',  'Streak, aura, level, active goals and this week’s task/habit progress in one call'],
]

const TROUBLESHOOTING = [
  ['“Invalid MCP key”', 'The key was revoked, rotated or copied incompletely. Create a fresh one in Settings → MCP Server and re-copy the whole mfk_… string.'],
  ['Tools never appear in the client', 'Restart the client after editing its config. For Claude Desktop, fully quit (⌘Q) — closing the window is not enough.'],
  ['404 on /mcp', 'The MindForm deployment must run the backend with the MCP HTTP route mounted (default). Self-hosting? Confirm you updated the backend and that SERVE_FRONTEND/NODE_ENV is configured.'],
  ['Writes do nothing', 'Check the bucket: tasks write to the CURRENT week and habits to the CURRENT month, exactly like the in-app modules. use list_tasks / list_habits to see what the server sees.'],
  ['Key leaked?', 'Revoke it (Settings → MCP Server) or rotate it — revocation is instant and every tool call with the old key starts failing immediately.'],
]

/* ── Shell layout ──────────────────────────────────────────── */
function DocsPage({ page, theme, setTheme, onHome }) {
  const scrollRef = useRef(null)

  useEffect(() => {
    document.title = `${page.title} — MindForm Docs`
    document.documentElement.setAttribute('data-theme', theme || 'dark')
    if (scrollRef.current) scrollRef.current.scrollTop = 0
    window.scrollTo(0, 0)
    return () => { document.title = 'MindForm — Habit Tracker, Task Planner & Voice Training' }
  }, [page, theme])

  return (
    <div
      ref={scrollRef}
      style={{
        height: '100dvh', overflowY: 'auto', overflowX: 'hidden',
        background: 'var(--lp-canvas)', display: 'flex', flexDirection: 'column',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      <header style={{
        position: 'sticky', top: 0, zIndex: 20,
        background: 'color-mix(in srgb, var(--lp-canvas) 82%, transparent)',
        backdropFilter: 'saturate(180%) blur(20px)', WebkitBackdropFilter: 'saturate(180%) blur(20px)',
        borderBottom: '1px solid var(--lp-hairline)',
      }}>
        <div style={{ maxWidth: 1020, margin: '0 auto', padding: '14px clamp(20px, 5vw, 40px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <button onClick={onHome} className="lp-link" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, flexShrink: 0 }}>
            <ArrowLeft size={15} /> MindForm
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={() => navigateTo('/faq')} className="lp-link" style={{ fontSize: 13, background: 'none', border: 'none', cursor: 'pointer' }}>FAQ</button>
            <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="lp-fine" style={{ background: 'none', border: '1px solid var(--lp-hairline)', borderRadius: 980, padding: '6px 14px', cursor: 'pointer', color: 'var(--lp-ink-2)' }}>
              {theme === 'dark' ? 'Light' : 'Dark'}
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section style={{ maxWidth: 1020, width: '100%', margin: '0 auto', padding: 'clamp(44px, 7vw, 72px) clamp(20px, 5vw, 40px) 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <span className="lp-fine" style={{ color: 'var(--lp-ink-3)' }}>Docs</span>
          <ChevronRight size={12} style={{ color: 'var(--lp-ink-3)' }} />
          <span className="lp-fine" style={{ color: 'var(--lp-accent)', fontWeight: 600 }}>{page.title}</span>
        </div>
        <page.icon size={30} strokeWidth={1.5} style={{ color: 'var(--lp-accent)', marginBottom: 18 }} />
        <h1 className="lp-display" style={{ fontSize: 'clamp(32px, 5vw, 48px)', marginBottom: 14 }}>{page.title}</h1>
        <p className="lp-lead" style={{ color: 'var(--lp-ink-3)' }}>{page.desc}</p>
      </section>

      {/* Body: sidebar + content (sidebar becomes a chip rail on mobile) */}
      <div style={{ maxWidth: 1020, width: '100%', margin: '0 auto', padding: '24px clamp(20px, 5vw, 40px) 80px', flex: 1, display: 'flex', gap: 36, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* Sidebar (desktop) / chip rail (mobile) */}
        <nav style={{
          flexShrink: 0, position: 'sticky', top: 84, display: 'flex', flexDirection: 'column', gap: 4, width: 190,
        }} className="docs-sidebar" aria-label="Docs navigation">
          {DOCS_PAGES.map(p => (
            <button key={p.path} onClick={() => navigateTo(p.path)} style={{
              display: 'flex', alignItems: 'center', gap: 9, textAlign: 'left',
              background: p.path === page.path ? 'color-mix(in srgb, var(--lp-accent) 10%, transparent)' : 'transparent',
              border: 'none', borderRadius: 10, padding: '9px 12px', cursor: 'pointer',
              color: p.path === page.path ? 'var(--lp-accent)' : 'var(--lp-ink-2)', fontSize: 13.5, fontWeight: p.path === page.path ? 600 : 500,
            }}>
              <p.icon size={15} /> {p.title}
            </button>
          ))}
          <div style={{ height: 1, background: 'var(--lp-hairline)', margin: '10px 4px' }} className="docs-toc-divider" />
          {page.path === '/docs/mcp' && <McpToc />}
          {page.path === '/docs/ai-coach' && <CoachToc />}
        </nav>

        <main style={{ flex: 1, minWidth: 'min(100%, 560px)', borderTop: '1px solid var(--lp-hairline)', paddingTop: 8 }}>
          {page.path === '/docs' && <DocsHome />}
          {page.path === '/docs/mcp' && <McpDocs />}
          {page.path === '/docs/ai-coach' && <CoachDocs />}
        </main>
      </div>

      <SiteFooter maxWidth={1020} onNavigate={navigateTo} onHome={onHome} />
      <style>{`
        @media (max-width: 860px) {
          .docs-sidebar {
            position: static !important;
            width: 100% !important;
            flex-direction: row !important;
            flex-wrap: wrap;
            gap: 6px !important;
          }
          .docs-toc-divider { display: none !important }
        }
      `}</style>
    </div>
  )
}

/* Sidebar table-of-contents items */
function TocLink({ href, children }) {
  return (
    <button onClick={() => document.getElementById(href)?.scrollIntoView({ behavior: 'smooth', block: 'start' })} className="lp-fine"
      style={{ background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', color: 'var(--lp-ink-3)', padding: '5px 12px', fontSize: 12 }}>
      {children}
    </button>
  )
}
function McpToc() {
  return (
    <>
      <TocLink href="mcp-what">What is MCP?</TocLink>
      <TocLink href="mcp-key">Step 1 — Create a key</TocLink>
      <TocLink href="mcp-connect">Step 2 — Connect</TocLink>
      <TocLink href="mcp-tools">Tools reference</TocLink>
      <TocLink href="mcp-security">Security</TocLink>
      <TocLink href="mcp-troubleshoot">Troubleshooting</TocLink>
    </>
  )
}
function CoachToc() {
  return (
    <>
      <TocLink href="coach-what">What Coach does</TocLink>
      <TocLink href="coach-setup">Step 1 — Add a key</TocLink>
      <TocLink href="coach-providers">Providers & models</TocLink>
      <TocLink href="coach-custom">Custom providers</TocLink>
      <TocLink href="coach-permissions">Permissions</TocLink>
      <TocLink href="coach-actions">Apply-cards schema</TocLink>
      <TocLink href="coach-privacy">Privacy</TocLink>
    </>
  )
}

/* ── Docs home ─────────────────────────────────────────────── */
function DocsHome() {
  const cards = [
    {
      to: '/docs/mcp', icon: Cable, title: 'MCP Server',
      desc: 'Give Claude Desktop, Cursor, Codex CLI or Antigravity scoped access to your tasks, habits and goals with a personal, revocable key. Per-platform setup configs and the full tool reference.',
      bullets: ['Account keys — no passwords, no JWTs', 'Config for 5 platforms + a generic HTTP mode', '13 tools: list, create, update, delete, check'],
    },
    {
      to: '/docs/ai-coach', icon: Brain, title: 'AI Coach',
      desc: 'Your copilot inside MindForm. Coach reads your plan, proposes concrete edits as review cards, and writes only what you approve. BYOK with a searchable model picker for every provider.',
      bullets: ['OpenAI · Gemini · Claude · Mistral', 'OpenRouter & NVIDIA NIM built in — editable', 'Custom OpenAI-compatible providers'],
    },
  ]
  return (
    <div>
      <H2>Start here</H2>
      <P>Everything below ships inside MindForm — no plugins to buy. Both features are opt-in, scoped to your account, and revocable at any time.</P>
      <div style={{ display: 'grid', gap: 16, margin: '22px 0 8px', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
        {cards.map(c => (
          <button key={c.to} onClick={() => navigateTo(c.to)} style={{
            textAlign: 'left', background: 'var(--lp-card-bg)', border: '1px solid var(--lp-hairline)',
            borderRadius: 18, padding: '22px 24px', cursor: 'pointer', color: 'inherit',
            transition: 'border-color 0.2s, transform 0.2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--lp-accent)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--lp-hairline)'; e.currentTarget.style.transform = 'none' }}>
            <c.icon size={22} strokeWidth={1.6} style={{ color: 'var(--lp-accent)', marginBottom: 12 }} />
            <div className="lp-h3" style={{ fontSize: 19, fontWeight: 600, color: 'var(--lp-ink)', marginBottom: 6 }}>{c.title}</div>
            <p className="lp-body" style={{ color: 'var(--lp-ink-2)', marginBottom: 12 }}>{c.desc}</p>
            {c.bullets.map(b => (
              <div key={b} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '3px 0' }}>
                <span style={{ color: 'var(--lp-accent)', fontWeight: 700, lineHeight: 1.5 }}>·</span>
                <span className="lp-fine" style={{ color: 'var(--lp-ink-2)' }}>{b}</span>
              </div>
            ))}
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 14, color: 'var(--lp-accent)', fontSize: 13.5, fontWeight: 600 }}>
              Open the guide <ArrowUpRight size={14} />
            </div>
          </button>
        ))}
      </div>

      <H2>Where do I configure things?</H2>
      <div style={{ display: 'grid', gap: 12, margin: '18px 0' }}>
        {[
          { icon: KeyRound, t: 'Coach keys & models', d: 'In the app: Coach → Settings (the gear in the top bar). Keys live in your browser only.' },
          { icon: Cable, t: 'MCP account keys', d: 'In the app: Settings → MCP Server. Create, rotate and revoke keys; per-platform configs included.' },
          { icon: Wrench, t: 'Self-hosting', d: 'The backend serves the built frontend; environment variables and deployment notes live in the repository’s docs/ folder.' },
        ].map(r => (
          <div key={r.t} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', background: 'var(--lp-card-bg)', border: '1px solid var(--lp-hairline)', borderRadius: 16, padding: '16px 18px' }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'color-mix(in srgb, var(--lp-accent) 12%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <r.icon size={16} color="var(--lp-accent)" />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--lp-ink)' }}>{r.t}</div>
              <div className="lp-body" style={{ fontSize: 14, color: 'var(--lp-ink-3)', margin: 0 }}>{r.d}</div>
            </div>
          </div>
        ))}
      </div>
      <H2>Questions</H2>
      <P>The FAQ answers the common ones — data retention, pricing, the Speak module and MCP key safety. For anything else, reach the team through the app’s feedback link.</P>
    </div>
  )
}

/* ── MCP docs ──────────────────────────────────────────────── */
function McpDocs() {
  const base = origin()
  const cfg = mcpConfigs(base)
  const platformKeys = PLATFORM_ORDER

  return (
    <div>
      <H2 id="mcp-what">What is MCP?</H2>
      <P>MCP — the Model Context Protocol — is an open standard that lets AI agents call tools. MindForm ships an MCP server alongside the web app. Point your AI client at it and the agent gains <strong>13 tools</strong> that read and edit <em>your</em> tasks, habits and goals with plain, natural-language commands: “add a 9am deep-work block”, “replan my reading habit”, “mark the Lisbon trip goal done”.</P>
      <P>It is the same capability the in-app Coach uses — but exposed to the tools you already work in, on your machine.</P>
      <Callout icon={ShieldCheck} tone="ok">
        Every call is scoped to the key’s account. There is no cross-user access, no shared database context, and the key never grants login to the web app — it only powers MCP tool calls.
      </Callout>

      <H2 id="mcp-key">Step 1 — Create an account key</H2>
      <P>MindForm does not use JWTs or passwords for MCP. Instead, every account can issue its own <strong>MCP keys</strong> — long random strings that look like <code>mfk_…</code> and can be rotated or revoked instantly.</P>
      <NumberedSteps steps={[
        'Log in to MindForm and open Settings → MCP Server (or Coach → Settings → MCP server).',
        'Click Create key and give it a name — e.g. “MacBook Cursor”.',
        'The full key is shown exactly once. Copy it into your client’s config immediately; the server stores only a SHA-256 hash.',
      ]} />
      <Callout icon={KeyRound} tone="warn">
        Treat a key like a password. Anyone holding it can edit your plan through MCP. Lost it? Revoke or rotate from the same panel — old keys stop working on the next request.
      </Callout>

      <H2 id="mcp-connect">Step 2 — Connect your platform</H2>
      <P>Replace <code>mfk_YOUR_KEY_HERE</code> with the key from Step 1. The snippets below already point at this deployment ({base}); self-hosters should swap in their own origin.</P>
      <div style={{ marginTop: 18 }}>
        {platformKeys.map(k => {
          const c = cfg[k]
          return (
            <div key={k} style={{ marginBottom: 22 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 8 }}>
                <Terminal size={14} color="var(--lp-accent)" />
                <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--lp-ink)' }}>{c.label}</span>
              </div>
              <CodeBlock code={c.code} note={c.note} />
            </div>
          )
        })}
      </div>

      <H2 id="mcp-tools">Tools reference</H2>
      <P>13 tools ship today — the same bucket math as the app, so a task created by an agent lands in the week you see on screen.</P>
      <div style={{ overflowX: 'auto', margin: '16px 0 8px', border: '1px solid var(--lp-hairline)', borderRadius: 14 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5, minWidth: 480 }}>
          <thead>
            <tr style={{ background: 'color-mix(in srgb, var(--lp-accent) 7%, transparent)' }}>
              <th style={{ textAlign: 'left', padding: '11px 14px', color: 'var(--lp-ink)', fontWeight: 600 }}>Tool</th>
              <th style={{ textAlign: 'left', padding: '11px 14px', color: 'var(--lp-ink)', fontWeight: 600 }}>Module</th>
              <th style={{ textAlign: 'left', padding: '11px 14px', color: 'var(--lp-ink)', fontWeight: 600 }}>What it does</th>
            </tr>
          </thead>
          <tbody>
            {TOOL_TABLE.map(([name, mod, desc], i) => (
              <tr key={name} style={{ borderTop: i ? '1px solid var(--lp-hairline)' : 'none' }}>
                <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)', fontSize: 12.5, color: 'var(--lp-accent)', whiteSpace: 'nowrap' }}>{name}</td>
                <td style={{ padding: '10px 14px', color: 'var(--lp-ink-2)', whiteSpace: 'nowrap' }}>{mod}</td>
                <td style={{ padding: '10px 14px', color: 'var(--lp-ink-2)' }}>{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <H2 id="mcp-security">Security model</H2>
      <BulletList items={[
        'Keys are stored as SHA-256 hashes — a database leak can never reveal a usable key.',
        'Revocation is instant: the next tool call with a revoked key fails with “Invalid MCP key”.',
        'Keys never authenticate the web app or the REST API — they only work on the /mcp endpoint.',
        'Every tool call is rate-limited and writes exactly what the equivalent in-app action would write.',
        'You can keep several keys (one per machine) and revoke them independently.',
      ]} />

      <H2 id="mcp-troubleshoot">Troubleshooting</H2>
      <div style={{ marginTop: 16 }}>
        {TROUBLESHOOTING.map(([q, a]) => (
          <div key={q} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '12px 4px', borderTop: '1px solid var(--lp-hairline)' }}>
            <HelpCircle size={15} style={{ color: 'var(--lp-accent)', flexShrink: 0, marginTop: 2 }} />
            <div>
              <div style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--lp-ink)' }}>{q}</div>
              <div className="lp-body" style={{ fontSize: 14, color: 'var(--lp-ink-3)', margin: '2px 0 0' }}>{a}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── AI Coach docs ─────────────────────────────────────────── */
function CoachDocs() {
  return (
    <div>
      <H2 id="coach-what">What Coach does</H2>
      <P>Coach is MindForm’s built-in AI assistant. On every message it reads your current week’s tasks, this month’s habits, your goals and your discipline streak — then answers with that context in mind. Ask “what should I prioritise today?” or “plan my week around my exam” and you get answers grounded in your real data, not generic advice.</P>
      <P>When you want your plan changed, Coach emits <strong>apply-cards</strong>: structured proposals (create task, replan habit, set goal…) that render as review cards in the chat. Nothing touches your account until you tap Apply — edit the card first or discard it entirely.</P>

      <H2 id="coach-setup">Step 1 — Add an API key (BYOK)</H2>
      <NumberedSteps steps={[
        'Open Coach and click Settings (the gear in the top bar) — or Add API Key in the empty state.',
        'Pick a provider and paste your key. Keys are stored in your browser’s local storage and sent only to that provider when you chat.',
        'Choose a model. For OpenRouter, NVIDIA NIM or a custom provider, use the search bar to filter hundreds of models live.',
        'Save. The header shows a green status dot with the active provider and model.',
      ]} />

      <H2 id="coach-providers">Providers & models</H2>
      <P>Four first-party providers ship with curated model lists. Two aggregation providers ship as <strong>editable defaults</strong> — because they expose hundreds of models, their model pickers are searchable and fetch the live catalogue:</P>
      <div style={{ overflowX: 'auto', margin: '16px 0 8px', border: '1px solid var(--lp-hairline)', borderRadius: 14 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5, minWidth: 480 }}>
          <thead>
            <tr style={{ background: 'color-mix(in srgb, var(--lp-accent) 7%, transparent)' }}>
              <th style={{ textAlign: 'left', padding: '11px 14px', color: 'var(--lp-ink)', fontWeight: 600 }}>Provider</th>
              <th style={{ textAlign: 'left', padding: '11px 14px', color: 'var(--lp-ink)', fontWeight: 600 }}>Type</th>
              <th style={{ textAlign: 'left', padding: '11px 14px', color: 'var(--lp-ink)', fontWeight: 600 }}>Model picker</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['OpenAI', 'First-party', 'Curated list'],
              ['Google Gemini', 'First-party', 'Curated list'],
              ['Anthropic Claude', 'First-party', 'Curated list'],
              ['Mistral AI', 'First-party', 'Curated list'],
              ['OpenRouter', 'Aggregator — editable default', 'Searchable · live /models catalogue'],
              ['NVIDIA NIM (build.nvidia.com)', 'Aggregator — editable default', 'Searchable · live /models catalogue'],
              ['Custom provider', 'Yours', 'Searchable · fetched or manual entry'],
            ].map(([p, t, m], i) => (
              <tr key={p} style={{ borderTop: i ? '1px solid var(--lp-hairline)' : 'none' }}>
                <td style={{ padding: '10px 14px', color: 'var(--lp-ink)', fontWeight: 500, whiteSpace: 'nowrap' }}>{p}</td>
                <td style={{ padding: '10px 14px', color: 'var(--lp-ink-2)' }}>{t}</td>
                <td style={{ padding: '10px 14px', color: 'var(--lp-ink-2)' }}>{m}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <P>Where the host enabled a shared key, a provider shows “Shared key available” — you can chat without your own key, or paste yours to take priority.</P>

      <H2 id="coach-custom">Custom providers</H2>
      <P>Coach can talk to <strong>any OpenAI-compatible endpoint</strong>: vLLM, LM Studio, Ollama’s OpenAI bridge, Azure OpenAI gateways, Together, Groq — anything that implements <code>/chat/completions</code>.</P>
      <NumberedSteps steps={[
        'In Coach settings, scroll to Custom providers and click Add provider.',
        'Give it a name and a base URL (e.g. http://localhost:11434/v1 for a local Ollama, or https://api.together.xyz/v1).',
        'Paste the API key (or leave empty for servers that need none) and hit Fetch models — or type model IDs manually.',
        'Save, then pick it like any other provider.',
      ]} />
      <Callout icon={ShieldCheck} tone="ok">
        Custom base URLs are validated and SSRF-guarded server-side: HTTPS is required in production, private network ranges are blocked, and requests are path-pinned to <code>/chat/completions</code> and <code>/models</code> only.
      </Callout>

      <H2 id="coach-permissions">Permissions — what a key unlocks</H2>
      <P>Coach is deliberately staged. A configured key unlocks, in order:</P>
      <BulletList items={[
        'Read your tasks, habits, goals and streak to ground every answer.',
        'Propose create · update · delete edits as review cards (full CRUD proposals).',
        'Write to your account — only after you tap Apply on a card.',
      ]} />
      <P>Quick starts (“Plan my week”, “Replan habits”, “Edit goals”) pre-fill the prompt with the right intent. You can also connect the same capability to external agents via <button onClick={() => navigateTo('/docs/mcp')} className="lp-link" style={{ fontSize: 'inherit', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>the MCP server</button>.</P>

      <H2 id="coach-actions">The apply-card schema</H2>
      <P>Coach replies may embed a <code>mf-actions</code> JSON block. Each action is one review card:</P>
      <div className="docs-code"><CodeBlock
        label="MF-ACTIONS BLOCK"
        code={`\`\`\`mf-actions
[
  { "type": "create_task",  "title": "Gym push day (07:00)" },
  { "type": "create_habit", "name": "Read 20 pages", "emoji": "📚", "time": "21:30" },
  { "type": "create_goal",  "title": "Ship portfolio site", "deadline": "2026-12-31", "category": "career" },
  { "type": "update_habit", "name": "Read books", "newName": "Read 20 pages", "time": "21:30" },
  { "type": "complete_goal","title": "Read 12 books in 2026" },
  { "type": "delete_habit", "name": "Doomscroll before bed" }
]
\`\`\``}
        note="Types: create_task, create_habit, create_goal, update_habit, complete_goal, delete_habit, delete_task. Goals require a deadline; categories: career, health, personal, general. Max 10 actions per reply."
      /></div>

      <H2 id="coach-privacy">Privacy</H2>
      <BulletList items={[
        'API keys stay in your browser — the server forwards your request to the provider and stores nothing.',
        'Chat history lives in local storage and auto-deletes after 24 hours; clearing it takes one click.',
        'Your productivity data is read server-side to build the system prompt, never sent to analytics.',
        'MCP keys are hashed (SHA-256) before storage and can be revoked in one click.',
      ]} />
      <Callout icon={Bot} tone="ok">
        AI output can be wrong. Coach is built so that nothing changes until a human taps Apply — the same rule applies to every MCP tool call.
      </Callout>
    </div>
  )
}

/* ── Content primitives (sub-page design language) ─────────── */
function H2({ children, ...rest }) {
  return (
    <h2 id={rest.id} className="lp-h2" style={{ fontSize: 'clamp(24px, 3.4vw, 32px)', margin: '44px 0 12px', scrollMarginTop: 84 }}>{children}</h2>
  )
}
function P({ children }) {
  return <p className="lp-body" style={{ color: 'var(--lp-ink-2)', marginBottom: 12 }}>{children}</p>
}
function BulletList({ items }) {
  return (
    <ul style={{ margin: '10px 0 14px', padding: 0, listStyle: 'none' }}>
      {items.map(t => (
        <li key={t} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '5px 0' }}>
          <span style={{ color: 'var(--lp-accent)', fontWeight: 700, lineHeight: 1.6 }}>·</span>
          <span className="lp-body" style={{ color: 'var(--lp-ink-2)', margin: 0 }}>{t}</span>
        </li>
      ))}
    </ul>
  )
}
function NumberedSteps({ steps }) {
  return (
    <div style={{ display: 'grid', gap: 12, margin: '18px 0 8px' }}>
      {steps.map((s, i) => (
        <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', background: 'var(--lp-card-bg)', border: '1px solid var(--lp-hairline)', borderRadius: 16, padding: '15px 18px' }}>
          <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--lp-accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, flexShrink: 0 }}>{i + 1}</div>
          <div className="lp-body" style={{ color: 'var(--lp-ink-2)', margin: 0, flex: 1 }}>{s}</div>
        </div>
      ))}
    </div>
  )
}
function Callout({ icon: Icon, tone = 'ok', children }) {
  const color = tone === 'warn' ? 'var(--brand-warning, #f59e0b)' : 'var(--brand-success, #30d158)'
  return (
    <div style={{
      display: 'flex', gap: 12, alignItems: 'flex-start',
      background: `color-mix(in srgb, ${color} 8%, transparent)`,
      border: `1px solid color-mix(in srgb, ${color} 30%, transparent)`,
      borderRadius: 14, padding: '14px 16px', margin: '16px 0 18px',
    }}>
      <Icon size={16} color={color} style={{ flexShrink: 0, marginTop: 2 }} />
      <div className="lp-body" style={{ color: 'var(--lp-ink-2)', margin: 0, fontSize: 14.5 }}>{children}</div>
    </div>
  )
}

export default DocsPage
