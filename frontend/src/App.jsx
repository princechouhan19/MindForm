import React, { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import Sidebar from './components/Sidebar'
import TaskTracker from './views/TaskTracker'
import HabitTracker from './views/HabitTracker'
import GoalsView from './views/GoalsView'
import FaplessView from './views/FaplessView'
import SettingsView from './views/SettingsView'
import AIChatView from './views/AIChatView'
import SocialView from './views/SocialView'
import AuthPage from './views/AuthPage'
import LandingPage from './views/LandingPage'
import { Loader, CheckSquare, Activity, Target, Flame, Settings, Sparkles, Users2 } from 'lucide-react'

const NAV_ITEMS = [
  { id: 'tasks',    label: 'Tasks',   icon: CheckSquare, color: 'var(--cyan)' },
  { id: 'habits',   label: 'Habits',  icon: Activity,    color: 'var(--amber)' },
  { id: 'goals',    label: 'Goals',   icon: Target,      color: 'var(--green)' },
  { id: 'fapless',  label: 'Fapless', icon: Flame,       color: '#ff4500' },
  { id: 'social',   label: 'Social',  icon: Users2,      color: '#f472b6' },
  { id: 'ai',       label: 'AI Chat', icon: Sparkles,    color: '#a78bfa' },
  { id: 'settings', label: 'Settings',icon: Settings,    color: 'var(--text-secondary)' },
]

function Dashboard() {
  const { user, loading } = useAuth()
  const [page, setPage] = useState('landing') // 'landing' | 'auth' | 'dashboard'
  const [view, setView] = useState('tasks')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('mindform-theme') || 'dark'
  })

  // Once user logs in, jump to dashboard
  useEffect(() => {
    if (user) setPage('dashboard')
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
    setView(id)
    if (isMobile) setSidebarOpen(false)
  }

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)', gap: 10, color: 'var(--text-secondary)' }}>
        <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} />
        <span style={{ fontSize: 14 }}>Loading...</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  // ── Landing Page ──────────────────────────────────
  if (page === 'landing') {
    return <LandingPage onGetStarted={() => setPage('auth')} theme={theme} setTheme={setTheme} />
  }

  // ── Auth Page (not logged in) ─────────────────────
  if (!user) {
    return <AuthPage onBack={() => setPage('landing')} />
  }

  // ── Dashboard ─────────────────────────────────────
  const renderView = () => {
    if (view === 'habits')   return <HabitTracker />
    if (view === 'goals')    return <GoalsView />
    if (view === 'fapless')  return <FaplessView />
    if (view === 'social')   return <SocialView />
    if (view === 'ai')       return <AIChatView />
    if (view === 'settings') return <SettingsView theme={theme} setTheme={setTheme} />
    return <TaskTracker />
  }

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', position: 'relative' }}>

      {/* Mobile overlay backdrop */}
      <div
        className={`sidebar-overlay ${isMobile && sidebarOpen ? 'overlay-active' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <div className={`sidebar-desktop ${sidebarOpen ? 'sidebar-open' : ''}`}
        style={{ flexShrink: 0, height: '100vh' }}>
        <Sidebar
          active={view}
          onChange={handleNavChange}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(o => !o)}
          isMobile={isMobile}
          theme={theme}
          setTheme={setTheme}
        />
      </div>

      {/* Main content */}
      <main
        className="main-content"
        style={{
          flex: 1,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-base)',
          transition: 'all 0.25s ease',
          minWidth: 0,
        }}
      >
        {/* Mobile top bar with hamburger */}
        {isMobile && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 14px', borderBottom: '1px solid var(--border)',
            background: 'var(--bg-surface)', flexShrink: 0,
          }}>
            <button
              onClick={() => setSidebarOpen(o => !o)}
              style={{ background: 'none', color: 'var(--text-secondary)', display: 'flex', padding: 6, borderRadius: 8, border: '1px solid var(--border)' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
            <span style={{ fontSize: 15, fontWeight: 700 }}>
              {NAV_ITEMS.find(n => n.id === view)?.label || 'MindForm'}
            </span>
          </div>
        )}

        <div key={view} className="animate-in" style={{ flex: 1, overflow: 'hidden' }}>
          {renderView()}
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="mobile-bottom-nav">
        {NAV_ITEMS.map(({ id, label, icon: Icon, color }) => (
          <button
            key={id}
            onClick={() => handleNavChange(id)}
            className={`mobile-nav-btn ${view === id ? 'active' : ''}`}
            style={view === id ? { color, background: color + '18' } : {}}
          >
            <Icon size={20} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Dashboard />
    </AuthProvider>
  )
}
