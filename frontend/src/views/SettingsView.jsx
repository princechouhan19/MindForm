import React, { useState, useEffect } from 'react'
import {
  User, LogOut, Mail, AtSign
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

function useIsMobile() {
  const [m, setM] = useState(window.innerWidth <= 768)
  useEffect(() => {
    const fn = () => setM(window.innerWidth <= 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])
  return m
}

export default function SettingsView() {
  const { user, logout } = useAuth()
  const isMobile = useIsMobile()

  const AccountPanel = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Profile card */}
      <div style={{
        background: 'var(--bg-surface)', border: '1px solid var(--border)',
        borderRadius: 16, overflow: 'hidden',
      }}>
        {/* Avatar band */}
        <div style={{
          height: 72, background: 'linear-gradient(135deg, var(--brand-primary-dim), var(--brand-secondary-dim, var(--purple-dim)))',
          borderBottom: '1px solid var(--border)', position: 'relative',
        }} />
        <div style={{ padding: '0 24px 24px' }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'var(--brand-primary-dim)', border: '3px solid var(--bg-surface)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginTop: -32, marginBottom: 12,
            fontSize: 26, fontWeight: 800, color: 'var(--brand-primary)',
            fontFamily: 'var(--font-display)',
          }}>
            {user?.name?.[0]?.toUpperCase() || '?'}
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>{user?.name}</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{user?.email}</div>
        </div>
      </div>

      {/* Info rows */}
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.12em' }}>ACCOUNT INFO</div>
        </div>
        {[
          { icon: AtSign, label: 'Display Name', value: user?.name },
          { icon: Mail,   label: 'Email Address', value: user?.email },
        ].map(({ icon: Icon, label, value }, i, arr) => (
          <div key={label} style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '16px 20px',
            borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'var(--bg-glass)', border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Icon size={15} color="var(--text-muted)" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.06em', marginBottom: 2 }}>{label}</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{value || '—'}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Danger zone */}
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.12em' }}>SESSION</div>
        </div>
        <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Sign out</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>You'll need to log in again to access your data</div>
          </div>
          <button onClick={logout} style={{
            display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px',
            borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer',
            background: 'var(--red-dim)', border: '1px solid var(--red)',
            color: 'var(--red)', transition: 'all 0.15s', flexShrink: 0,
          }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(201,95,95,0.22)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--red-dim)'}>
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </div>
    </div>
  )

  // ── Mobile ───────────────────────────────────────────────────────────────────
  if (isMobile) return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '16px 16px 0', flexShrink: 0 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 16, fontFamily: 'var(--font-display)' }}>Settings</h1>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '16px 16px 80px' }}>
        <AccountPanel />
      </div>
    </div>
  )

  // ── Desktop ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ height: '100%', display: 'flex', overflow: 'hidden' }}>
      {/* Content */}
      <main style={{ flex: 1, overflow: 'auto', padding: '32px 40px' }}>
        {/* Section title */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--brand-primary)', letterSpacing: '0.14em', marginBottom: 6 }}>
            PROFILE
          </div>
          <h2 style={{ fontSize: 26, fontWeight: 800, fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>
            Your Profile
          </h2>
        </div>

        <div style={{ maxWidth: 600 }}>
          <AccountPanel />
        </div>
      </main>
    </div>
  )
}
