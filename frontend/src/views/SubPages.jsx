import React, { useEffect } from 'react'
import { ArrowLeft, Shield, FileText, HelpCircle, Compass, ChevronRight } from 'lucide-react'

/* ── Landing sub-pages (DESIGN.md: quiet canvas, hairlines, one accent) ──
   Routed from App.jsx via real paths: /privacy /terms /faq /how-it-works.
   The Express SPA fallback serves index.html for all of them in production. */

export const SUB_PAGES = [
  { path: '/privacy',     title: 'Privacy Policy',  icon: Shield,    desc: 'What MindForm stores, what it never touches, and how deletion works.' },
  { path: '/terms',       title: 'Terms of Use',    icon: FileText,  desc: 'The short, plain-English rules for using MindForm.' },
  { path: '/faq',         title: 'FAQ',             icon: HelpCircle, desc: 'Answers about data, pricing, the Speak module and self-hosting.' },
  { path: '/how-it-works', title: 'How it works',   icon: Compass,   desc: 'A guided tour of every module — and the 15-minute Speak session.' },
]

/* Shared content data — FAQ copy mirrors the FAQPage JSON-LD in index.html. */
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
  { q: 'What is Coach?',
    a: 'Coach is MindForm’s built-in AI assistant. It reads your tasks, habits, goals and streak, then can propose concrete changes — new tasks, habit replans, goals with deadlines — as review cards. Nothing touches your account until you tap Apply.' },
  { q: 'Can Coach edit my tasks, habits and goals?',
    a: 'Yes — but only with your approval. Coach proposes changes as “Apply” cards in the chat. Applying writes them straight into the Tasks, Habits or Goals sections using the same weekly and monthly buckets you see in the app. You can also run quick starts like “Plan my week”, “Replan habits” or “Edit goals”.' },
  { q: 'Which AI providers does Coach support?',
    a: 'OpenAI, Google Gemini, Anthropic Claude and Mistral. You bring your own API key, choose the model, and the key is stored only in your browser — MindForm’s servers only forward the request, they never store it.' },
  { q: 'Do I need an internet connection?',
    a: 'For account sync, Coach and the community features, yes. Speak practice works fully offline in the browser, and camera recordings never leave your device either way.' },
  { q: 'Can I export my data?',
    a: 'Yes. Task Tracker and Habit Tracker both support one-click CSV export from their manage views.' },
  { q: 'How do I self-host MindForm?',
    a: 'Clone the repository, install backend and frontend dependencies, set a MONGO_URI and JWT secret, run the backend (it serves the built frontend from backend/public), and point your domain at it. The stack is Node.js, Express and MongoDB — no paid services required.' },
]

const MODULES = [
  { name: 'Task Tracker',   desc: 'A minute-level weekly planner. Each week is a grid of days; add tasks with exact times, tick them off day by day, and watch the Week Score reflect how strong your week really was. Includes a next-task countdown, insights and a weekly reflection prompt.' },
  { name: 'Habit Tracker',  desc: 'A 30-day matrix where every habit is a row and every day a cell. Track mood and motivation on a 1–10 scale next to your check-ins, so you can see how your body and mind move together.' },
  { name: 'Goals',          desc: 'Long-term targets with deadlines and categories. Link tasks and habits to a goal and its progress computes itself from the work you are already doing.' },
  { name: 'Fapless',        desc: 'A discipline streak engine with ten identity levels from Novice to Legend. Milestone bonuses, 30-day and 90-day protocols, an urge SOS panel, and a relapse log that asks why — so the pattern becomes visible.' },
  { name: 'Speak',          desc: 'Voice and communication training in 15, 30 or 60-minute guided sessions. Breathing pacer, SOVT hums, neck release, tongue twister ladders, style-shifting read-alouds and an on-camera studio with the PREP impromptu framework.' },
  { name: 'Coach',          desc: 'The AI layer that ties it together. Ask “plan my week” and Coach proposes concrete tasks, habits and goals as review cards — apply them with one tap, edit them first, or discard them.' },
  { name: 'Social',         desc: 'Opt-in only. Public profiles, a global leaderboard ranked by streak, a follow system and a forum where every message auto-deletes after 48 hours.' },
]

/* ── Page shell ─────────────────────────────────────────────── */
function SubPage({ page, theme, setTheme, onHome }) {
  useEffect(() => {
    document.title = `${page.title} — MindForm`
    document.documentElement.setAttribute('data-theme', theme || 'dark')
    return () => { document.title = 'MindForm — Habit Tracker, Task Planner & Voice Training' }
  }, [page, theme])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--lp-canvas)', display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 20,
        background: 'color-mix(in srgb, var(--lp-canvas) 82%, transparent)',
        backdropFilter: 'saturate(180%) blur(20px)', WebkitBackdropFilter: 'saturate(180%) blur(20px)',
        borderBottom: '1px solid var(--lp-hairline)',
      }}>
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '14px clamp(20px, 5vw, 40px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={onHome} className="lp-link" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14 }}>
            <ArrowLeft size={15} /> MindForm
          </button>
          <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="lp-fine" style={{ background: 'none', border: '1px solid var(--lp-hairline)', borderRadius: 980, padding: '6px 14px', cursor: 'pointer', color: 'var(--lp-ink-2)' }}>
            {theme === 'dark' ? 'Light' : 'Dark'}
          </button>
        </div>
      </header>

      {/* Hero */}
      <section style={{ maxWidth: 760, width: '100%', margin: '0 auto', padding: 'clamp(48px, 8vw, 80px) clamp(20px, 5vw, 40px) 8px' }}>
        <page.icon size={30} strokeWidth={1.5} style={{ color: 'var(--lp-accent)', marginBottom: 18 }} />
        <h1 className="lp-display" style={{ fontSize: 'clamp(32px, 5vw, 48px)', marginBottom: 14 }}>{page.title}</h1>
        <p className="lp-lead" style={{ color: 'var(--lp-ink-3)' }}>{page.desc}</p>
      </section>

      {/* Body */}
      <main style={{ maxWidth: 760, width: '100%', margin: '0 auto', padding: '24px clamp(20px, 5vw, 40px) 80px', flex: 1 }}>
        {page.path === '/faq' && <FaqBody />}
        {page.path === '/privacy' && <LegalBody kind="privacy" />}
        {page.path === '/terms' && <LegalBody kind="terms" />}
        {page.path === '/how-it-works' && <HowBody />}
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--lp-hairline)', background: 'var(--lp-parchment)' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '26px clamp(20px, 5vw, 40px)' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18, marginBottom: 14 }}>
            {SUB_PAGES.map(p => (
              <button key={p.path} onClick={() => onNavigate(p.path)} className="lp-fine"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--lp-ink-2)', padding: 0 }}>
                {p.title}
              </button>
            ))}
          </div>
          <div className="lp-fine" style={{ color: 'var(--lp-ink-3)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <span>© 2026 MindForm. All rights reserved.</span>
            <button onClick={onHome} className="lp-link" style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
              Back to MindForm <ChevronRight size={12} />
            </button>
          </div>
        </div>
      </footer>
    </div>
  )

  function onNavigate(p) {
    if (p === page.path) return
    window.history.pushState({}, '', p)
    // App.jsx listens to popstate only; nudge it with a custom event
    window.dispatchEvent(new PopStateEvent('popstate'))
  }
}

/* ── Section primitives ─────────────────────────────────────── */
function H2({ children }) {
  return <h2 className="lp-h2" style={{ fontSize: 'clamp(24px, 3.4vw, 32px)', margin: '44px 0 12px' }}>{children}</h2>
}
function P({ children }) {
  return <p className="lp-body" style={{ color: 'var(--lp-ink-2)', marginBottom: 12 }}>{children}</p>
}

function FaqBody() {
  const firstHalf = FAQS.slice(0, 6)
  const secondHalf = FAQS.slice(6)
  return (
    <div style={{ borderTop: '1px solid var(--lp-hairline)', marginTop: 28 }}>
      {firstHalf.map(f => <FaqItem key={f.q} f={f} />)}
      <H2>About the product</H2>
      <div style={{ borderTop: '1px solid var(--lp-hairline)' }}>
        {secondHalf.map(f => <FaqItem key={f.q} f={f} />)}
      </div>
    </div>
  )
}
function FaqItem({ f }) {
  return (
    <details style={{ borderBottom: '1px solid var(--lp-hairline)' }}>
      <summary style={{
        listStyle: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', gap: 16, padding: '18px 4px',
        fontSize: 17, fontWeight: 500, color: 'var(--lp-ink)',
      }}>
        {f.q}
        <ChevronRight size={16} style={{ flexShrink: 0, color: 'var(--lp-ink-3)', transform: 'rotate(90deg)', transition: 'transform 0.25s' }} className="lp-faq-chevron" />
      </summary>
      <p className="lp-body" style={{ color: 'var(--lp-ink-3)', padding: '0 4px 20px', margin: 0 }}>{f.a}</p>
    </details>
  )
}

function LegalBody({ kind }) {
  const updated = 'November 13, 2026'
  if (kind === 'privacy') {
    return (
      <div style={{ marginTop: 8 }}>
        <P>Last updated {updated}. MindForm is built to know as little about you as possible. This policy explains exactly what is stored and why.</P>
        <H2>What we store</H2>
        <P>Your account holds an email address, a display name and a bcrypt-hashed password. Your content — tasks, habits, goals, streak history and optional Speak session logs — is stored in your account and scoped to your user ID. That is the whole list.</P>
        <H2>What we never see</H2>
        <P>AI keys you add for Coach live in your browser’s local storage and are never persisted server-side. Speak camera recordings are processed by your browser and never leave your device. We do not run advertising trackers, and we do not sell data.</P>
        <H2>Auto-deletion</H2>
        <P>AI chat history is deleted every 24 hours. Community forum messages are deleted every 48 hours. Your productivity data is kept until you delete it — CSV export is available at any time from the manage views.</P>
        <H2>Community</H2>
        <P>Profiles are private by default. Appearing on the leaderboard or forum requires you to opt in, and you can go back to private whenever you like.</P>
        <H2>Contact</H2>
        <P>Questions about this policy? Open an issue in the repository or reach the team through the app’s feedback link.</P>
      </div>
    )
  }
  return (
    <div style={{ marginTop: 8 }}>
      <P>Last updated {updated}. By using MindForm you agree to the terms below. They are deliberately short.</P>
      <H2>The service</H2>
      <P>MindForm is a free, open-source productivity dashboard provided as-is. We aim for high availability but do not guarantee uninterrupted service, and we may change or discontinue features.</P>
      <H2>Your account</H2>
      <P>You are responsible for the activity on your account and for keeping your credentials safe. Disposable email providers are blocked; automated abuse is rate-limited and honeypotted.</P>
      <H2>Your content</H2>
      <P>Your tasks, habits and goals are yours. Export them at any time. Do not use MindForm to store unlawful content, and do not use the community features to harass others.</P>
      <H2>AI features</H2>
      <P>Coach is powered by third-party AI providers using your own API key. AI output can be wrong — review every proposed change before applying it. MindForm is not responsible for decisions made on AI advice.</P>
      <H2>Health disclaimer</H2>
      <P>Speak provides general voice exercises for informational purposes and is not medical advice. If you experience pain or a voice condition, consult a qualified professional first.</P>
      <H2>License</H2>
      <P>The source code is released under its repository license. You may self-host it for personal or internal use under those terms.</P>
    </div>
  )
}

function HowBody() {
  const STEPS = [
    { n: '1', name: 'Breathe',    drill: 'Diaphragm Breathing (4–2–6)',  min: 2, desc: 'Paced inhale–hold–exhale breathing that lowers your breath and steadies your voice.' },
    { n: '2', name: 'Warm up',    drill: 'SOVT Hum & Lip Trills',        min: 3, desc: 'Semi-occluded hums and trills that warm the vocal folds without strain.' },
    { n: '3', name: 'Release',    drill: 'Neck Release + Long Vowels',   min: 2, desc: 'Behind-the-neck stretches while sustaining vowels to free built-up tension.' },
    { n: '4', name: 'Articulate', drill: 'Tongue Twister Ladder',        min: 4, desc: 'English twisters climbed at bronze, silver and gold speeds for crisp speech.' },
    { n: '5', name: 'Read',       drill: 'Style-Shifting Read-aloud',    min: 3, desc: 'One passage, six styles — building flexible, expressive delivery.' },
    { n: '6', name: 'Perform',    drill: 'Camera Studio (PREP)',         min: 1, desc: 'Impromptu speaking on a random topic — recorded locally, never uploaded.' },
  ]
  return (
    <div style={{ marginTop: 8 }}>
      <P>MindForm turns discipline into a system you can see. Here is how the pieces fit together.</P>
      <H2>The daily loop</H2>
      <P>Start in Task Tracker: schedule your day to the minute, then check tasks off as the day unfolds. In Habit Tracker, a 30-day grid keeps every streak visible — mood and motivation sit right next to it, so you learn what a good day actually looks like for you. Goals connect the two: link tasks and habits to a goal and progress is computed from the work you are already doing.</P>
      <H2>The discipline engine</H2>
      <P>Fapless wraps everything in a streak with real stakes: ten identity levels, milestone bonuses, 30-day and 90-day protocols, and an SOS panel for hard moments. When you slip, the relapse log asks why — the answer matters more than the counter.</P>
      <H2>Coach, your AI copilot</H2>
      <P>Coach reads your tasks, habits, goals and streak, then proposes concrete changes: this week’s tasks, a habit replan, a 90-day goal with a deadline. Every proposal arrives as a review card — tap Apply and it lands in the right module, or discard it. Nothing changes without you.</P>
      <H2>The 15-minute Speak session</H2>
      <P>Speak is a daily voice gym. The 15-minute routine moves through six steps, each grounded in published voice research:</P>
      <div style={{ display: 'grid', gap: 12, margin: '20px 0 8px' }}>
        {STEPS.map(s => (
          <div key={s.n} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', background: 'var(--lp-card-bg)', border: '1px solid var(--lp-hairline)', borderRadius: 16, padding: '16px 18px' }}>
            <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--lp-accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, flexShrink: 0 }}>{s.n}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--lp-ink)' }}>{s.name}</span>
                <span className="lp-caption" style={{ fontSize: 12, color: 'var(--lp-ink-3)' }}>{s.min} min</span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--lp-accent)', margin: '2px 0' }}>{s.drill}</div>
              <div className="lp-body" style={{ fontSize: 14, color: 'var(--lp-ink-3)', margin: 0 }}>{s.desc}</div>
            </div>
          </div>
        ))}
      </div>
      <P>Thirty-minute and one-hour routines add an obstacle course (pen-in-mouth and over-tongue drills) and a pace-and-pause trainer. Self-hosting your own copy? Clone the repository, set a MongoDB URI and JWT secret, and run the backend — it serves the built frontend out of the box.</P>
    </div>
  )
}

export default SubPage
