import React from 'react'
import {
  CheckSquare, Activity, Target, Settings, LogOut, User, PanelLeftClose,
  PanelLeftOpen, Flame, Sparkles, Users2, Sun, Moon, Home, Mic,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { id: 'overview', label: 'Today',    icon: Home,        color: 'var(--brand-primary)' },
  { id: 'tasks',    label: 'Tasks',    icon: CheckSquare, color: 'var(--cyan)' },
  { id: 'habits',   label: 'Habits',   icon: Activity,    color: 'var(--amber)' },
  { id: 'goals',    label: 'Goals',    icon: Target,      color: 'var(--brand-secondary)' },
  { id: 'fapless',  label: 'Fapless',  icon: Flame,       color: 'var(--red)' },
  { id: 'voice',    label: 'Speak',    icon: Mic,         color: 'var(--brand-teal)', badge: 'NEW' },
  { id: 'social',   label: 'Social',   icon: Users2,      color: 'var(--pink)', badge: 'NEW' },
  { id: 'ai',       label: 'AI Coach', icon: Sparkles,    color: 'var(--purple)' },
  { id: 'settings', label: 'Settings', icon: Settings,    color: 'var(--text-secondary)' },
]

export default function Sidebar({ active, onChange, isOpen, onToggle, isMobile, theme, setTheme }) {
  const { user, logout } = useAuth()

  return (
    <aside style={{
      width: isMobile ? '250px' : (isOpen ? 'var(--sidebar-width)' : '72px'),
      height: '100vh',
      background: 'var(--bg-surface)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      transition: 'width 0.35s var(--ease-out-expo), background 0.35s var(--ease-in-out)',
      overflow: 'hidden',
      zIndex: 100,
    }}>
      {/* Logo + Toggle */}
      <div style={{ padding: '20px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: isOpen ? 'space-between' : 'center', gap: 12, minHeight: 76 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, overflow: 'hidden' }}>
          <img src="/logo.png" alt="MindForm" style={{ width: 38, height: 38, borderRadius: 10, objectFit: 'contain', flexShrink: 0 }} />
          {isOpen && (
            <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.15, fontFamily: 'var(--font-display)', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
              MindForm
              <div style={{ fontSize: 9.5, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Productivity</div>
            </div>
          )}
        </div>
        {isOpen && !isMobile && (
          <button onClick={onToggle} title="Collapse" aria-label="Collapse sidebar" style={{ background: 'var(--bg-glass)', color: 'var(--text-muted)', display: 'flex', padding: 8, borderRadius: 9, flexShrink: 0, transition: 'all 0.2s', minHeight: 32, minWidth: 32 }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'var(--bg-glass-hover)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'var(--bg-glass)' }}>
            <PanelLeftClose size={15} />
          </button>
        )}
      </div>

      {/* Toggle button when closed */}
      {!isOpen && !isMobile && (
        <div style={{ padding: '14px 0', display: 'flex', justifyContent: 'center', borderBottom: '1px solid var(--border)' }}>
          <button onClick={onToggle} title="Expand" aria-label="Expand sidebar" style={{ background: 'none', color: 'var(--text-muted)', display: 'flex', padding: 9, borderRadius: 9, transition: 'all 0.2s', minHeight: 36, minWidth: 36 }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--brand-primary)'; e.currentTarget.style.background = 'var(--brand-primary-dim)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'none' }}>
            <PanelLeftOpen size={17} />
          </button>
        </div>
      )}

      {/* Nav */}
      <nav style={{ padding: isOpen ? '18px 12px' : '18px 8px', flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        {isOpen && <div style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.1em', padding: '0 10px', marginBottom: 10, fontFamily: 'var(--font-body)', textTransform: 'uppercase' }}>Modules</div>}
        {navItems.map(({ id, label, icon: Icon, color, badge }) => {
          const isActive = active === id
          return (
            <button key={id} onClick={() => onChange(id)} title={!isOpen ? label : undefined}
              aria-current={isActive ? 'page' : undefined}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: isOpen ? 12 : 0,
                justifyContent: isOpen ? 'flex-start' : 'center',
                padding: isOpen ? '11px 12px' : '12px 0',
                borderRadius: 'var(--radius-md)',
                background: isActive ? 'var(--brand-primary-dim)' : 'transparent',
                border: '1px solid transparent',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontSize: 14.5,
                fontWeight: isActive ? 600 : 500,
                cursor: 'pointer',
                transition: 'background 0.25s var(--ease-out-expo), color 0.2s',
                marginBottom: 4,
                textAlign: 'left',
                fontFamily: 'var(--font-body)',
                position: 'relative',
                minHeight: 44,
              }}
              onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'var(--bg-glass)'; e.currentTarget.style.color = 'var(--text-primary)' } }}
              onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)' } }}>
              <Icon size={18} style={{ color: isActive ? color : 'inherit', transition: 'color 0.25s', flexShrink: 0 }} />
              {isOpen && (
                <>
                  <span style={{ flex: 1 }}>{label}</span>
                  {badge && (
                    <span style={{
                      fontSize: 9,
                      fontWeight: 600,
                      letterSpacing: '0.04em',
                      background: `color-mix(in srgb, ${color} 14%, transparent)`,
                      color,
                      border: `1px solid color-mix(in srgb, ${color} 30%, transparent)`,
                      borderRadius: 5,
                      padding: '2px 7px',
                      fontFamily: 'var(--font-body)'
                    }}>{badge}</span>
                  )}
                  {isActive && <div style={{ width: 5, height: 5, borderRadius: '50%', background: color }} />}
                </>
              )}
              {!isOpen && isActive && <div style={{ position: 'absolute', right: 0, top: '25%', bottom: '25%', width: 3, background: color, borderRadius: '2px 0 0 2px' }} />}
            </button>
          )
        })}
      </nav>

      {/* User & Logout */}
      <div style={{ borderTop: '1px solid var(--border)', padding: isOpen ? '14px' : '14px 8px' }}>
        {/* Theme Toggle Button */}
        <button onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isOpen ? 'flex-start' : 'center',
            gap: 10,
            padding: isOpen ? '10px 12px' : '12px 0',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-glass)',
            border: '1px solid var(--border)',
            color: 'var(--text-secondary)',
            fontSize: 13.5,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.25s var(--ease-out-expo)',
            fontFamily: 'var(--font-body)',
            marginBottom: 10,
            minHeight: 44,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-glass-hover)'; e.currentTarget.style.color = 'var(--text-primary)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-glass)'; e.currentTarget.style.color = 'var(--text-secondary)' }}>
          {theme === 'dark' ? <Sun size={15} color="var(--brand-primary)" /> : <Moon size={15} color="var(--brand-primary)" />}
          {isOpen && (theme === 'dark' ? 'Light Mode' : 'Dark Mode')}
        </button>

        {user && isOpen && (
          <div style={{ padding: '11px 12px', background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--brand-primary-dim)', border: '1px solid var(--brand-primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <User size={14} color="var(--brand-primary)" />
              </div>
              <div style={{ overflow: 'hidden', flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: 'var(--font-body)' }}>{user.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: 'var(--font-body)' }}>{user.email}</div>
              </div>
            </div>
          </div>
        )}
        <button onClick={logout} title={!isOpen ? 'Sign out' : undefined}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isOpen ? 'flex-start' : 'center',
            gap: 10,
            padding: isOpen ? '10px 12px' : '12px 0',
            borderRadius: 'var(--radius-md)',
            background: 'none',
            border: '1px solid transparent',
            color: 'var(--text-muted)',
            fontSize: 13.5,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.25s var(--ease-out-expo)',
            fontFamily: 'var(--font-body)',
            minHeight: 44,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--red-dim)'; e.currentTarget.style.color = 'var(--red)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-muted)' }}>
          <LogOut size={15} /> {isOpen && 'Sign out'}
        </button>
      </div>
    </aside>
  )
}
