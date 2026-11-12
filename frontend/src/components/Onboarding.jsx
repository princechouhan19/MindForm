import React, { useState } from 'react'
import { CheckSquare, Activity, Target, Flame, Sparkles, Users2, ArrowRight } from 'lucide-react'

const STEPS = [
  {
    key: 'welcome',
    title: 'Welcome to MindForm.',
    subtitle: 'One private dashboard for everything you’re building — a few minutes of setup and you’re in.',
    body: null,
  },
  {
    key: 'modules',
    title: 'Your toolkit.',
    subtitle: 'Five focused modules. Everything syncs automatically as you work.',
    body: [
      { icon: CheckSquare, color: 'var(--cyan)',     name: 'Tasks',   desc: 'Plan each day to the minute and score your week.' },
      { icon: Activity,    color: 'var(--amber)',    name: 'Habits',  desc: 'Build streaks on a 30-day grid. Consistency compounds.' },
      { icon: Target,      color: 'var(--brand-secondary)', name: 'Goals',  desc: 'Link goals to habits and tasks — progress computes itself.' },
      { icon: Flame,       color: 'var(--red)',      name: 'Fapless', desc: 'A discipline streak engine with levels and aura.' },
      { icon: Sparkles,    color: 'var(--purple)',   name: 'AI Coach', desc: 'Advice grounded in your real data (bring your own key).' },
    ],
  },
  {
    key: 'privacy',
    title: 'Private by default.',
    subtitle: 'Your profile is private, your data stays yours. AI chats auto-delete every 24 hours.',
    body: [
      { icon: Users2, color: 'var(--pink)', name: 'Go public anytime', desc: 'Enable it in Social → My Profile to join the leaderboard.' },
      { icon: Flame,  color: 'var(--green)', name: 'Start a streak today', desc: 'Fapless tracks days, levels and milestones automatically.' },
    ],
  },
]

export default function Onboarding({ onDone }) {
  const [step, setStep] = useState(0)
  const current = STEPS[step]
  const isLast = step === STEPS.length - 1

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to MindForm"
      style={{
        position: 'fixed', inset: 0, zIndex: 9500,
        background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      }}
    >
      <div className="mf-sheet" style={{ width: 'min(94vw, 460px)', padding: '42px 38px 32px' }}>
        {/* Progress dots */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 28 }}>
          {STEPS.map((s, i) => (
            <div key={s.key} style={{
              width: i === step ? 22 : 7, height: 7, borderRadius: 4,
              background: i <= step ? 'var(--brand-primary)' : 'var(--border-bright)',
              transition: 'all 0.35s var(--ease-out-expo)',
            }} />
          ))}
        </div>

        <h2 style={{
          fontSize: 27, fontWeight: 600, fontFamily: 'var(--font-display)',
          letterSpacing: '-0.025em', textAlign: 'center', marginBottom: 10,
        }}>
          {current.title}
        </h2>
        <p style={{
          fontSize: 15.5, color: 'var(--text-secondary)', lineHeight: 1.6,
          textAlign: 'center', marginBottom: 28, fontFamily: 'var(--font-body)',
        }}>
          {current.subtitle}
        </p>

        {/* Body */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 30 }}>
          {(current.body || []).map(({ icon: Icon, color, name, desc }) => (
            <div key={name} style={{
              display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px',
              background: 'var(--bg-glass)', borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border)',
            }}>
              <div style={{
                width: 38, height: 38, borderRadius: 11, flexShrink: 0,
                background: `color-mix(in srgb, ${color} 14%, transparent)`,
                border: `1px solid color-mix(in srgb, ${color} 28%, transparent)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon size={18} style={{ color }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{name}</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.45 }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: 12 }}>
          {step > 0 && (
            <button
              onClick={() => setStep(s => s - 1)}
              style={{
                flex: '0 0 96px', minHeight: 48, borderRadius: 'var(--radius-md)',
                background: 'var(--bg-glass)', border: '1px solid var(--border-bright)',
                color: 'var(--text-primary)', fontSize: 15, fontWeight: 600, fontFamily: 'var(--font-body)',
              }}
            >
              Back
            </button>
          )}
          <button
            className="lp-btn-primary"
            onClick={() => isLast ? onDone() : setStep(s => s + 1)}
            style={{ flex: 1, minHeight: 48, justifyContent: 'center', fontSize: 15.5 }}
          >
            {isLast ? 'Get started' : 'Continue'} <ArrowRight size={15} />
          </button>
        </div>

        {step === 0 && (
          <button
            onClick={onDone}
            style={{
              marginTop: 16, width: '100%', background: 'none', border: 'none',
              color: 'var(--text-muted)', fontSize: 13.5, fontFamily: 'var(--font-body)',
              cursor: 'pointer', padding: 6,
            }}
          >
            Skip introduction
          </button>
        )}
      </div>
    </div>
  )
}
