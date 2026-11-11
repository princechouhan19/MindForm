import React, { useEffect, useRef, useState, useCallback } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import {
  ArrowRight, CheckSquare, Activity, Target, Flame, Zap, Shield,
  ChevronRight, Sun, Moon, Lock, Bell, BarChart3, Sparkles, Users2,
} from 'lucide-react'

gsap.registerPlugin(ScrollTrigger)

/* ── Data ──────────────────────────────────────────────────── */
const SCENES = [
  {
    id: 'tasks',
    tag: 'Task Tracker',
    icon: CheckSquare,
    color: 'var(--cyan)',
    title: 'Plan your day\nto the minute.',
    desc: 'Schedule tasks with exact times, tick them off day by day, and let the Week Score show how strong your week really is. Every plan stays synced across your devices.',
    image: '/shots/tasks.png',
  },
  {
    id: 'habits',
    tag: 'Habit Tracker',
    icon: Activity,
    color: 'var(--amber)',
    title: 'Build chains\nthat don’t break.',
    desc: 'A 30-day matrix keeps every streak visible at a glance. Track mood and motivation alongside, and watch consistency compound into identity.',
    image: '/shots/habits.png',
  },
  {
    id: 'goals',
    tag: 'Goals',
    icon: Target,
    color: 'var(--brand-secondary)',
    title: 'Progress\nyou can see.',
    desc: 'Connect goals to the tasks and habits that drive them. MindForm computes progress automatically, so the finish line is never a mystery.',
    image: '/shots/goals.png',
  },
  {
    id: 'fapless',
    tag: 'Fapless',
    icon: Flame,
    color: 'var(--red)',
    title: 'Reclaim\nyour focus.',
    desc: 'A streak engine with ten identity levels, milestone bonuses and challenges. Discipline stops being willpower and becomes a game you’re winning.',
    image: '/shots/fapless.png',
  },
]

const RIBBON = [
  { icon: Bell,    color: 'var(--cyan)',     title: 'Smart reminders',  desc: 'Chimes and notifications when a task is due — never miss a block.' },
  { icon: BarChart3, color: 'var(--amber)',  title: 'Real insights',    desc: 'Week scores, completion rates and trends computed for you.' },
  { icon: Users2,  color: 'var(--pink)',     title: 'Accountability',   desc: 'Optional public streaks, a global leaderboard and a 2-day forum.' },
  { icon: Lock,    color: 'var(--green)',    title: 'Private by design', desc: 'Your data is scoped to your account. Chats auto-delete in 24h.' },
]

const STATS = [
  { value: 5,    suffix: '',     label: 'Core modules' },
  { value: 30,   suffix: ' days', label: 'Visible habit grid' },
  { value: 10,   suffix: '',     label: 'Identity levels' },
  { value: 100,  suffix: '%',    label: 'Free & open source' },
]

const FOOTER_COLS = [
  {
    title: 'Product',
    links: ['Task Tracker', 'Habit Tracker', 'Goals', 'Fapless', 'Social', 'AI Coach'],
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

/* ── Product window frame ──────────────────────────────────── */
function ProductFrame({ image, alt, glow = 'var(--brand-primary)' }) {
  return (
    <div style={{ position: 'relative', maxWidth: 980, margin: '0 auto', width: '100%' }}>
      {/* ambient glow */}
      <div aria-hidden style={{
        position: 'absolute', inset: '-8% -12%',
        background: `radial-gradient(ellipse at center, ${glow}26 0%, transparent 65%)`,
        filter: 'blur(20px)', zIndex: 0,
      }} />
      <div style={{
        position: 'relative', zIndex: 1,
        borderRadius: '20px',
        border: '1px solid var(--border-bright)',
        background: 'var(--bg-elevated)',
        boxShadow: '0 40px 100px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04) inset',
        overflow: 'hidden',
      }}>
        {/* window chrome */}
        <div style={{
          height: 40, display: 'flex', alignItems: 'center', gap: 8,
          padding: '0 16px', background: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border)', flexShrink: 0,
        }}>
          <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#ff5f57' }} />
          <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#febc2e' }} />
          <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#28c840' }} />
          <span style={{
            marginLeft: 12, fontSize: 12, color: 'var(--text-muted)',
            fontFamily: 'var(--font-body)', letterSpacing: '0.02em',
          }}>MindForm</span>
        </div>
        <img
          src={image}
          alt={alt}
          loading="lazy"
          onError={(e) => { e.currentTarget.style.display = 'none' }}
          style={{ width: '100%', display: 'block', aspectRatio: '16 / 9.6', objectFit: 'cover', objectPosition: 'top' }}
        />
      </div>
    </div>
  )
}

/* ── Scene (scroll storytelling section) ───────────────────── */
function Scene({ scene, index }) {
  const wrapRef = useRef(null)
  const textRef = useRef(null)
  const imgRef  = useRef(null)
  const Icon = scene.icon
  const flip = index % 2 === 1

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(textRef.current,
        { opacity: 0, y: 56 },
        { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out',
          scrollTrigger: { trigger: wrapRef.current, start: 'top 76%' } })
      gsap.fromTo(imgRef.current,
        { opacity: 0, y: 72, scale: 0.96 },
        { opacity: 1, y: 0, scale: 1, duration: 1.1, ease: 'power3.out',
          scrollTrigger: { trigger: wrapRef.current, start: 'top 74%' } })
    })
    return () => ctx.revert()
  }, [])

  return (
    <section ref={wrapRef} style={{
      padding: '110px clamp(20px,5vw,80px)',
      maxWidth: 1200, margin: '0 auto',
      display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(420px, 100%), 1fr))',
      gap: 'clamp(32px, 6vw, 88px)', alignItems: 'center',
    }}>
      {/* Text */}
      <div ref={textRef} style={{ opacity: 0, order: flip ? 2 : 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: `color-mix(in srgb, ${scene.color} 14%, transparent)`,
            border: `1px solid color-mix(in srgb, ${scene.color} 30%, transparent)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon size={19} style={{ color: scene.color }} />
          </div>
          <span style={{
            fontSize: 14, fontWeight: 600, letterSpacing: '0.04em',
            color: scene.color, textTransform: 'uppercase',
          }}>{scene.tag}</span>
        </div>
        <h2 className="lp-h2" style={{ whiteSpace: 'pre-line', marginBottom: 20 }}>
          {scene.title}
        </h2>
        <p className="lp-body" style={{ maxWidth: 460, marginBottom: 26 }}>{scene.desc}</p>
        <span className="lp-link">Learn more <ChevronRight size={16} /></span>
      </div>

      {/* Image */}
      <div ref={imgRef} style={{ opacity: 0, order: flip ? 1 : 2 }}>
        <div style={{
          borderRadius: '18px', overflow: 'hidden',
          border: '1px solid var(--border-bright)',
          boxShadow: 'var(--shadow-xl)',
          background: 'var(--bg-elevated)',
          transform: `perspective(1400px) rotateY(${flip ? -4 : 4}deg) rotateX(1.5deg)`,
        }}>
          <img
            src={scene.image}
            alt={scene.tag}
            loading="lazy"
            onError={(e) => { e.currentTarget.style.display = 'none' }}
            style={{ width: '100%', display: 'block', aspectRatio: '16/10.6', objectFit: 'cover', objectPosition: 'top' }}
          />
        </div>
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
      <div style={{ fontSize: 'clamp(2.4rem,4.5vw,3.6rem)', fontFamily: 'var(--font-display)', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1, color: 'var(--text-primary)' }}>
        <span ref={ref}>0</span><span style={{ fontSize: '0.55em', color: 'var(--text-secondary)', fontWeight: 600 }}>{stat.suffix}</span>
      </div>
      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 10, letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600 }}>{stat.label}</div>
    </div>
  )
}

/* ── Main Landing Page ─────────────────────────────────────── */
export default function LandingPage({ onGetStarted, theme, setTheme }) {
  const [mobileMenu, setMobileMenu] = useState(false)
  const [scrolled, setScrolled] = useState(false)
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
    const onLenisScroll = () => setScrolled(window.scrollY > 24)
    lenis.on('scroll', onLenisScroll)
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
      { opacity: 0, y: 90, scale: 0.965 },
      { opacity: 1, y: 0, scale: 1, duration: 1.2, ease: 'power3.out' }, '-=0.55')
    return () => tl.kill()
  }, [])

  /* ── Hero product parallax out ─── */
  useEffect(() => {
    if (!heroImgRef.current) return
    const ctx = gsap.context(() => {
      gsap.to(heroImgRef.current, {
        y: -70, scale: 0.97, opacity: 0.35, ease: 'none',
        scrollTrigger: { trigger: heroImgRef.current, start: 'top 40%', end: 'bottom 20%', scrub: 0.6 },
      })
    })
    return () => ctx.revert()
  }, [])

  const goTo = useCallback((id) => {
    const node = document.getElementById(id)
    if (node && lenisRef.current) lenisRef.current.scrollTo(node, { offset: -64, duration: 1.2 })
    else if (node) node.scrollIntoView({ behavior: 'smooth' })
    setMobileMenu(false)
  }, [])

  const NAV_LINKS = [
    { label: 'Overview', id: 'lp-overview' },
    { label: 'Features', id: 'lp-scenes' },
    { label: 'Privacy', id: 'lp-privacy' },
  ]

  return (
    <div
      ref={scrollRef}
      style={{ width: '100%', minHeight: '100vh', background: 'var(--bg-base)', position: 'relative' }}
    >
      <ProgressBar />

      {/* ── Nav ────────────────────────────────────────────── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 clamp(20px,4vw,44px)', height: 'var(--nav-height)', gap: 12,
        background: scrolled ? 'var(--bg-overlay)' : 'transparent',
        backdropFilter: scrolled ? 'saturate(180%) blur(20px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'saturate(180%) blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid var(--border)' : '1px solid transparent',
        transition: 'all 0.4s var(--ease-out-expo)',
      }}>
        <button onClick={() => goTo('lp-top')} style={{ display: 'flex', alignItems: 'center', gap: 9, background: 'none' }}>
          <img src="/logo.png" alt="MindForm" style={{ width: 26, height: 26, borderRadius: 7, objectFit: 'contain' }} />
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, letterSpacing: '-0.01em' }}>MindForm</span>
        </button>

        <div className="hide-xs" style={{ display: 'flex', alignItems: 'center', gap: 34 }}>
          {NAV_LINKS.map(({ label, id }) => (
            <button key={id} onClick={() => goTo(id)}
              style={{ background: 'none', color: 'var(--text-secondary)', fontSize: 14, fontWeight: 500, fontFamily: 'var(--font-body)', transition: 'color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
            >{label}</button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            aria-label="Toggle theme"
            onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
            style={{ background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: '50%', width: 34, height: 34, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)' }}
          >
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
          </button>
          <button
            onClick={() => onGetStarted('login')}
            style={{
              background: 'none', border: 'none', color: 'var(--text-secondary)',
              fontSize: 14, fontWeight: 600, cursor: 'pointer', padding: '8px 12px',
              fontFamily: 'var(--font-body)', transition: 'color 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
          >
            Sign in
          </button>
          <button className="lp-btn-primary" onClick={() => onGetStarted('register')} style={{ padding: '8px 18px', fontSize: 14, minHeight: 34 }}>
            Sign up
          </button>
          {mobileMenu && (
            <div style={{
              position: 'absolute', top: 'var(--nav-height)', left: 0, right: 0,
              background: 'var(--bg-overlay)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border)',
              display: 'flex', flexDirection: 'column', padding: 20, gap: 4,
            }}>
              {NAV_LINKS.map(({ label, id }) => (
                <button key={id} onClick={() => goTo(id)} style={{ background: 'none', textAlign: 'left', padding: '12px 8px', fontSize: 17, fontWeight: 600, color: 'var(--text-primary)', borderRadius: 10 }}>{label}</button>
              ))}
              <div style={{ height: 1, background: 'var(--border)', margin: '8px 0' }} />
              <button onClick={() => onGetStarted('login')} style={{ background: 'none', textAlign: 'left', padding: '12px 8px', fontSize: 17, fontWeight: 600, color: 'var(--text-primary)', border: 'none', cursor: 'pointer' }}>Sign In</button>
              <button onClick={() => onGetStarted('register')} style={{ background: 'none', textAlign: 'left', padding: '12px 8px', fontSize: 17, fontWeight: 600, color: 'var(--brand-primary)', border: 'none', cursor: 'pointer' }}>Sign Up</button>
            </div>
          )}
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────── */}
      <section id="lp-top" style={{
        minHeight: 'calc(100vh - var(--nav-height))',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'flex-start', textAlign: 'center',
        padding: 'clamp(64px,10vh,120px) clamp(20px,5vw,80px) 60px',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Ambient gradient — Apple keynote backdrop */}
        <div aria-hidden style={{
          position: 'absolute', top: '-30%', left: '50%', transform: 'translateX(-50%)',
          width: '140vw', maxWidth: 1600, height: 900,
          background: 'radial-gradient(ellipse at center, rgba(10,132,255,0.16) 0%, rgba(94,92,230,0.10) 34%, transparent 68%)',
          filter: 'blur(28px)', pointerEvents: 'none',
        }} />

        <div ref={heroTextRef} style={{ position: 'relative', zIndex: 1 }}>
          <div className="lp-pill" style={{ marginBottom: 28, opacity: 0 }} id="lp-hero-pill">
            <Sparkles size={12} style={{ color: 'var(--brand-primary)' }} />
            Meet your new discipline engine
          </div>

          <h1 className="lp-display" style={{ maxWidth: 1000, marginBottom: 24 }}>
            <span className="lp-line-mask" style={{ display: 'block', overflow: 'hidden' }}><span style={{ display: 'block' }}>MindForm.</span></span>
            <span className="lp-line-mask" style={{ display: 'block', overflow: 'hidden' }}><span style={{ display: 'block', color: 'var(--text-secondary)' }}>Built for the mind</span></span>
            <span className="lp-line-mask" style={{ display: 'block', overflow: 'hidden' }}><span style={{ display: 'block', color: 'var(--text-secondary)' }}>you want to live with.</span></span>
          </h1>

          <p className="lp-body" style={{ maxWidth: 560, margin: '0 auto 40px' }}>
            Tasks, habits, goals and discipline — one private, focused dashboard
            that makes consistency feel effortless.
          </p>

          <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' }}>
            <button className="lp-btn-primary" onClick={() => onGetStarted('register')}>
              Get started free <ArrowRight size={16} />
            </button>
            <button className="lp-link" onClick={() => goTo('lp-scenes')}>
              Explore features <ChevronRight size={15} />
            </button>
          </div>
        </div>

        {/* Product shot */}
        <div ref={heroImgRef} style={{ width: '100%', marginTop: 'clamp(48px,8vh,84px)', opacity: 0, position: 'relative', zIndex: 1 }}>
          <ProductFrame image="/shots/tasks.png" alt="MindForm task tracker" glow="var(--brand-primary)" />
        </div>
      </section>

      {/* ── Quiet ticker ───────────────────────────────────── */}
      <div style={{ overflow: 'hidden', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '13px 0', background: 'var(--bg-surface)' }}>
        <div className="lp-marquee-inner" style={{ whiteSpace: 'nowrap' }}>
          {Array(2).fill(['Minute-level planning','30-day habit matrix','Week score insights','Goal-linked progress','Identity levels','Auto-deleting chats','CSV export','Dark & light']).flat().map((item, i) => (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 24, padding: '0 28px', fontSize: 12.5, fontFamily: 'var(--font-body)', fontWeight: 500, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--brand-primary)', display: 'inline-block', flexShrink: 0 }} />
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* ── Stats ──────────────────────────────────────────── */}
      <section id="lp-overview" style={{ padding: '96px clamp(20px,5vw,80px)', maxWidth: 'var(--content-max)', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 32 }}>
          {STATS.map((s) => <Stat key={s.label} stat={s} />)}
        </div>
      </section>

      {/* ── Ribbon: get to know MindForm ───────────────────── */}
      <section style={{ padding: '24px clamp(20px,5vw,80px) 96px', maxWidth: 'var(--content-max)', margin: '0 auto' }}>
        <h2 className="lp-h2" style={{ textAlign: 'center', marginBottom: 56 }}>
          Get to know MindForm.
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(440px, 100%), 1fr))', gap: 20 }}>
          {RIBBON.map(({ icon: Icon, color, title, desc }) => (
            <RibbonCard key={title} icon={Icon} color={color} title={title} desc={desc} />
          ))}
        </div>
      </section>

      {/* ── Scenes (storytelling) ──────────────────────────── */}
      <div id="lp-scenes">
        {SCENES.map((s, i) => <Scene key={s.id} scene={s} index={i} />)}
      </div>

      {/* ── Privacy strip ──────────────────────────────────── */}
      <section id="lp-privacy" style={{ padding: '110px clamp(20px,5vw,80px)', maxWidth: 'var(--content-max)', margin: '0 auto', textAlign: 'center' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 56, height: 56, borderRadius: 16, marginBottom: 24,
          background: 'var(--green-dim)', border: '1px solid color-mix(in srgb, var(--green) 30%, transparent)',
        }}>
          <Shield size={26} style={{ color: 'var(--green)' }} />
        </div>
        <h2 className="lp-h2" style={{ marginBottom: 18 }}>Privacy. Built in<br />from the start.</h2>
        <p className="lp-body" style={{ maxWidth: 560, margin: '0 auto 8px' }}>
          Your data stays scoped to your account. AI chats delete themselves every 24 hours,
          forum posts every 48. Profiles are private until you choose to share your streak.
        </p>
      </section>

      {/* ── CTA finale ─────────────────────────────────────── */}
      <section style={{
        padding: '110px clamp(20px,5vw,80px)', textAlign: 'center',
        background: 'var(--bg-surface)', borderTop: '1px solid var(--border)',
      }}>
        <h2 className="lp-h2" style={{ maxWidth: 700, margin: '0 auto 18px' }}>
          The best time to start<br />was today. <span className="lp-gradient-text">The second best is now.</span>
        </h2>
        <p className="lp-body" style={{ marginBottom: 40 }}>Free forever. No credit card. No noise.</p>
        <button className="lp-btn-primary" onClick={() => onGetStarted('register')} style={{ padding: '17px 46px', fontSize: 17 }}>
          Start now — it’s free <ArrowRight size={17} />
        </button>
      </section>

      {/* ── Footer — apple.com style ───────────────────────── */}
      <footer style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 'var(--content-max)', margin: '0 auto', padding: '40px clamp(20px,5vw,80px) 32px' }}>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: 28, paddingBottom: 32, borderBottom: '1px solid var(--border)',
          }}>
            {FOOTER_COLS.map((col) => (
              <div key={col.title}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>{col.title}</div>
                {col.links.map((l) => (
                  <div key={l} style={{ fontSize: 12.5, color: 'var(--text-muted)', padding: '4px 0', cursor: 'pointer', transition: 'color 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                    onClick={l === 'Task Tracker' || l === 'Habit Tracker' || l === 'Goals' || l === 'Fapless' ? () => onGetStarted('register') : undefined}
                  >{l}</div>
                ))}
              </div>
            ))}
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>Get started</div>
              <div style={{ fontSize: 12.5, color: 'var(--text-muted)', padding: '4px 0' }}>Free forever</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
                <button className="lp-btn-primary" onClick={() => onGetStarted('register')} style={{ padding: '8px 18px', fontSize: 13, width: '100%', justifyContent: 'center' }}>
                  Sign up free <ArrowRight size={13} />
                </button>
                <button onClick={() => onGetStarted('login')} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 'var(--radius-pill)', color: 'var(--text-secondary)', padding: '7px 16px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', transition: 'all 0.2s' }}>
                  Sign in
                </button>
              </div>
            </div>
          </div>

          <div style={{ paddingTop: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <img src="/logo.png" alt="MindForm" style={{ width: 20, height: 20, borderRadius: 5, objectFit: 'contain' }} />
              <span style={{ fontSize: 12.5, color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
                © 2026 MindForm. All rights reserved.
              </span>
            </div>
            <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
              {['Privacy Policy', 'Terms of Use', 'Open Source'].map((l) => (
                <span key={l} style={{ fontSize: 12.5, color: 'var(--text-muted)', cursor: 'pointer', transition: 'color 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                >{l}</span>
              ))}
              <button onClick={() => onGetStarted('login')} style={{ background: 'none', border: 'none', color: 'var(--brand-primary)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                Sign in →
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

/* ── Ribbon card ───────────────────────────────────────────── */
function RibbonCard({ icon: Icon, color, title, desc }) {
  const ref = useReveal()
  return (
    <div ref={ref} className="lp-card" style={{ padding: '30px 30px 32px', opacity: 0 }}>
      <div style={{
        width: 44, height: 44, borderRadius: 13, marginBottom: 18,
        background: `color-mix(in srgb, ${color} 14%, transparent)`,
        border: `1px solid color-mix(in srgb, ${color} 28%, transparent)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={20} style={{ color }} />
      </div>
      <div className="lp-h3" style={{ marginBottom: 8 }}>{title}</div>
      <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.6, fontFamily: 'var(--font-body)' }}>{desc}</p>
    </div>
  )
}
