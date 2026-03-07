import React from 'react'
import { CheckSquare, Activity, Target, Settings, LogOut, User, PanelLeftClose, PanelLeftOpen, Flame } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { id: 'tasks',   label: 'Task Tracker',   icon: CheckSquare, color: 'var(--cyan)' },
  { id: 'habits',  label: 'Habit Tracker',  icon: Activity,    color: 'var(--amber)' },
  { id: 'goals',   label: 'Goals',          icon: Target,      color: 'var(--green)' },
  { id: 'fapless', label: 'Fapless',        icon: Flame,       color: '#ff4500' },
  { id: 'settings',label: 'Settings',       icon: Settings,    color: 'var(--text-secondary)' },
]

export default function Sidebar({ active, onChange, isOpen, onToggle }) {
  const { user, logout } = useAuth()

  return (
    <aside style={{
      width: isOpen ? 'var(--sidebar-width)' : '60px',
      height: '100vh',
      background: 'var(--bg-surface)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      transition: 'width 0.25s ease',
      overflow: 'hidden',
    }}>
      {/* Logo + Toggle */}
      <div style={{ padding: '16px 12px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: isOpen ? 'space-between' : 'center', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
          <img src="/logo.png" alt="Mind Form" style={{ width: 48, height: 48, borderRadius: 10, objectFit: 'contain', flexShrink: 0 }} />
          {isOpen && (
            <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: '0.02em', lineHeight: 1.1 }}>
              <div>Mind</div>
              <div>Form</div>
            </div>
          )}
        </div>
        {isOpen && (
          <button onClick={onToggle} title="Collapse sidebar" style={{ background: 'none', color: 'var(--text-muted)', display: 'flex', padding: 4, borderRadius: 6, flexShrink: 0, transition: 'color 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
            <PanelLeftClose size={16} />
          </button>
        )}
      </div>

      {/* Toggle button when closed */}
      {!isOpen && (
        <div style={{ padding: '12px 0', display: 'flex', justifyContent: 'center', borderBottom: '1px solid var(--border)' }}>
          <button onClick={onToggle} title="Open sidebar" style={{ background: 'none', color: 'var(--text-muted)', display: 'flex', padding: 6, borderRadius: 6, transition: 'color 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--cyan)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
            <PanelLeftOpen size={16} />
          </button>
        </div>
      )}

      {/* Nav */}
      <nav style={{ padding: isOpen ? '14px 10px' : '14px 6px', flex: 1 }}>
        {isOpen && <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.15em', padding: '0 6px', marginBottom: 6 }}>MODULES</div>}
        {navItems.map(({ id, label, icon: Icon, color }) => {
          const isActive = active === id
          return (
            <button key={id} onClick={() => onChange(id)} title={!isOpen ? label : undefined}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: isOpen ? 10 : 0, justifyContent: isOpen ? 'flex-start' : 'center', padding: isOpen ? '10px 10px' : '10px 0', borderRadius: 'var(--radius-sm)', background: isActive ? (color + '18') : 'transparent', border: isActive ? `1px solid ${color}33` : '1px solid transparent', color: isActive ? color : 'var(--text-secondary)', fontSize: 13, fontWeight: isActive ? 600 : 400, cursor: 'pointer', transition: 'all 0.15s ease', marginBottom: 4, textAlign: 'left', fontFamily: 'var(--font-display)' }}
              onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'var(--bg-glass-hover)'; e.currentTarget.style.color = 'var(--text-primary)' } }}
              onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)' } }}>
              <Icon size={15} />
              {isOpen && <><span>{label}</span>{isActive && <div style={{ marginLeft: 'auto', width: 5, height: 5, borderRadius: '50%', background: color, boxShadow: `0 0 6px ${color}` }} />}</>}
            </button>
          )
        })}
      </nav>

      {/* User & Logout */}
      <div style={{ borderTop: '1px solid var(--border)', padding: isOpen ? '12px' : '10px 6px' }}>
        {user && isOpen && (
          <div style={{ padding: '8px 10px', background: 'var(--bg-glass)', borderRadius: 8, border: '1px solid var(--border)', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, var(--cyan-dim), var(--amber-dim))', border: '1px solid var(--border-bright)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <User size={13} color="var(--text-secondary)" />
              </div>
              <div style={{ overflow: 'hidden', flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</div>
                <div style={{ fontSize: 9, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</div>
              </div>
            </div>
          </div>
        )}
        <button onClick={logout} title={!isOpen ? 'Sign out' : undefined}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: isOpen ? 'flex-start' : 'center', gap: 8, padding: isOpen ? '8px 10px' : '8px 0', borderRadius: 8, background: 'none', border: '1px solid transparent', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'var(--font-display)' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,71,87,0.08)'; e.currentTarget.style.color = 'var(--red)'; e.currentTarget.style.borderColor = 'rgba(255,71,87,0.2)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'transparent' }}>
          <LogOut size={13} /> {isOpen && 'Sign out'}
        </button>
      </div>
    </aside>
  )
}

