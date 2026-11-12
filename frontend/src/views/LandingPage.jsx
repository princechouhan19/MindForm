import React, { useEffect, useRef, useState, useCallback } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import {
  ArrowRight, CheckSquare, Activity, Target, Flame,
  ChevronRight, Sun, Moon, Menu, X, Lock, Bell, BarChart3, Users2, Shield, Mic,
} from 'lucide-react'

gsap.registerPlugin(ScrollTrigger)

/* ═══════════════════════════════════════════════════════════════
   Landing — built strictly on frontend/DESIGN.md (apple.com spec)
   • Full-bleed tiles alternate canvas / parchment / near-black
   • One accent: Action Blue #0066cc (Sky Link #2997ff on dark)
   • Weight-600 tight headlines, 17px body, pill CTAs
   • Hairline cards, zero gradients, single product shadow
═══════════════════════════════════════════════════════════════ */

/* ── Data ──────────────────────────────────────────────────── */
const SCENES = [
  {
    id: 'tasks',
    tag: 'Task Tracker',
    icon: CheckSquare,
    surface: 'dark1',
    title: 'Plan your day\nto the minute.',
    desc: 'Schedule tasks with exact times, tick them off day by day, and let the Week Score show how strong your week really is. Every plan stays synced across your devices.',
    image: '/shots/12-tasks.png',
  },
  {
    id: 'habits',
    tag: 'Habit Tracker',
    icon: Activity,
    surface: 'parchment',
    title: 'Build chains\nthat don’t break.',
    desc: 'A 30-day matrix keeps every streak visible at a glance. Track mood and motivation alongside, and watch consistency compound into identity.',
    image: '/shots/14-habits.png',
  },
  {
    id: 'goals',
    tag: 'Goals',
    icon: Target,
    surface: 'dark2',
    title: 'Progress\nyou can see.',
    desc: 'Connect goals to the tasks and habits that drive them. MindForm computes progress automatically, so the finish line is never a mystery.',
    image: '/shots/15-goals.png',
  },
  {
    id: 'speak',
    tag: 'Speak — new',
    icon: Mic,
    surface: 'parchment',
    title: 'Find the voice\nyou want to speak with.',
    desc: 'Guided 15, 30 and 60-minute sessions: diaphragm breathing, SOVT hums, twister ladders and on-camera impromptu — every drill grounded in voice research.',
    image: '/shots/21-voice.png',
  },
  {
    id: 'fapless',
    tag: 'Fapless',
    icon: Flame,
    surface: 'dark3',
    title: 'Reclaim\nyour focus.',
    desc: 'A streak engine with ten identity levels, milestone bonuses and challenges. Discipline stops being willpower and becomes a game you’re winning.',
    image: '/shots/17-fapless.png',
  },
]

const RIBBON = [
  { icon: Bell,     title: 'Smart reminders',   desc: 'Chimes and notifications when a task is due — never miss a block.' },
  { icon: BarChart3, title: 'Real insights',    desc: 'Week scores, completion rates and trends computed for you.' },
  { icon: Users2,   title: 'Accountability',    desc: 'Optional public streaks, a global leaderboard and a 2-day forum.' },
  { icon: Lock,     title: 'Private by design', desc: 'Your data is scoped to your account. Chats auto-delete in 24h.' },
]

const STATS = [
  { value: 7,   suffix: '',     label: 'Core modules' },
  { value: 30,  suffix: ' days', label: 'Visible habit grid' },
  { value: 10,  suffix: '',     label: 'Identity levels' },
  { value: 100, suffix: '%',    label: 'Free & open source' },
]

/* The real 15-minute plan from Speak (VoiceCoachView PLANS[15]) —
   kept in sync with the HowTo JSON-LD in index.html. */
const HOW_STEPS = [
  { n: '1', name: 'Breathe',     drill: 'Diaphragm Breathing (4–2–6)',  min: 2, desc: 'Paced inhale–hold–exhale breathing that lowers your breath and steadies your voice.' },
  { n: '2', name: 'Warm up',     drill: 'SOVT Hum & Lip Trills',         min: 3, desc: 'Semi-occluded hums and trills that warm the vocal folds without strain.' },
  { n: '3', name: 'Release',     drill: 'Neck Release + Long Vowels',    min: 2, desc: 'Behind-the-neck stretches while sustaining vowels to free built-up tension.' },
  { n: '4', name: 'Articulate',  drill: 'Tongue Twister Ladder',         min: 4, desc: 'English twisters climbed at bronze, silver and gold speeds for crisp speech.' },
  { n: '5', name: 'Read',        drill: 'Style-Shifting Read-aloud',     min: 3, desc: 'One passage, six styles — building flexible, expressive delivery.' },
  { n: '6', name: 'Perform',     drill: 'Camera Studio (PREP)',          min: 1, desc: 'Impromptu speaking on a random topic — recorded locally, never uploaded.' },
]

/* Mirrors the FAQPage JSON-LD in index.html — keep the two in sync. */
const FAQS = [
  { q: 'What is MindForm?',
    a: 'MindForm is a free, private productivity dashboard that combines minute-level task planning, a 30-day habit matrix, goal tracking with linked progress, and a discipline streak engine — in one Apple-inspired interface.' },
  { q: 'Is MindForm free?',
    a: 'Yes. MindForm is 100% free and open source. You can inspect the code, contribute, or self-host it on your own infrastructure.' },
  { q: 'Does MindForm store my data?',
    a: 'Your tasks, habits and goals are stored privately in your account. AI chat history is automatically deleted every 24 hours and community forum messages every 48 hours. AI keys you provide are stored only in your browser.' },
  { q: 'How does the streak and aura system work?',
    a: 'Every day you keep your discipline streak you earn aura points, level up through identities from Novice to Legend, and can take on challenges like the 30-day or 90-day protocol.' },
  { q: 'What is the Speak module?',
    a: 'Speak is MindForm’s voice and communication training module. It offers guided 15, 30 and 60-minute sessions covering diaphragm breathing (4–2–6), SOVT hums and lip trills, neck release with vowels, English tongue twister ladders, style-shifting read-alouds and on-camera impromptu speaking with the PREP framework — every drill grounded in published voice research.' },
  { q: 'Does the Speak camera recording upload my video?',
    a: 'No. Camera Studio uses your browser’s MediaRecorder and the video never leaves your device: recordings live only in memory as temporary blob URLs and disappear when you close the session. Nothing is uploaded to any server.' },
]

/* Footer links that scroll to on-page sections (was: dead links). */
const FOOTER_TARGETS = {
  'How it works': 'lp-how',
  'Privacy model': 'lp-privacy',
  'Self-hosting': 'lp-faq',
  'FAQ': 'lp-faq',
}

const FOOTER_COLS = [
  {
    title: 'Product',
    links: ['Task Tracker', 'Habit Tracker', 'Goals', 'Fapless', 'Speak', 'Social', 'AI Coach'],
  },
  {
    title: 'Resources',
    links: ['How it works', 'Privacy model', 'Self-hosting', 'FAQ'],
  },
  {
    title: 'Community',
    links: ['Leaderboard', 'Forum', 'Contribute'],
  },
]

/* ── Reveal helper ─────────────────────────────────────────── */
function useReveal(options = {}) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ctx = gsap.context(() => {
      gsap.fromTo(el,
        { opacity: 0, y: 44 },
        {
          opacity: 1, y: 0,
          duration: options.duration || 0.9,
          ease: 'power3.out',
          scrollTrigger: { trigger: el, start: options.start || 'top 88%' },
        })
    })
    return () => ctx.revert()
  }, [])
  return ref
}

/* ── Progress bar ──────────────────────────────────────────── */
function ProgressBar() {
  const fill = useRef(null)
  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      if (fill.current) fill.current.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return (
    <div className="lp-progress-bar">
      <div ref={fill} className="lp-progress-fill" style={{ transform: 'scaleX(0)' }} />
    </div>
  )
}

/* ── Product render — the one shadow in the system ─────────── */
function ProductShot({ image, alt, dark, eager }) {
  return (
    <div style={{ position: 'relative', maxWidth: 980, margin: '0 auto', width: '100%' }}>
      <img
        src={image}
        alt={alt}
        className="lp-shot"
        loading={eager ? 'eager' : 'lazy'}
        decoding={eager ? 'sync' : 'async'}
        fetchpriority={eager ? 'high' : 'low'}
        onError={(e) => { e.currentTarget.style.display = 'none' }}
        style={{
          aspectRatio: '16 / 10', objectFit: 'cover', objectPosition: 'top',
          border: dark ? '1px solid rgba(255,255,255,0.14)' : '1px solid rgba(0,0,0,0.08)',
        }}
      />
    </div>
  )
}

/* ── Tile surface → CSS value ──────────────────────────────── */
function surfaceStyle(surface) {
  switch (surface) {
    case 'parchment': return { background: 'var(--lp-parchment)', color: 'var(--lp-ink)' }
    case 'dark1':     return { background: 'var(--lp-tile-dark-1)', color: 'var(--lp-on-dark)' }
    case 'dark2':     return { background: 'var(--lp-tile-dark-2)', color: 'var(--lp-on-dark)' }
    case 'dark3':     return { background: 'var(--lp-tile-dark-3)', color: 'var(--lp-on-dark)' }
    default:          return { background: 'var(--lp-canvas)', color: 'var(--lp-ink)' }
  }
}
const isDarkSurface = (s) => s === 'dark1' || s === 'dark2' || s === 'dark3'

/* ── Product tile (scroll storytelling section) ────────────── */
function Scene({ scene, index, onCTA }) {
  const wrapRef = useRef(null)
  const textRef = useRef(null)
  const imgRef  = useRef(null)
  const dark = isDarkSurface(scene.surface)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(textRef.current,
        { opacity: 0, y: 56 },
        { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out',
          scrollTrigger: { trigger: wrapRef.current, start: 'top 76%' } })
      gsap.fromTo(imgRef.current,
        { opacity: 0, y: 72, scale: 0.97 },
        { opacity: 1, y: 0, scale: 1, duration: 1.1, ease: 'power3.out',
          scrollTrigger: { trigger: wrapRef.current, start: 'top 74%' } })
    })
    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={wrapRef}
      style={{
        ...surfaceStyle(scene.surface),
        padding: 'clamp(72px, 10vw, 120px) clamp(20px, 5vw, 80px)',
        textAlign: 'center',
      }}
    >
      <div ref={textRef} style={{ opacity: 0, maxWidth: 720, margin: '0 auto' }}>
        <div
          className="lp-tagline"
          style={{ marginBottom: 14, color: dark ? 'var(--lp-accent-ondark)' : 'var(--lp-accent)' }}
        >
          {scene.tag}
        </div>
        <h2 className="lp-h2" style={{ whiteSpace: 'pre-line', marginBottom: 18 }}>
          {scene.title}
        </h2>
        <p
          className="lp-body"
          style={{ maxWidth: 620, margin: '0 auto 22px', color: dark ? 'var(--lp-on-dark-2)' : 'var(--lp-ink-3)' }}
        >
          {scene.desc}
        </p>
        <button
          className={`lp-link${dark ? ' lp-link-ondark' : ''}`}
          onClick={onCTA}
        >
          Learn more <ChevronRight size={16} />
        </button>
      </div>

      <div ref={imgRef} style={{ opacity: 0, marginTop: 'clamp(40px, 6vw, 64px)' }}>
        <ProductShot image={scene.image} alt={scene.tag} dark={dark} />
      </div>
    </section>
  )
}

/* ── Stat counter ──────────────────────────────────────────── */
function Stat({ stat }) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ctx = gsap.context(() => {
      const obj = { v: 0 }
      gsap.to(obj, {
        v: stat.value, duration: 1.4, ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 88%' },
        onUpdate: () => { el.textContent = Math.round(obj.v).toString() },
      })
    })
    return () => ctx.revert()
  }, [stat.value])
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{
        fontFamily: 'var(--font-display)', fontWeight: 600,
        fontSize: 'clamp(40px, 4.6vw, 64px)', lineHeight: 1.07,
        letterSpacing: '-0.015em', color: 'var(--lp-ink)',
      }}>
        <span ref={ref}>0</span>
        <span style={{ fontSize: '0.55em', fontWeight: 600, color: 'var(--lp-ink-3)' }}>{stat.suffix}</span>
      </div>
      <div className="lp-caption" style={{ color: 'var(--lp-ink-3)', marginTop: 10 }}>{stat.label}</div>
    </div>
  )
}

/* ── Ribbon utility card (store-utility-card grammar) ──────── */
function RibbonCard({ icon: Icon, title, desc }) {
  const ref = useReveal()
  return (
    <div ref={ref} className="lp-card" style={{ padding: 24, textAlign: 'left', opacity: 0 }}>
      <Icon size={24} strokeWidth={1.8} style={{ color: 'var(--lp-ink)', marginBottom: 16 }} />
      <div className="lp-caption-strong" style={{ fontSize: 17, color: 'var(--lp-ink)', marginBottom: 6 }}>{title}</div>
      <p className="lp-body" style={{ fontSize: 15 }}>{desc}</p>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   Main Landing Page
═══════════════════════════════════════════════════════════════ */
export default function LandingPage({ onGetStarted, theme, setTheme, onSubPage }) {
  const [mobileMenu, setMobileMenu] = useState(false)
  const scrollRef = useRef(null)
  const heroImgRef = useRef(null)
  const heroTextRef = useRef(null)
  const lenisRef = useRef(null)

  /* ── Native window scroll + Lenis (window mode) ─── */
  useEffect(() => {
    // the app shell hides body overflow — landing needs native viewport scrolling.
    // html overflow must stay 'visible' so body overflow propagates to the viewport.
    document.body.style.overflow = 'auto'
    const lenis = new Lenis({ lerp: 0.095, smoothWheel: true })
    lenisRef.current = lenis
    window.__lenis = lenis // exposed for e2e tooling / debugging
    let raf = 0
    const loop = (time) => { lenis.raf(time); raf = requestAnimationFrame(loop) }
    raf = requestAnimationFrame(loop)
    // recalc triggers once fonts/images settle
    const t1 = setTimeout(() => ScrollTrigger.refresh(), 300)
    const t2 = setTimeout(() => ScrollTrigger.refresh(), 1200)
    return () => {
      cancelAnimationFrame(raf)
      lenis.destroy()
      clearTimeout(t1); clearTimeout(t2)
      document.body.style.overflow = 'hidden'
      ScrollTrigger.getAll().forEach(st => st.kill())
    }
  }, [])

  /* ── Hero entrance: masked line reveal (Apple keynote) ─── */
  useEffect(() => {
    if (!heroTextRef.current) return
    const lines = heroTextRef.current.querySelectorAll('.lp-line-mask > span')
    const pill = heroTextRef.current.querySelector('.lp-pill')
    const tl = gsap.timeline({ delay: 0.15 })
    tl.fromTo(pill, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' })
    tl.fromTo(lines,
      { yPercent: 110, opacity: 0 },
      { yPercent: 0, opacity: 1, duration: 1.05, ease: 'power4.out', stagger: 0.12 }, '-=0.35')
    tl.fromTo(heroImgRef.current,
      { opacity: 0, y: 90, scale: 0.97 },
      { opacity: 1, y: 0, scale: 1, duration: 1.2, ease: 'power3.out' }, '-=0.55')
    return () => tl.kill()
  }, [])

  /* ── Hero product parallax out ─── */
  useEffect(() => {
    if (!heroImgRef.current) return
    const ctx = gsap.context(() => {
      // fromTo (not `to`) so scrubbing back to the top restores opacity 1
      // instead of the mount-time inline opacity 0; immediateRender:false
      // keeps the hero entrance timeline in charge of the initial reveal.
      gsap.fromTo(heroImgRef.current,
        { y: 0, scale: 1, opacity: 1 },
        {
          y: -70, scale: 0.97, opacity: 0.35, ease: 'none', immediateRender: false,
          scrollTrigger: { trigger: heroImgRef.current, start: 'top 40%', end: 'bottom 20%', scrub: 0.6 },
        })
    })
    return () => ctx.revert()
  }, [])

  const goTo = useCallback((id) => {
    const node = document.getElementById(id)
    if (node && lenisRef.current) lenisRef.current.scrollTo(node, { offset: -52, duration: 1.2 })
    else if (node) node.scrollIntoView({ behavior: 'smooth' })
    setMobileMenu(false)
  }, [])

  const NAV_LINKS = [
    { label: 'Overview', id: 'lp-overview' },
    { label: 'Features', id: 'lp-scenes' },
    { label: 'Privacy', id: 'lp-privacy' },
  ]

  /* global-nav link style — 12px, quiet white */
  const navLinkStyle = {
    background: 'none',
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: 400,
    letterSpacing: '-0.01em',
    fontFamily: 'var(--font-body)',
    padding: '6px 10px',
    borderRadius: 980,
    transition: 'color 0.2s',
  }

  return (
    <div
      ref={scrollRef}
      className="lp-root"
      style={{ width: '100%', minHeight: '100vh', background: 'var(--lp-canvas)', position: 'relative' }}
    >
      <ProgressBar />

      {/* ── Global nav — always-black frosted bar (DESIGN.md) ─ */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 clamp(18px, 3vw, 32px)', height: 48, gap: 12,
        background: 'var(--lp-nav-bg)',
        backdropFilter: 'saturate(180%) blur(20px)',
        WebkitBackdropFilter: 'saturate(180%) blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}>
        <button onClick={() => goTo('lp-top')} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none' }}>
          <img src="/logo.png" alt="MindForm" style={{ width: 20, height: 20, borderRadius: 5, objectFit: 'contain' }} />
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14, letterSpacing: '-0.01em', color: '#ffffff' }}>
            MindForm
          </span>
        </button>

        <div className="hide-xs lp-nav-links" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {NAV_LINKS.map(({ label, id }) => (
            <button key={id} onClick={() => goTo(id)} style={navLinkStyle}
              onMouseEnter={e => e.currentTarget.style.color = '#ffffff'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.8)'}
            >{label}</button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button
            aria-label="Toggle theme"
            onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', padding: 4, transition: 'color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.color = '#ffffff'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.8)'}
          >
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>
          <button
            onClick={onGetStarted}
            className="hide-xs lp-nav-signin"
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: 400, fontFamily: 'var(--font-body)', transition: 'color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.color = '#ffffff'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.8)'}
          >Sign in</button>
          <button
            className="lp-btn-primary"
            onClick={onGetStarted}
            style={{ padding: '5px 14px', fontSize: 12, letterSpacing: '-0.01em' }}
          >Get started</button>
          <button
            className="lp-mobile-only"
            aria-label="Menu"
            onClick={() => setMobileMenu(v => !v)}
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.8)', display: 'flex', padding: 4 }}
          >
            {mobileMenu ? <X size={17} /> : <Menu size={17} />}
          </button>
        </div>

        {mobileMenu && (
          <div style={{
            position: 'absolute', top: 48, left: 0, right: 0,
            background: 'rgba(22,22,23,0.92)',
            backdropFilter: 'saturate(180%) blur(20px)',
            WebkitBackdropFilter: 'saturate(180%) blur(20px)',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            display: 'flex', flexDirection: 'column', padding: '12px 20px 20px', gap: 2,
          }}>
            {NAV_LINKS.map(({ label, id }) => (
              <button key={id} onClick={() => goTo(id)}
                style={{ background: 'none', textAlign: 'left', padding: '12px 8px', fontSize: 17, fontWeight: 400, color: '#f5f5f7', borderRadius: 8, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {label}
              </button>
            ))}
            <button onClick={() => { setMobileMenu(false); onGetStarted() }}
              style={{ background: 'none', textAlign: 'left', padding: '14px 8px', fontSize: 17, color: 'var(--lp-accent-ondark)' }}>
              Sign in
            </button>
          </div>
        )}
      </nav>

      {/* ── Hero tile — canvas ─────────────────────────────── */}
      <section id="lp-top" style={{
        minHeight: 'calc(100vh - 48px)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        textAlign: 'center',
        padding: 'clamp(64px, 9vh, 110px) clamp(20px, 5vw, 80px) clamp(56px, 8vw, 96px)',
        background: 'var(--lp-canvas)',
        position: 'relative',
      }}>
        <div ref={heroTextRef} style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div className="lp-pill" style={{ marginBottom: 24, opacity: 0 }} id="lp-hero-pill">
            Meet your new discipline engine
          </div>

          <h1 className="lp-display" style={{ maxWidth: 980, marginBottom: 20 }}>
            <span className="lp-line-mask" style={{ display: 'block', overflow: 'hidden' }}><span style={{ display: 'block' }}>MindForm.</span></span>
            <span className="lp-line-mask" style={{ display: 'block', overflow: 'hidden' }}><span style={{ display: 'block', color: 'var(--lp-ink-3)' }}>Built for the mind</span></span>
            <span className="lp-line-mask" style={{ display: 'block', overflow: 'hidden' }}><span style={{ display: 'block', color: 'var(--lp-ink-3)' }}>you want to live with.</span></span>
          </h1>

          <p className="lp-lead" style={{ maxWidth: 620, color: 'var(--lp-ink-3)', marginBottom: 32 }}>
            Tasks, habits, goals and discipline — one private, focused dashboard
            that makes consistency feel effortless.
          </p>

          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' }}>
            <button className="lp-btn-primary" onClick={onGetStarted}>
              Get started free
            </button>
            <button className="lp-link" onClick={() => goTo('lp-scenes')}>
              Learn more <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Product render */}
        <div ref={heroImgRef} style={{ width: '100%', marginTop: 'clamp(48px, 8vh, 84px)', opacity: 0, position: 'relative', zIndex: 1 }}>
          <ProductShot image="/shots/10-overview.png" alt="MindForm overview" dark={theme === 'dark'} eager />
        </div>
      </section>

      {/* ── Quiet ticker ───────────────────────────────────── */}
      <div style={{
        overflow: 'hidden',
        borderTop: '1px solid var(--lp-hairline)', borderBottom: '1px solid var(--lp-hairline)',
        padding: '13px 0', background: 'var(--lp-canvas)',
      }}>
        <div className="lp-marquee-inner" style={{ whiteSpace: 'nowrap' }}>
          {Array(2).fill(['Minute-level planning', '30-day habit matrix', 'Week score insights', 'Goal-linked progress', 'Identity levels', 'Auto-deleting chats', 'CSV export', 'Dark & light']).flat().map((item, i) => (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 24, padding: '0 28px', fontSize: 12, fontWeight: 400, letterSpacing: '0.02em', color: 'var(--lp-ink-3)', fontFamily: 'var(--font-body)' }}>
              <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--lp-accent)', display: 'inline-block', flexShrink: 0 }} />
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* ── Stats — canvas ─────────────────────────────────── */}
      <section id="lp-overview" style={{ padding: 'clamp(64px, 9vw, 96px) clamp(20px, 5vw, 80px)', maxWidth: 980, margin: '0 auto', background: 'var(--lp-canvas)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 32 }}>
          {STATS.map((s) => <Stat key={s.label} stat={s} />)}
        </div>
      </section>

      {/* ── Ribbon — parchment section, white utility cards ── */}
      <section style={{ padding: 'clamp(64px, 9vw, 96px) clamp(20px, 5vw, 80px)', background: 'var(--lp-parchment)' }}>
        <div style={{ maxWidth: 980, margin: '0 auto' }}>
          <h2 className="lp-h2" style={{ textAlign: 'center', marginBottom: 12 }}>
            Get to know MindForm.
          </h2>
          <p className="lp-lead" style={{ textAlign: 'center', color: 'var(--lp-ink-3)', marginBottom: 48, fontSize: 'clamp(17px, 1.8vw, 21px)' }}>
            Every system, quietly in sync.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(440px, 100%), 1fr))', gap: 20 }}>
            {RIBBON.map(({ icon: Icon, title, desc }) => (
              <RibbonCard key={title} icon={Icon} title={title} desc={desc} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Scenes — full-bleed product tiles ──────────────── */}
      <div id="lp-scenes">
        {SCENES.map((s, i) => <Scene key={s.id} scene={s} index={i} onCTA={onGetStarted} />)}
      </div>

      {/* ── How it works — the 15-minute Speak session (AEO) ─ */}
      <section id="lp-how" style={{ padding: 'clamp(72px, 10vw, 120px) clamp(20px, 5vw, 80px)', background: 'var(--lp-parchment)' }}>
        <div style={{ maxWidth: 980, margin: '0 auto' }}>
          <h2 className="lp-h2" style={{ textAlign: 'center', marginBottom: 12 }}>
            The 15-minute Speak session.
          </h2>
          <p className="lp-lead" style={{ textAlign: 'center', color: 'var(--lp-ink-3)', marginBottom: 8, fontSize: 'clamp(17px, 1.8vw, 21px)' }}>
            Six guided steps. One stronger voice — every day.
          </p>
          <p className="lp-fine" style={{ textAlign: 'center', color: 'var(--lp-ink-3)', marginBottom: 48 }}>
            Grounded in published voice research: SOVT semi-occluded phonation, 4–2–6 diaphragmatic pacing and articulation drill protocols.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            {HOW_STEPS.map((s) => (
              <div key={s.n} style={{
                background: 'var(--lp-card-bg)', borderRadius: 18,
                border: '1px solid var(--lp-hairline)', padding: '24px 24px 20px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span className="lp-caption-strong" style={{ fontSize: 12, color: 'var(--lp-accent)' }}>Step {s.n}</span>
                  <span className="lp-caption" style={{ fontSize: 12, color: 'var(--lp-ink-3)', border: '1px solid var(--lp-hairline)', borderRadius: 980, padding: '2px 10px' }}>{s.min} min</span>
                </div>
                <h3 style={{ margin: '0 0 2px', fontSize: 19, fontWeight: 600, letterSpacing: '-0.01em', color: 'var(--lp-ink)' }}>{s.name}</h3>
                <div className="lp-caption-strong" style={{ fontSize: 13, color: 'var(--lp-ink-2)', marginBottom: 8 }}>{s.drill}</div>
                <p className="lp-body" style={{ fontSize: 15, color: 'var(--lp-ink-3)', margin: 0 }}>{s.desc}</p>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 36 }}>
            <button className="lp-btn-primary" onClick={onGetStarted}>
              Open Speak <ArrowRight size={16} />
            </button>
            <div className="lp-fine" style={{ color: 'var(--lp-ink-3)', marginTop: 14 }}>
              Also available as 30-minute and 1-hour routines.
            </div>
          </div>
        </div>
      </section>

      {/* ── Privacy tile — canvas ──────────────────────────── */}
      <section id="lp-privacy" style={{ padding: 'clamp(72px, 10vw, 120px) clamp(20px, 5vw, 80px)', maxWidth: 720, margin: '0 auto', textAlign: 'center', background: 'var(--lp-canvas)' }}>
        <Shield size={28} strokeWidth={1.6} style={{ color: 'var(--lp-ink)', marginBottom: 20 }} />
        <h2 className="lp-h2" style={{ marginBottom: 16 }}>Privacy. Built in<br />from the start.</h2>
        <p className="lp-body" style={{ maxWidth: 560, margin: '0 auto 10px' }}>
          Your data stays scoped to your account. AI chats delete themselves every 24 hours,
          forum posts every 48. Profiles are private until you choose to share your streak.
        </p>
        <button className="lp-link" onClick={onGetStarted}>
          See how your data stays private <ChevronRight size={16} />
        </button>
      </section>

      {/* ── FAQ — canvas, native details accordions (AEO) ──── */}
      <section id="lp-faq" style={{ padding: 'clamp(72px, 10vw, 120px) clamp(20px, 5vw, 80px)', maxWidth: 720, margin: '0 auto', background: 'var(--lp-canvas)' }}>
        <h2 className="lp-h2" style={{ textAlign: 'center', marginBottom: 12 }}>Questions, answered.</h2>
        <p className="lp-lead" style={{ textAlign: 'center', color: 'var(--lp-ink-3)', marginBottom: 44, fontSize: 'clamp(17px, 1.8vw, 21px)' }}>
          Everything people ask before their first day.
        </p>
        <div style={{ borderTop: '1px solid var(--lp-hairline)' }}>
          {FAQS.map((f) => (
            <details key={f.q} style={{ borderBottom: '1px solid var(--lp-hairline)' }}>
              <summary style={{
                listStyle: 'none', cursor: 'pointer', display: 'flex',
                alignItems: 'center', justifyContent: 'space-between', gap: 16,
                padding: '18px 4px', fontSize: 17, fontWeight: 500, color: 'var(--lp-ink)',
              }}>
                {f.q}
                <ChevronRight size={16} style={{ flexShrink: 0, color: 'var(--lp-ink-3)', transform: 'rotate(90deg)', transition: 'transform 0.25s' }} className="lp-faq-chevron" />
              </summary>
              <p className="lp-body" style={{ color: 'var(--lp-ink-3)', padding: '0 4px 20px', margin: 0 }}>{f.a}</p>
            </details>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <button className="lp-link" onClick={() => onSubPage && onSubPage('/faq')}>
            View the full FAQ <ChevronRight size={16} />
          </button>
        </div>
        <style>{`
          details[open] .lp-faq-chevron { transform: rotate(-90deg) !important; }
          details summary::-webkit-details-marker { display: none; }
        `}</style>
      </section>

      {/* ── CTA finale — parchment ─────────────────────────── */}
      <section style={{
        padding: 'clamp(72px, 10vw, 120px) clamp(20px, 5vw, 80px)', textAlign: 'center',
        background: 'var(--lp-parchment)',
      }}>
        <h2 className="lp-h2" style={{ maxWidth: 760, margin: '0 auto 16px', color: 'var(--lp-ink)' }}>
          The best time to start<br />was today. The second best is now.
        </h2>
        <p className="lp-body" style={{ marginBottom: 32, color: 'var(--lp-ink-3)' }}>Free forever. No credit card. No noise.</p>
        <button className="lp-btn-primary" onClick={onGetStarted} style={{ padding: '14px 28px', fontSize: 18, fontWeight: 300 }}>
          Start now — it’s free <ArrowRight size={17} />
        </button>
      </section>

      {/* ── Footer — parchment, fine print (DESIGN.md footer) ─ */}
      <footer style={{ background: 'var(--lp-parchment)', borderTop: '1px solid var(--lp-hairline)' }}>
        <div style={{ maxWidth: 980, margin: '0 auto', padding: '40px clamp(20px, 5vw, 80px) 28px' }}>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: 28, paddingBottom: 24, borderBottom: '1px solid var(--lp-hairline)',
          }}>
            {FOOTER_COLS.map((col) => (
              <div key={col.title}>
                <div className="lp-caption-strong" style={{ fontSize: 12, color: 'var(--lp-ink)', marginBottom: 10 }}>{col.title}</div>
                {col.links.map((l) => (
                  <div key={l} className="lp-fine" style={{ color: 'var(--lp-ink-2)', padding: '5px 0', cursor: 'pointer', lineHeight: 1.9 }}
                    onMouseEnter={e => { e.currentTarget.style.color = 'var(--lp-accent)'; e.currentTarget.style.textDecoration = 'underline' }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'var(--lp-ink-2)'; e.currentTarget.style.textDecoration = 'none' }}
                    onClick={FOOTER_TARGETS[l] ? () => goTo(FOOTER_TARGETS[l]) : onGetStarted}
                  >{l}</div>
                ))}
              </div>
            ))}
            <div>
              <div className="lp-caption-strong" style={{ fontSize: 12, color: 'var(--lp-ink)', marginBottom: 10 }}>Get started</div>
              <div className="lp-fine" style={{ color: 'var(--lp-ink-2)', padding: '5px 0' }}>Free forever</div>
              <button className="lp-btn-primary" onClick={onGetStarted} style={{ marginTop: 12, padding: '6px 16px', fontSize: 12 }}>
                Sign in <ArrowRight size={12} />
              </button>
            </div>
          </div>

          <div className="lp-fine" style={{ paddingTop: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, color: 'var(--lp-ink-3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <img src="/logo.png" alt="MindForm" style={{ width: 16, height: 16, borderRadius: 4, objectFit: 'contain' }} />
              <span>© 2026 MindForm. All rights reserved.</span>
            </div>
            <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
              {[['Privacy Policy', '/privacy'], ['Terms of Use', '/terms'], ['How it works', '/how-it-works'], ['FAQ', '/faq']].map(([l, target]) => (
                <span key={l} style={{ cursor: 'pointer', transition: 'color 0.2s' }}
                  onClick={() => onSubPage && onSubPage(target)}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--lp-ink)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--lp-ink-3)'}
                >{l}</span>
              ))}
              <button onClick={onGetStarted} className="lp-link" style={{ fontSize: 12 }}>
                Sign in <ArrowRight size={12} />
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
