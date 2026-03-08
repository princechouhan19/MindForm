import React, { useEffect, useRef, useState } from 'react'
import { ArrowRight, CheckSquare, Activity, Target, Flame, Zap, Shield, BarChart2 } from 'lucide-react'

/* ── Particle field ────────────────────────────────────────────── */
function Particles({ count = 60 }) {
  const particles = useRef(
    Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2.5 + 0.5,
      duration: Math.random() * 12 + 8,
      delay: Math.random() * 8,
      opacity: Math.random() * 0.5 + 0.1,
    }))
  ).current

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {particles.map(p => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            borderRadius: '50%',
            background: p.id % 3 === 0 ? 'var(--cyan)' : p.id % 3 === 1 ? 'var(--amber)' : '#a78bfa',
            opacity: p.opacity,
            animation: `lp-float ${p.duration}s ${p.delay}s ease-in-out infinite`,
          }}
        />
      ))}
    </div>
  )
}

/* ── Typewriter ────────────────────────────────────────────────── */
function Typewriter({ words, speed = 80, pause = 1800 }) {
  const [displayed, setDisplayed] = useState('')
  const [wordIdx, setWordIdx] = useState(0)
  const [phase, setPhase] = useState('typing') // typing | pausing | deleting

  useEffect(() => {
    const word = words[wordIdx]
    let timeout

    if (phase === 'typing') {
      if (displayed.length < word.length) {
        timeout = setTimeout(() => setDisplayed(word.slice(0, displayed.length + 1)), speed)
      } else {
        timeout = setTimeout(() => setPhase('pausing'), pause)
      }
    } else if (phase === 'pausing') {
      setPhase('deleting')
    } else {
      if (displayed.length > 0) {
        timeout = setTimeout(() => setDisplayed(d => d.slice(0, -1)), speed / 2)
      } else {
        setWordIdx(i => (i + 1) % words.length)
        setPhase('typing')
      }
    }

    return () => clearTimeout(timeout)
  }, [displayed, phase, wordIdx, words, speed, pause])

  return (
    <span style={{ color: 'var(--cyan)', display: 'inline' }}>
      {displayed}
      <span style={{
        display: 'inline-block', width: 2, height: '0.8em',
        background: 'var(--cyan)', marginLeft: 3, verticalAlign: 'text-bottom',
        animation: 'lp-blink 0.9s step-end infinite',
      }} />
    </span>
  )
}

/* ── Feature card ──────────────────────────────────────────────── */
const FEATURES = [
  {
    icon: CheckSquare, color: 'var(--cyan)', title: 'Task Tracker',
    desc: 'Capture, organize, and crush your daily tasks with a powerful Kanban & list view.',
    image: '/TaskTracker.png', delay: '0ms',
  },
  {
    icon: Activity, color: 'var(--amber)', title: 'Habit Tracker',
    desc: 'Build unbreakable chains. Track streaks, completion rates, and daily momentum.',
    image: '/Habit-Tracker.png', delay: '80ms',
  },
  {
    icon: Target, color: 'var(--green)', title: 'Goals',
    desc: 'Set ambitious goals, link habits and tasks, and watch your progress compound.',
    image: '/Goals.png', delay: '160ms',
  },
  {
    icon: Flame, color: '#ff4500', title: 'Fapless Mode',
    desc: 'Take back control. Track your streak, level up your aura, and stay accountable.',
    image: '/fapless.png', delay: '240ms',
  },
]

function FeatureCard({ feature, idx }) {
  const [hovered, setHovered] = useState(false)
  const Icon = feature.icon

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? 'var(--bg-card-hover)' : 'var(--bg-card)',
        border: `1px solid ${hovered ? feature.color + '40' : 'var(--border)'}`,
        borderRadius: 20,
        overflow: 'hidden',
        cursor: 'default',
        transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
        transform: hovered ? 'translateY(-6px)' : 'translateY(0)',
        boxShadow: hovered ? `0 20px 60px ${feature.color}18` : '0 2px 12px rgba(0,0,0,0.3)',
        animation: `lp-slide-up 0.6s ${feature.delay} both`,
      }}
    >
      {/* Screenshot */}
      <div style={{
        width: '100%', height: 200, overflow: 'hidden',
        borderBottom: `1px solid ${hovered ? feature.color + '30' : 'var(--border)'}`,
        position: 'relative',
      }}>
        <img
          src={feature.image}
          alt={feature.title}
          style={{
            width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top',
            transition: 'transform 0.5s ease',
            transform: hovered ? 'scale(1.06)' : 'scale(1)',
          }}
        />
        {/* Color overlay on hover */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `linear-gradient(to bottom, transparent 40%, ${feature.color}10 100%)`,
          opacity: hovered ? 1 : 0,
          transition: 'opacity 0.3s ease',
        }} />
      </div>

      {/* Text */}
      <div style={{ padding: '20px 22px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: feature.color + '18',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Icon size={18} style={{ color: feature.color }} />
          </div>
          <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: '0.02em' }}>{feature.title}</span>
        </div>
        <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{feature.desc}</p>
      </div>
    </div>
  )
}

/* ── Stats row ─────────────────────────────────────────────────── */
const STATS = [
  { value: '4', label: 'Core Modules', icon: Zap, color: 'var(--cyan)' },
  { value: '∞', label: 'Daily Habits', icon: Activity, color: 'var(--amber)' },
  { value: '100%', label: 'Open Source', icon: Shield, color: 'var(--green)' },
  { value: '0', label: 'Distractions', icon: BarChart2, color: '#c084fc' },
]

/* ── Main landing page ─────────────────────────────────────────── */
export default function LandingPage({ onGetStarted }) {
  const [scrolled, setScrolled] = useState(false)
  const scrollRef = useRef(null)

  const handleScroll = (e) => setScrolled(e.target.scrollTop > 30)

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      style={{
        height: '100vh', width: '100vw',
        overflowY: 'auto', overflowX: 'hidden',
        background: 'var(--bg-base)',
        position: 'relative',
      }}
    >
      <style>{`
        @keyframes lp-float {
          0%, 100% { transform: translateY(0px) translateX(0px); opacity: inherit; }
          33% { transform: translateY(-24px) translateX(10px); }
          66% { transform: translateY(12px) translateX(-8px); }
        }
        @keyframes lp-blink { 0%,100% { opacity: 1; } 50% { opacity: 0; } }
        @keyframes lp-slide-up {
          from { opacity: 0; transform: translateY(40px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes lp-orb-pulse {
          0%,100% { transform: translateX(-50%) scale(1); opacity: 0.55; }
          50%      { transform: translateX(-50%) scale(1.15); opacity: 0.8; }
        }
        @keyframes lp-orb2-pulse {
          0%,100% { transform: translateX(-50%) scale(1); opacity: 0.3; }
          50%      { transform: translateX(-50%) scale(1.2); opacity: 0.5; }
        }
        @keyframes lp-hero-in {
          from { opacity: 0; transform: translateY(32px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes lp-badge-in {
          from { opacity: 0; transform: scale(0.85); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes lp-glow-cta {
          0%,100% { box-shadow: 0 0 20px rgba(0,229,255,0.35), 0 4px 24px rgba(0,100,255,0.2); }
          50%      { box-shadow: 0 0 40px rgba(0,229,255,0.6), 0 8px 40px rgba(0,100,255,0.35); }
        }
        @keyframes lp-scroll-hint {
          0%,100% { transform: translateY(0); opacity: 0.6; }
          50% { transform: translateY(6px); opacity: 1; }
        }
        .lp-cta-btn:hover { filter: brightness(1.12) !important; transform: translateY(-2px) !important; }
        .lp-cta-btn { transition: all 0.2s ease !important; }
        .lp-nav-cta:hover { background: rgba(0,229,255,0.12) !important; }
      `}</style>

      {/* ── Navbar ── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 clamp(16px, 3vw, 32px)', height: 64, gap: 12,
        background: scrolled ? 'rgba(10,11,15,0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        borderBottom: scrolled ? '1px solid var(--border)' : '1px solid transparent',
        transition: 'all 0.3s ease',
        minWidth: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, overflow: 'hidden' }}>
          <img src="/logo.png" alt="MindForm" style={{ width: 30, height: 30, borderRadius: 8, objectFit: 'contain', flexShrink: 0 }} />
          <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>MIND FORM</span>
        </div>
        <button
          className="lp-nav-cta"
          onClick={onGetStarted}
          style={{
            background: 'rgba(0,229,255,0.08)',
            border: '1px solid rgba(0,229,255,0.25)',
            borderRadius: 10, padding: '8px 16px',
            fontSize: 13, fontWeight: 700, color: 'var(--cyan)',
            letterSpacing: '0.04em', cursor: 'pointer',
            transition: 'background 0.2s', flexShrink: 0, whiteSpace: 'nowrap',
          }}
        >
          Sign In
        </button>
      </nav>

      {/* ── Hero ── */}
      <section style={{
        minHeight: 'calc(100vh - 64px)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', padding: '60px 24px 80px',
        position: 'relative',
      }}>
        <Particles count={55} />

        {/* Glowing orbs */}
        <div style={{
          position: 'absolute', top: '10%', left: '50%',
          width: 700, height: 700, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,229,255,0.08) 0%, transparent 65%)',
          animation: 'lp-orb-pulse 6s ease-in-out infinite',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', top: '25%', left: '50%',
          width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(167,139,250,0.07) 0%, transparent 65%)',
          animation: 'lp-orb2-pulse 8s 2s ease-in-out infinite',
          pointerEvents: 'none',
        }} />

        {/* Badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'rgba(0,229,255,0.07)', border: '1px solid rgba(0,229,255,0.2)',
          borderRadius: 999, padding: '6px 16px', marginBottom: 32,
          fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--cyan)',
          animation: 'lp-badge-in 0.5s 0.1s both',
        }}>
          <Zap size={12} fill="currentColor" />
          YOUR PERSONAL PRODUCTIVITY SUITE
        </div>

        {/* Headline */}
        <h1 style={{
          fontSize: 'clamp(30px, 5.5vw, 68px)',
          fontWeight: 900, lineHeight: 1.2,
          letterSpacing: '-0.02em', marginBottom: 12,
          animation: 'lp-hero-in 0.6s 0.2s both',
          maxWidth: 900,
        }}>
          Build the mind you
          <br />
          {/* nowrap prevents the typewriter line from ever reflowing to a new line */}
          <span style={{ display: 'block', whiteSpace: 'nowrap', overflow: 'visible' }}>
            want to{' '}
            <Typewriter words={['live with.', 'lead with.', 'grow with.', 'win with.']} />
          </span>
        </h1>

        {/* Sub-headline */}
        <p style={{
          fontSize: 'clamp(15px, 2vw, 20px)',
          color: 'var(--text-secondary)', maxWidth: 540,
          lineHeight: 1.7, marginBottom: 44,
          animation: 'lp-hero-in 0.6s 0.35s both',
        }}>
          Tasks, habits, goals, and self-discipline — all in one deeply focused dashboard.
          No fluff, no noise.
        </p>

        {/* CTA Buttons */}
        <div style={{
          display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center',
          animation: 'lp-hero-in 0.6s 0.5s both',
        }}>
          <button
            className="lp-cta-btn"
            onClick={onGetStarted}
            style={{
              background: 'linear-gradient(135deg, var(--cyan) 0%, #0077ff 100%)',
              border: 'none', borderRadius: 14,
              padding: '16px 36px', fontSize: 16, fontWeight: 800,
              color: '#000', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 10,
              letterSpacing: '0.02em',
              animation: 'lp-glow-cta 3s ease-in-out infinite',
              fontFamily: 'var(--font-display)',
            }}
          >
            Get Started Free <ArrowRight size={18} />
          </button>
          <button
            onClick={() => document.getElementById('lp-features').scrollIntoView({ behavior: 'smooth' })}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--border-bright)',
              borderRadius: 14, padding: '16px 32px',
              fontSize: 15, fontWeight: 700,
              color: 'var(--text-primary)', cursor: 'pointer',
              fontFamily: 'var(--font-display)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.09)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
          >
            See Features
          </button>
        </div>

        {/* Scroll hint */}
        <div style={{
          position: 'absolute', bottom: 28,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
          color: 'var(--text-muted)', fontSize: 11, letterSpacing: '0.1em',
          animation: 'lp-scroll-hint 2s ease-in-out infinite',
        }}>
          <div style={{
            width: 1, height: 36,
            background: 'linear-gradient(to bottom, transparent, var(--text-muted))',
          }} />
          SCROLL
        </div>
      </section>

      {/* ── Stats strip ── */}
      <section style={{
        borderTop: '1px solid var(--border)',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-surface)',
        padding: '32px 24px',
      }}>
        <div style={{
          maxWidth: 960, margin: '0 auto',
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 24, textAlign: 'center',
        }}>
          {STATS.map(({ value, label, icon: Icon, color }) => (
            <div key={label}>
              <Icon size={22} style={{ color, marginBottom: 8 }} />
              <div style={{ fontSize: 32, fontWeight: 900, color, letterSpacing: '-0.02em' }}>{value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', letterSpacing: '0.08em', marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section id="lp-features" style={{ padding: '80px 24px', maxWidth: 1100, margin: '0 auto' }}>
        {/* Section header */}
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <div style={{
            display: 'inline-block',
            fontSize: 11, fontWeight: 700, letterSpacing: '0.15em',
            color: 'var(--cyan)', marginBottom: 12,
            background: 'rgba(0,229,255,0.07)', border: '1px solid rgba(0,229,255,0.15)',
            borderRadius: 999, padding: '5px 14px',
          }}>
            WHAT'S INSIDE
          </div>
          <h2 style={{
            fontSize: 'clamp(26px, 4vw, 44px)', fontWeight: 900,
            letterSpacing: '-0.02em', lineHeight: 1.1,
          }}>
            Everything you need.<br />
            <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>Nothing you don't.</span>
          </h2>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 24,
        }}>
          {FEATURES.map((f, i) => <FeatureCard key={f.title} feature={f} idx={i} />)}
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section style={{
        padding: '72px 24px',
        textAlign: 'center',
        background: 'linear-gradient(180deg, transparent, rgba(0,229,255,0.04), transparent)',
        borderTop: '1px solid var(--border)',
        borderBottom: '1px solid var(--border)',
      }}>
        <h2 style={{
          fontSize: 'clamp(24px, 4vw, 48px)', fontWeight: 900,
          letterSpacing: '-0.02em', marginBottom: 16,
        }}>
          Ready to form your mind?
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 36, fontSize: 16 }}>
          Join and start building better habits, one day at a time.
        </p>
        <button
          className="lp-cta-btn"
          onClick={onGetStarted}
          style={{
            background: 'linear-gradient(135deg, var(--cyan) 0%, #0077ff 100%)',
            border: 'none', borderRadius: 14,
            padding: '18px 48px', fontSize: 18, fontWeight: 800,
            color: '#000', cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: 12,
            fontFamily: 'var(--font-display)',
            animation: 'lp-glow-cta 3s 1s ease-in-out infinite',
          }}
        >
          Start Now — It's Free <ArrowRight size={20} />
        </button>
      </section>

      {/* ── Footer ── */}
      <footer style={{
        padding: '28px 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
        borderTop: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="/logo.png" alt="MindForm" style={{ width: 24, height: 24, borderRadius: 6, objectFit: 'contain' }} />
          <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.06em' }}>MIND FORM</span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <button onClick={onGetStarted} style={{
            background: 'none', color: 'var(--cyan)', fontWeight: 600,
            fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-display)',
          }}>
            Sign in →
          </button>
        </div>
      </footer>
    </div>
  )
}
