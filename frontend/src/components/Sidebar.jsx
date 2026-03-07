import React from 'react'
import { CheckSquare, Activity, Zap, LogOut, User } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { id: 'tasks', label: 'Task Tracker', icon: CheckSquare },
  { id: 'habits', label: 'Habit Tracker', icon: Activity },
]

export default function Sidebar({ active, onChange }) {
  const { user, logout } = useAuth()

  return (
    <aside style={{
      width: 'var(--sidebar-width)',
      height: '100vh',
      background: 'var(--bg-surface)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
    }}>
      <div style={{ padding: '28px 20px 20px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, var(--cyan), #0077ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 16px var(--cyan-glow)' }}>
            <Zap size={16} color="#000" fill="#000" />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.05em' }}>MIND FORM</div>
            <div style={{ fontSize: 9, fontWeight: 500, color: 'var(--text-secondary)', letterSpacing: '0.12em', marginTop: 1 }}>PRODUCTIVITY SUITE</div>
          </div>
        </div>
      </div>
      <nav style={{ padding: '16px 12px', flex: 1 }}>
        <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.15em', padding: '0 8px', marginBottom: 8 }}>MODULES</div>
        {navItems.map(({ id, label, icon: Icon }) => {
          const isActive = active === id
          return (
            <button key={id} onClick={() => onChange(id)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 'var(--radius-sm)', background: isActive ? 'var(--cyan-dim)' : 'transparent', border: isActive ? '1px solid rgba(0,229,255,0.2)' : '1px solid transparent', color: isActive ? 'var(--cyan)' : 'var(--text-secondary)', fontSize: 13, fontWeight: isActive ? 600 : 400, cursor: 'pointer', transition: 'all 0.15s ease', marginBottom: 4, textAlign: 'left', fontFamily: 'var(--font-display)' }}
              onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'var(--bg-glass-hover)'; e.currentTarget.style.color = 'var(--text-primary)' } }}
              onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)' } }}>
              <Icon size={15} />{label}
              {isActive && <div style={{ marginLeft: 'auto', width: 4, height: 4, borderRadius: '50%', background: 'var(--cyan)', boxShadow: '0 0 6px var(--cyan)' }} />}
            </button>
          )
        })}
      </nav>
      <div style={{ borderTop: '1px solid var(--border)', padding: '12px' }}>
        {user && (
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
        <button onClick={logout} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8, background: 'none', border: '1px solid transparent', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'var(--font-display)' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,71,87,0.08)'; e.currentTarget.style.color = 'var(--red)'; e.currentTarget.style.borderColor = 'rgba(255,71,87,0.2)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'transparent' }}>
          <LogOut size={13} /> Sign out
        </button>
      </div>
    </aside>
  )
}
