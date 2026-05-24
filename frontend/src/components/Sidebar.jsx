import React from 'react'
import { CheckSquare, Activity, Target, Settings, LogOut, User, PanelLeftClose, PanelLeftOpen, Flame, Sparkles, Users2, Sun, Moon } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { id: 'tasks',    label: 'Tasks',         icon: CheckSquare, color: 'var(--brand-primary)' },
  { id: 'habits',   label: 'Habits',        icon: Activity,    color: 'var(--amber)' },
  { id: 'goals',    label: 'Goals',         icon: Target,      color: 'var(--brand-success)' },
  { id: 'fapless',  label: 'Fapless',       icon: Flame,       color: 'var(--brand-accent)' },
  { id: 'social',   label: 'Social',        icon: Users2,      color: 'var(--brand-secondary)', badge: 'NEW' },
  { id: 'ai',       label: 'AI Chat',       icon: Sparkles,    color: '#a78bfa', badge: 'AI' },
  { id: 'settings', label: 'Settings',      icon: Settings,    color: 'var(--text-secondary)' },
]

export default function Sidebar({ active, onChange, isOpen, onToggle, isMobile, theme, setTheme }) {
  const { user, logout } = useAuth()

  return (
    <aside style={{
      width: isMobile ? '240px' : (isOpen ? 'var(--sidebar-width)' : '72px'),
      height: '100vh',
      background: 'var(--bg-surface)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      transition: 'width 0.4s var(--ease-out-expo)',
      overflow: 'hidden',
      zIndex: 100,
    }}>
      {/* Logo + Toggle */}
      <div style={{ padding: '24px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: isOpen ? 'space-between' : 'center', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, overflow: 'hidden' }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <img src="/logo.png" alt="Mind Form" style={{ width: 40, height: 40, borderRadius: 10, objectFit: 'contain' }} />
            <div style={{ position: 'absolute', inset: -2, border: '1px solid var(--brand-primary-glow)', borderRadius: 12, pointerEvents: 'none' }} />
          </div>
          {isOpen && (
            <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: '0.04em', lineHeight: 1.1, fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
              <div>MIND</div>
              <div style={{ color: 'var(--brand-primary)' }}>FORM</div>
            </div>
          )}
        </div>
        {isOpen && (
          <button onClick={onToggle} title="Collapse" style={{ background: 'var(--bg-glass)', color: 'var(--text-muted)', display: 'flex', padding: 6, borderRadius: 8, flexShrink: 0, transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'var(--bg-glass-hover)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'var(--bg-glass)' }}>
            <PanelLeftClose size={14} />
          </button>
        )}
      </div>

      {/* Toggle button when closed */}
      {!isOpen && (
        <div style={{ padding: '16px 0', display: 'flex', justifyContent: 'center', borderBottom: '1px solid var(--border)' }}>
          <button onClick={onToggle} title="Expand" style={{ background: 'none', color: 'var(--text-muted)', display: 'flex', padding: 8, borderRadius: 8, transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--brand-primary)'; e.currentTarget.style.background = 'var(--brand-primary-dim)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'none' }}>
            <PanelLeftOpen size={18} />
          </button>
        </div>
      )}

      {/* Nav */}
      <nav style={{ padding: isOpen ? '20px 12px' : '20px 8px', flex: 1, overflowY: 'auto', overflowX: 'hidden' }} className="lp-noise">
        {isOpen && <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.15em', padding: '0 8px', marginBottom: 12, fontFamily: 'var(--font-mono)' }}>MODULES</div>}
        {navItems.map(({ id, label, icon: Icon, color, badge }) => {
          const isActive = active === id
          return (
            <button key={id} onClick={() => onChange(id)} title={!isOpen ? label : undefined}
              style={{ 
                width: '100%', 
                display: 'flex', 
                alignItems: 'center', 
                gap: isOpen ? 12 : 0, 
                justifyContent: isOpen ? 'flex-start' : 'center', 
                padding: isOpen ? '12px 12px' : '12px 0', 
                borderRadius: 'var(--radius-md)', 
                background: isActive ? 'var(--bg-glass-hover)' : 'transparent', 
                border: '1px solid transparent',
                borderColor: isActive ? 'var(--border-bright)' : 'transparent',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)', 
                fontSize: 14, 
                fontWeight: isActive ? 600 : 500, 
                cursor: 'pointer', 
                transition: 'all 0.3s var(--ease-out-expo)', 
                marginBottom: 6, 
                textAlign: 'left', 
                fontFamily: 'var(--font-body)',
                position: 'relative',
              }}
              onMouseEnter={e => { 
                if (!isActive) { 
                  e.currentTarget.style.background = 'var(--bg-glass)'; 
                  e.currentTarget.style.color = 'var(--text-primary)';
                  e.currentTarget.style.transform = 'translateX(4px)';
                } 
              }}
              onMouseLeave={e => { 
                if (!isActive) { 
                  e.currentTarget.style.background = 'transparent'; 
                  e.currentTarget.style.color = 'var(--text-secondary)';
                  e.currentTarget.style.transform = 'translateX(0)';
                } 
              }}>
              <Icon size={18} style={{ color: isActive ? color : 'inherit', transition: 'color 0.3s' }} />
              {isOpen && (
                <>
                  <span style={{ flex: 1 }}>{label}</span>
                  {badge && (
                    <span style={{ 
                      fontSize: 9, 
                      fontWeight: 800, 
                      letterSpacing: '0.05em', 
                      background: color + '15', 
                      color, 
                      border: `1px solid ${color}33`, 
                      borderRadius: 4, 
                      padding: '2px 6px',
                      fontFamily: 'var(--font-mono)'
                    }}>{badge}</span>
                  )}
                  {isActive && <div style={{ width: 4, height: 4, borderRadius: '50%', background: color, boxShadow: `0 0 10px ${color}` }} />}
                </>
              )}
              {!isOpen && isActive && <div style={{ position: 'absolute', right: 0, top: '25%', bottom: '25%', width: 3, background: color, borderRadius: '2px 0 0 2px', boxShadow: `0 0 10px ${color}` }} />}
            </button>
          )
        })}
      </nav>

      {/* User & Logout */}
      <div style={{ borderTop: '1px solid var(--border)', padding: isOpen ? '16px' : '16px 8px' }}>
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
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.3s var(--ease-out-expo)',
            fontFamily: 'var(--font-body)',
            marginBottom: 10,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-glass-hover)'; e.currentTarget.style.color = 'var(--text-primary)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-glass)'; e.currentTarget.style.color = 'var(--text-secondary)' }}>
          {theme === 'dark' ? <Sun size={16} color="var(--brand-primary)" /> : <Moon size={16} color="var(--brand-primary)" />}
          {isOpen && (theme === 'dark' ? 'Light Mode' : 'Dark Mode')}
        </button>

        {user && isOpen && (
          <div style={{ padding: '12px', background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--brand-primary-dim)', border: '1px solid var(--brand-primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <User size={14} color="var(--brand-primary)" />
              </div>
              <div style={{ overflow: 'hidden', flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: 'var(--font-body)' }}>{user.name}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: 'var(--font-mono)' }}>{user.email}</div>
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
            fontSize: 13, 
            fontWeight: 600,
            cursor: 'pointer', 
            transition: 'all 0.3s var(--ease-out-expo)', 
            fontFamily: 'var(--font-body)' 
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--red-dim)'; e.currentTarget.style.color = 'var(--red)'; e.currentTarget.style.borderColor = 'var(--red-dim)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'transparent' }}>
          <LogOut size={16} /> {isOpen && 'Sign out'}
        </button>
      </div>
    </aside>
  )
}
