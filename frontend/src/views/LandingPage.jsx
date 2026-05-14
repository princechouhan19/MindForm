import React, { useEffect, useRef, useState, useCallback } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import Lenis from 'lenis'
import { ArrowRight, CheckSquare, Activity, Target, Flame, Zap, Shield, BarChart2, Sun, Moon, Menu, X } from 'lucide-react'
import WebGLBackground from '../components/WebGLBackground'

gsap.registerPlugin(ScrollTrigger, SplitText)

/* ── Custom Cursor ─────────────────────────────────────────── */
function Cursor() {
  const dot  = useRef(null)
  const ring = useRef(null)
  useEffect(() => {
    let rx = 0, ry = 0
    const move = (e) => {
      gsap.to(dot.current,  { x: e.clientX, y: e.clientY, duration: 0.1 })
      gsap.to(ring.current, { x: e.clientX - 20, y: e.clientY - 20, duration: 0.35, ease: 'power2.out' })
    }
    const grow = () => gsap.to(ring.current, { scale: 2.5, opacity: 0.3, duration: 0.3 })
    const shrink = () => gsap.to(ring.current, { scale: 1, opacity: 0.5, duration: 0.3 })
    window.addEventListener('mousemove', move)
    document.querySelectorAll('button,a').forEach(el => { el.addEventListener('mouseenter', grow); el.addEventListener('mouseleave', shrink) })
    return () => window.removeEventListener('mousemove', move)
  }, [])
  if (window.matchMedia('(hover: none)').matches) return null
  return (
    <>
      <div ref={dot}  className="lp-cursor" style={{ transform: 'translate(-50%,-50%)' }} />
      <div ref={ring} className="lp-cursor-ring" />
    </>
  )
}

/* ── Progress Bar ──────────────────────────────────────────── */
function ProgressBar({ scrollEl }) {
  const fill = useRef(null)
  useEffect(() => {
    if (!scrollEl) return
    const el = scrollEl
    const onScroll = () => {
      const pct = el.scrollTop / (el.scrollHeight - el.clientHeight)
      if (fill.current) fill.current.style.transform = `scaleX(${pct})`
    }
    el.addEventListener('scroll', onScroll)
    return () => el.removeEventListener('scroll', onScroll)
  }, [scrollEl])
  return (
    <div className="lp-progress-bar">
      <div ref={fill} className="lp-progress-fill" style={{ transform: 'scaleX(0)' }} />
    </div>
  )
}

/* ── Marquee ───────────────────────────────────────────────── */
const MARQUEE_ITEMS = ['Task Tracker','Habit Builder','Goal Setting','Focus Mode','Streak Tracking','Aura System','Deep Work','Daily Rituals']
function Marquee() {
  const items = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS]
  return (
    <div style={{ overflow:'hidden', borderTop:'1px solid var(--border)', borderBottom:'1px solid var(--border)', padding:'14px 0', background:'var(--bg-surface)' }}>
      <div className="lp-marquee-inner" style={{ whiteSpace:'nowrap' }}>
        {items.map((item, i) => (
          <span key={i} style={{ display:'inline-flex', alignItems:'center', gap:24, padding:'0 32px', fontSize:12, fontFamily:'var(--font-mono)', fontWeight:500, letterSpacing:'0.12em', color:'var(--text-secondary)', textTransform:'uppercase' }}>
            <span style={{ width:4, height:4, borderRadius:'50%', background:'var(--brand-primary)', display:'inline-block', flexShrink:0 }} />
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}

/* ── Data ──────────────────────────────────────────────────── */
const FEATURES = [
  { icon: CheckSquare, color: 'var(--cyan)',    title: 'Task Tracker',  desc: 'Capture, organize, and crush your daily tasks with Kanban & list views.',      image: '/TaskTracker.png'  },
  { icon: Activity,   color: 'var(--amber)',   title: 'Habit Tracker', desc: 'Build unbreakable chains. Track streaks, completion rates, and momentum.',       image: '/Habit-Tracker.png'},
  { icon: Target,     color: 'var(--green)',   title: 'Goals',         desc: 'Set ambitious goals, link habits and tasks, watch your progress compound.',       image: '/Goals.png'        },
  { icon: Flame,      color: 'var(--red)',     title: 'Fapless Mode',  desc: 'Take back control. Track your streak, level up your aura, stay accountable.',     image: '/fapless.png'      },
]

const STATS = [
  { value: '4',    label: 'Core Modules',   icon: Zap,      color: 'var(--cyan)'   },
  { value: '∞',   label: 'Daily Habits',   icon: Activity,  color: 'var(--amber)'  },
  { value: '100%',label: 'Open Source',    icon: Shield,    color: 'var(--green)'  },
  { value: '0',   label: 'Distractions',   icon: BarChart2, color: 'var(--purple)' },
]

const HOW_STEPS = [
  { num:'01', title:'Sign up free',       desc:'Create your account in under 30 seconds. No credit card.' },
  { num:'02', title:'Set your intentions',desc:'Add tasks, habits, and long-term goals that matter to you.' },
  { num:'03', title:'Build your rituals', desc:'Track daily, stay consistent, and watch your aura grow.'  },
]

/* ── Feature Card ──────────────────────────────────────────── */
function FeatureCard({ feature, index }) {
  const ref = useRef(null)
  const Icon = feature.icon
  useEffect(() => {
    gsap.fromTo(ref.current,
      { opacity:0, y:50 },
      { opacity:1, y:0, duration:0.7, ease:'power3.out', delay: index * 0.1,
        scrollTrigger: { trigger: ref.current, start:'top 85%' } })
  }, [index])
  return (
    <div ref={ref} className="lp-card" style={{ overflow:'hidden', opacity:0 }}>
      <div style={{ height:200, overflow:'hidden', position:'relative', borderBottom:'1px solid var(--border)' }}>
        <img src={feature.image} alt={feature.title} style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'top', transition:'transform 0.6s var(--ease-out-expo)' }}
          onMouseEnter={e => gsap.to(e.target, { scale:1.06, duration:0.6, ease:'power2.out' })}
          onMouseLeave={e => gsap.to(e.target, { scale:1, duration:0.6, ease:'power2.out' })} />
        <div style={{ position:'absolute', inset:0, background:`linear-gradient(to bottom, transparent 50%, ${feature.color}18)` }} />
      </div>
      <div style={{ padding:'22px 24px 26px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:feature.color+'18', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Icon size={17} style={{ color:feature.color }} />
          </div>
          <span style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:15, letterSpacing:'0.01em' }}>{feature.title}</span>
        </div>
        <p style={{ fontSize:13.5, color:'var(--text-secondary)', lineHeight:1.65, fontFamily:'var(--font-body)' }}>{feature.desc}</p>
      </div>
    </div>
  )
}

/* ── How Step ──────────────────────────────────────────────── */
function HowStep({ step, index }) {
  const ref = useRef(null)
  useEffect(() => {
    gsap.fromTo(ref.current,
      { opacity:0, x: index % 2 === 0 ? -40 : 40 },
      { opacity:1, x:0, duration:0.7, ease:'power3.out',
        scrollTrigger: { trigger: ref.current, start:'top 85%' } })
  }, [index])
  return (
    <div ref={ref} style={{ display:'flex', gap:24, alignItems:'flex-start', opacity:0 }}>
      <div style={{ fontSize:'clamp(2.5rem,5vw,4rem)', fontFamily:'var(--font-display)', fontWeight:800, color:'var(--brand-primary-glow)', lineHeight:1, flexShrink:0, minWidth:64 }}>{step.num}</div>
      <div style={{ paddingTop:8 }}>
        <h3 style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:'clamp(1.1rem,2vw,1.35rem)', marginBottom:8, letterSpacing:'-0.01em' }}>{step.title}</h3>
        <p style={{ fontSize:14.5, color:'var(--text-secondary)', lineHeight:1.7, fontFamily:'var(--font-body)' }}>{step.desc}</p>
      </div>
    </div>
  )
}

/* ── Main Landing Page ─────────────────────────────────────── */
export default function LandingPage({ onGetStarted }) {
  const [theme, setTheme]   = useState('dark')
  const [mobileMenu, setMobileMenu] = useState(false)
  const [scrolled, setScrolled]     = useState(false)
  const scrollRef = useRef(null)
  const heroRef   = useRef(null)
  const heroTitle = useRef(null)
  const heroSub   = useRef(null)
  const heroCta   = useRef(null)
  const lenisRef  = useRef(null)

  /* ── Apply theme ─── */
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  /* ── Lenis smooth scroll ─── */
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const lenis = new Lenis({ wrapper: el, content: el, lerp: 0.09, smoothWheel: true })
    lenisRef.current = lenis
    const raf = (time) => { lenis.raf(time); requestAnimationFrame(raf) }
    requestAnimationFrame(raf)
    lenis.on('scroll', ({ scroll, limit }) => {
      setScrolled(scroll > 30)
      ScrollTrigger.update()
    })
    ScrollTrigger.scrollerProxy(el, {
      scrollTop(v) { return arguments.length ? lenis.scrollTo(v, { immediate:true }) : el.scrollTop },
      getBoundingClientRect() { return { top:0, left:0, width:window.innerWidth, height:window.innerHeight } },
    })
    ScrollTrigger.defaults({ scroller: el })
    return () => { lenis.destroy(); ScrollTrigger.killAll() }
  }, [])

  /* ── GSAP hero animations ─── */
  useEffect(() => {
    if (!heroTitle.current) return
    const tl = gsap.timeline({ delay: 0.2 })

    // Split hero title into chars
    const split = new SplitText(heroTitle.current, { type:'chars,words' })
    tl.fromTo(split.chars,
      { opacity:0, y:60, rotateX:-40 },
      { opacity:1, y:0, rotateX:0, duration:0.8, ease:'power4.out', stagger:0.022 })
      .fromTo(heroSub.current,
        { opacity:0, y:30 },
        { opacity:1, y:0, duration:0.6, ease:'power3.out' }, '-=0.4')
      .fromTo(heroCta.current,
        { opacity:0, y:20 },
        { opacity:1, y:0, duration:0.5, ease:'power2.out' }, '-=0.3')

    return () => { split.revert(); tl.kill() }
  }, [])

  /* ── GSAP stats counter ─── */
  useEffect(() => {
    const els = document.querySelectorAll('.lp-stat-num')
    els.forEach(el => {
      ScrollTrigger.create({
        trigger: el,
        start: 'top 85%',
        onEnter: () => gsap.fromTo(el, { opacity:0, y:20 }, { opacity:1, y:0, duration:0.5, ease:'power3.out' }),
      })
    })
  }, [])

  return (
    <div
      ref={scrollRef}
      style={{ height:'100vh', width:'100vw', overflowY:'auto', overflowX:'hidden', background:'var(--bg-base)', position:'relative' }}
    >
      {/* WebGL Background */}
      <WebGLBackground theme={theme} />

      {/* Custom cursor */}
      <Cursor />

      {/* Progress bar */}
      <ProgressBar scrollEl={scrollRef.current} />

      {/* ── Navbar ────────────────────────────────────────── */}
      <nav style={{
        position:'sticky', top:0, zIndex:100,
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'0 clamp(16px,3vw,40px)', height:68, gap:12,
        background: scrolled ? 'var(--bg-overlay)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px) saturate(180%)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid var(--border)' : '1px solid transparent',
        transition:'all 0.4s var(--ease-out-expo)',
      }}>
        {/* Logo */}
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <img src="/logo.png" alt="MindForm" style={{ width:30, height:30, borderRadius:8, objectFit:'contain' }} />
          <span style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:16, letterSpacing:'0.06em' }}>MIND FORM</span>
        </div>

        {/* Desktop nav links */}
        <div className="hide-xs" style={{ display:'flex', alignItems:'center', gap:32 }}>
          {['Features','How it Works','Open Source'].map(label => (
            <button key={label}
              onClick={() => document.getElementById('lp-'+label.toLowerCase().replace(/ /g,'-'))?.scrollIntoView({ behavior:'smooth' })}
              style={{ background:'none', color:'var(--text-secondary)', fontSize:13.5, fontWeight:500, fontFamily:'var(--font-body)', letterSpacing:'0.01em', transition:'color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.color='var(--text-primary)'}
              onMouseLeave={e => e.currentTarget.style.color='var(--text-secondary)'}
            >{label}</button>
          ))}
        </div>

        {/* Right controls */}
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <button
            aria-label="Toggle theme"
            onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
            style={{ background:'var(--bg-glass)', border:'1px solid var(--border)', borderRadius:10, padding:9, color:'var(--text-secondary)', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.background='var(--bg-glass-hover)'; e.currentTarget.style.color='var(--text-primary)' }}
            onMouseLeave={e => { e.currentTarget.style.background='var(--bg-glass)'; e.currentTarget.style.color='var(--text-secondary)' }}
          >
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>
          <button className="lp-btn-primary" onClick={onGetStarted} style={{ padding:'9px 20px', fontSize:13.5, borderRadius:10 }}>
            Sign In <ArrowRight size={14} />
          </button>
          <button className="hide-xs" onClick={() => setMobileMenu(v => !v)} style={{ display:'none', background:'none', color:'var(--text-primary)', padding:6 }}>
            {mobileMenu ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* ── Hero ──────────────────────────────────────────── */}
      <section ref={heroRef} style={{ minHeight:'calc(100vh - 68px)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center', padding:'60px clamp(16px,5vw,80px) 100px', position:'relative' }}>
        {/* Badge */}
        <div className="lp-pill" style={{ marginBottom:32 }}>
          <Zap size={11} fill="currentColor" /> Your personal productivity suite
        </div>

        {/* Headline */}
        <h1 ref={heroTitle} className="lp-display" style={{ maxWidth:900, marginBottom:20, perspective:800 }}>
          Build the mind you<br />
          <span className="lp-gradient-text">want to live with.</span>
        </h1>

        {/* Sub */}
        <p ref={heroSub} className="lp-body" style={{ maxWidth:520, marginBottom:44, opacity:0 }}>
          Tasks, habits, goals, and self-discipline — all in one deeply focused dashboard. No fluff, no noise, no distractions.
        </p>

        {/* CTAs */}
        <div ref={heroCta} style={{ display:'flex', gap:14, flexWrap:'wrap', justifyContent:'center', opacity:0 }}>
          <button className="lp-btn-primary" onClick={onGetStarted}>
            Get Started Free <ArrowRight size={16} />
          </button>
          <button className="lp-btn-secondary"
            onClick={() => document.getElementById('lp-features')?.scrollIntoView({ behavior:'smooth' })}>
            Explore Features
          </button>
        </div>

        {/* Scroll hint */}
        <div style={{ position:'absolute', bottom:32, display:'flex', flexDirection:'column', alignItems:'center', gap:6, color:'var(--text-muted)', fontSize:10, letterSpacing:'0.14em', fontFamily:'var(--font-mono)', animation:'lp-scroll-hint 2.2s ease-in-out infinite' }}>
          <div style={{ width:1, height:40, background:'linear-gradient(to bottom, transparent, var(--brand-primary))' }} />
          SCROLL
        </div>

        <style>{`
          @keyframes lp-scroll-hint {
            0%,100% { transform:translateY(0); opacity:0.5; }
            50%      { transform:translateY(8px); opacity:1; }
          }
        `}</style>
      </section>

      {/* ── Marquee ───────────────────────────────────────── */}
      <Marquee />

      {/* ── Stats ─────────────────────────────────────────── */}
      <section style={{ padding:'72px clamp(16px,5vw,80px)', maxWidth:1100, margin:'0 auto' }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:24 }}>
          {STATS.map(({ value, label, icon: Icon, color }) => (
            <div key={label} className="lp-card" style={{ padding:'28px 24px', textAlign:'center' }}>
              <Icon size={24} style={{ color, marginBottom:12 }} />
              <div className="lp-stat-num" style={{ fontSize:'clamp(2.2rem,4vw,3rem)', fontFamily:'var(--font-display)', fontWeight:800, color, letterSpacing:'-0.03em', lineHeight:1, opacity:0 }}>{value}</div>
              <div style={{ fontSize:12, color:'var(--text-secondary)', letterSpacing:'0.08em', marginTop:8, fontFamily:'var(--font-mono)', textTransform:'uppercase' }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────── */}
      <section id="lp-features" style={{ padding:'80px clamp(16px,5vw,80px)', maxWidth:1100, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:64 }}>
          <div className="lp-pill" style={{ marginBottom:16 }}>What's inside</div>
          <h2 className="lp-h2">
            Everything you need.<br />
            <span style={{ color:'var(--text-secondary)', fontWeight:400 }}>Nothing you don't.</span>
          </h2>
          <div className="lp-divider" style={{ margin:'20px auto 0' }} />
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:24 }}>
          {FEATURES.map((f, i) => <FeatureCard key={f.title} feature={f} index={i} />)}
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────── */}
      <section id="lp-how-it-works" style={{ padding:'80px clamp(16px,5vw,80px)', background:'var(--bg-surface)', borderTop:'1px solid var(--border)', borderBottom:'1px solid var(--border)' }}>
        <div style={{ maxWidth:900, margin:'0 auto', display:'grid', gridTemplateColumns:'1fr 1fr', gap:80, alignItems:'center' }}>
          <div>
            <div className="lp-pill" style={{ marginBottom:16 }}>How it works</div>
            <h2 className="lp-h2" style={{ marginBottom:12 }}>Simple by design,<br />powerful by nature.</h2>
            <p className="lp-body" style={{ marginBottom:0 }}>MindForm strips away everything unnecessary so you can focus on what matters: building the version of yourself you've always imagined.</p>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:40 }}>
            {HOW_STEPS.map((s, i) => <HowStep key={s.num} step={s} index={i} />)}
          </div>
        </div>
      </section>

      {/* ── Open source strip ─────────────────────────────── */}
      <section id="lp-open-source" style={{ padding:'80px clamp(16px,5vw,80px)', maxWidth:700, margin:'0 auto', textAlign:'center' }}>
        <div className="lp-pill" style={{ marginBottom:16 }}>Open source</div>
        <h2 className="lp-h2" style={{ marginBottom:16 }}>Built in public.<br /><span className="lp-gradient-text">Free forever.</span></h2>
        <p className="lp-body" style={{ marginBottom:36 }}>MindForm is 100% open source. Inspect the code, contribute, or self-host. We believe your productivity tools should be transparent.</p>
        <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
          <button className="lp-btn-primary" onClick={onGetStarted}>Start for Free <ArrowRight size={16} /></button>
          <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="lp-btn-secondary" style={{ textDecoration:'none' }}>
            ★ GitHub
          </a>
        </div>
      </section>

      {/* ── CTA Banner ────────────────────────────────────── */}
      <section style={{ padding:'100px clamp(16px,5vw,80px)', textAlign:'center', background:'var(--bg-surface)', borderTop:'1px solid var(--border)' }}>
        <h2 className="lp-h2" style={{ marginBottom:16, maxWidth:600, margin:'0 auto 16px' }}>
          Ready to form<br />
          <span className="lp-gradient-text">your mind?</span>
        </h2>
        <p className="lp-body" style={{ marginBottom:40 }}>Join and start building better habits, one day at a time.</p>
        <button className="lp-btn-primary" onClick={onGetStarted} style={{ padding:'18px 52px', fontSize:17 }}>
          Start Now — It's Free <ArrowRight size={18} />
        </button>
      </section>

      {/* ── Footer ────────────────────────────────────────── */}
      <footer style={{ padding:'28px clamp(16px,3vw,40px)', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12, borderTop:'1px solid var(--border)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <img src="/logo.png" alt="MindForm" style={{ width:24, height:24, borderRadius:6, objectFit:'contain' }} />
          <span style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:13, letterSpacing:'0.07em' }}>MIND FORM</span>
        </div>
        <span style={{ fontSize:12, color:'var(--text-muted)', fontFamily:'var(--font-body)' }}>
          © 2025 MindForm. All rights reserved.
        </span>
        <div style={{ fontSize:12, color:'var(--text-muted)', fontFamily:'var(--font-body)' }}>
          Already have an account?{' '}
          <button onClick={onGetStarted} style={{ background:'none', color:'var(--brand-primary)', fontWeight:600, fontSize:12, cursor:'pointer', fontFamily:'var(--font-body)', borderBottom:'1px solid var(--brand-primary-glow)' }}>
            Sign in →
          </button>
        </div>
      </footer>
    </div>
  )
}
