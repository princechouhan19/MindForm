import React, { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ToastProvider } from './components/Toast'
import { ConfirmProvider } from './components/ConfirmDialog'
import Onboarding from './components/Onboarding'
import Sidebar from './components/Sidebar'
import OverviewView from './views/OverviewView'
import TaskTracker from './views/TaskTracker'
import HabitTracker from './views/HabitTracker'
import GoalsView from './views/GoalsView'
import FaplessView from './views/FaplessView'
import VoiceCoachView from './views/VoiceCoachView'
import SettingsView from './views/SettingsView'
import AIChatView from './views/AIChatView'
import SocialView from './views/SocialView'
import AuthPage from './views/AuthPage'
import LandingPage from './views/LandingPage'
import ErrorPage from './views/ErrorPage'
import ErrorBoundary from './components/ErrorBoundary'
import {
  Loader, CheckSquare, Activity, Target, Flame, Settings, Sparkles, Users2, Home, MoreHorizontal, LayoutGrid, Mic,
} from 'lucide-react'

const NAV_ITEMS = [
  { id: 'overview', label: 'Today',    icon: Home,        color: 'var(--brand-primary)' },
  { id: 'tasks',    label: 'Tasks',    icon: CheckSquare, color: 'var(--cyan)' },
  { id: 'habits',   label: 'Habits',   icon: Activity,    color: 'var(--amber)' },
  { id: 'goals',    label: 'Goals',    icon: Target,      color: 'var(--brand-secondary)' },
  { id: 'fapless',  label: 'Fapless',  icon: Flame,       color: 'var(--red)' },
  { id: 'voice',    label: 'Speak',    icon: Mic,         color: 'var(--brand-teal)', badge: 'NEW' },
  { id: 'social',   label: 'Social',   icon: Users2,      color: 'var(--pink)' },
  { id: 'ai',       label: 'AI Coach', icon: Sparkles,    color: 'var(--purple)' },
  { id: 'settings', label: 'Settings', icon: Settings,    color: 'var(--text-secondary)' },
]

/* Mobile bottom nav — max 5 tabs (HIG). Overflow lives in a "More" sheet. */
const MOBILE_TABS = ['overview', 'tasks', 'habits', 'goals', 'more']
const MORE_SHEET_ITEMS = ['fapless', 'voice', 'social', 'ai', 'settings']

function Dashboard() {
  const { user, loading } = useAuth()
  const [page, setPage] = useState(() => {
    const path = (window.location.pathname || '').toLowerCase()
    if (path === '/404') return '404'
    if (path === '/500' || path === '/error') return '500'
    const known = ['/', '', '/auth', '/login', '/register', '/dashboard']
    if (!known.includes(path) && !path.startsWith('/api')) {
      return '404'
    }
    return 'landing'
  })
  const [authMode, setAuthMode] = useState('login') // 'login' | 'register'
  const [view, setView] = useState('overview')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  const [showOnboarding, setShowOnboarding] = useState(false)

  const handleOpenAuth = (mode = 'login') => {
    setAuthMode(mode)
    setPage('auth')
  }

  const goHome = () => {
    window.history.pushState(null, '', '/')
    if (user) setPage('dashboard')
    else setPage('landing')
  }

  // Handle browser back/forward and path events
  useEffect(() => {
    const handlePopState = () => {
      const path = (window.location.pathname || '').toLowerCase()
      if (path === '/404') setPage('404')
      else if (path === '/500' || path === '/error') setPage('500')
      else if (path === '/auth' || path === '/login') { setAuthMode('login'); setPage('auth') }
      else if (path === '/register') { setAuthMode('register'); setPage('auth') }
      else if (user) setPage('dashboard')
      else setPage('landing')
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [user])

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('mindform-theme') || 'dark'
  })

  // Once user logs in, jump to dashboard
  useEffect(() => {
    if (user) setPage('dashboard')
  }, [user])

  // First-visit onboarding (per account)
  useEffect(() => {
    if (user?.id && !localStorage.getItem('mf_onboarded_' + user.id)) {
      setShowOnboarding(true)
    }
  }, [user])

  // Sync theme to root class/attribute
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('mindform-theme', theme)
  }, [theme])

  // Detect screen size
  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth <= 768
      setIsMobile(mobile)
      if (!mobile) setSidebarOpen(true)
      else setSidebarOpen(false)
    }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Close sidebar when navigating on mobile
  const handleNavChange = (id) => {
    if (id === 'more') { setMoreOpen(true); return }
    setView(id)
    setMoreOpen(false)
    if (isMobile) setSidebarOpen(false)
  }

  const finishOnboarding = () => {
    localStorage.setItem('mf_onboarded_' + user?.id, 'true')
    setShowOnboarding(false)
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <div style={{
          width: 54, height: 54, borderRadius: 16,
          background: 'linear-gradient(135deg, rgba(79, 142, 247, 0.2), rgba(167, 139, 250, 0.2))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '1px solid var(--border)',
        }}>
          <img src="/logo.png" alt="MindForm" style={{ width: 34, height: 34, borderRadius: 10, objectFit: 'contain' }} />
        </div>
        <Loader size={20} style={{ animation: 'spin 1s linear infinite', color: 'var(--brand-primary)' }} />
      </div>
    )
  }

  // ── Error Pages ──────────────────────────────────
  if (page === '404') {
    return <ErrorPage code={404} onHome={goHome} onBack={goHome} />
  }

  if (page === '500') {
    return <ErrorPage code={500} onHome={goHome} onRetry={() => window.location.reload()} onBack={goHome} />
  }

  // ── Landing Page ──────────────────────────────────
  if (page === 'landing') {
    return <LandingPage onGetStarted={handleOpenAuth} theme={theme} setTheme={setTheme} />
  }

  // ── Auth Page (not logged in) ─────────────────────
  if (!user) {
    return <AuthPage initialMode={authMode} onBack={() => setPage('landing')} />
  }

  // ── Dashboard ─────────────────────────────────────
  const renderView = () => {
    if (view === 'overview') return <OverviewView onNavigate={handleNavChange} />
    if (view === 'tasks')    return <TaskTracker />
    if (view === 'habits')   return <HabitTracker />
    if (view === 'goals')    return <GoalsView />
    if (view === 'fapless')  return <FaplessView />
    if (view === 'voice')    return <VoiceCoachView />
    if (view === 'social')   return <SocialView />
    if (view === 'ai')       return <AIChatView />
    if (view === 'settings') return <SettingsView theme={theme} setTheme={setTheme} />
    return <OverviewView onNavigate={handleNavChange} />
  }

  const activeMeta = NAV_ITEMS.find(n => n.id === view)

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-app)', position: 'relative' }}>
      {/* Ambient aura glow */}
      <div className="mf-ambient-glow" />

      {/* Desktop sidebar */}
      <Sidebar
        activeTab={view}
        setActiveTab={handleNavChange}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        theme={theme}
        setTheme={setTheme}
      />

      {/* Main view container */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          position: 'relative',
          paddingBottom: isMobile ? 88 : 0,
        }}
      >
        {/* Mobile top bar */}
        {isMobile && (
          <div
            style={{
              position: 'sticky', top: 0, zIndex: 40,
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 16px',
              background: 'var(--bg-card)',
              backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
              borderBottom: '1px solid var(--border)',
            }}
          >
            <button
              aria-label="Open navigation menu"
              onClick={() => setSidebarOpen(o => !o)}
              style={{ background: 'var(--bg-glass)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 8, borderRadius: 10, border: '1px solid var(--border)', minHeight: 36, minWidth: 36 }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
            <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.01em', fontFamily: 'var(--font-display)' }}>
              {activeMeta?.label || 'MindForm'}
            </span>
          </div>
        )}

        <div key={view} className="animate-in" style={{ flex: 1, overflow: 'hidden' }}>
          {renderView()}
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="mobile-bottom-nav" aria-label="Primary">
        {MOBILE_TABS.map(id => {
          if (id === 'more') {
            const moreActive = MORE_SHEET_ITEMS.includes(view)
            return (
              <button
                key="more"
                onClick={() => handleNavChange('more')}
                className={`mobile-nav-btn ${moreActive ? 'active' : ''}`}
                style={moreActive ? { color: 'var(--brand-primary)' } : {}}
                aria-label="More sections"
              >
                <MoreHorizontal size={21} />
                <span>More</span>
              </button>
            )
          }
          const { label, icon: Icon } = NAV_ITEMS.find(n => n.id === id)
          return (
            <button
              key={id}
              onClick={() => handleNavChange(id)}
              className={`mobile-nav-btn ${view === id ? 'active' : ''}`}
              aria-current={view === id ? 'page' : undefined}
            >
              <Icon size={21} />
              <span>{label}</span>
            </button>
          )
        })}
      </nav>

      {/* More sheet (mobile) */}
      {moreOpen && (
        <div
          onClick={() => setMoreOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 60,
            background: 'rgba(0,0,0,0.45)',
            backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: 16,
          }}
        >
          <div
            role="dialog" aria-modal="true" aria-label="More sections"
            onClick={e => e.stopPropagation()}
            className="mf-sheet"
            style={{ width: 'min(94vw, 420px)', padding: 10, marginBottom: 8 }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '10px 12px 6px' }}>
              More modules
            </div>
            {MORE_SHEET_ITEMS.map((id, i) => {
              const { label, icon: Icon, color } = NAV_ITEMS.find(n => n.id === id)
              return (
                <button
                  key={id}
                  onClick={() => handleNavChange(id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14, width: '100%',
                    padding: '13px 14px', background: 'none',
                    borderBottom: i < MORE_SHEET_ITEMS.length - 1 ? '1px solid var(--border)' : 'none',
                    borderRadius: 10, color: 'var(--text-primary)', fontSize: 16, fontWeight: 600,
                    cursor: 'pointer', textAlign: 'left', minHeight: 52, fontFamily: 'var(--font-body)',
                  }}
                >
                  <div style={{
                    width: 34, height: 34, borderRadius: 10,
                    background: `color-mix(in srgb, ${color} 13%, transparent)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon size={17} style={{ color }} />
                  </div>
                  {label}
                  {view === id && <span style={{ marginLeft: 'auto', width: 7, height: 7, borderRadius: '50%', background: 'var(--brand-primary)' }} />}
                </button>
              )
            })}
            <div style={{ height: 4 }} />
          </div>
        </div>
      )}

      {/* First-visit onboarding */}
      {showOnboarding && <Onboarding onDone={finishOnboarding} />}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <ConfirmProvider>
          <AuthProvider>
            <Dashboard />
          </AuthProvider>
        </ConfirmProvider>
      </ToastProvider>
    </ErrorBoundary>
  )
}
