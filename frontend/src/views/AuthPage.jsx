import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Eye, EyeOff, Loader, ArrowLeft, ShieldAlert, ShieldCheck } from 'lucide-react'

// Client-side quick checks (backend has the full list)
const OBVIOUS_TEMP_KEYWORDS = ['mailinator', 'guerrilla', 'yopmail', 'tempmail', 'throwaway', 'trashmail', 'fakeinbox', '10minute', 'disposable', 'burner']

function quickEmailCheck(email) {
  const lower = email.toLowerCase()
  const domain = lower.split('@')[1] || ''
  if (OBVIOUS_TEMP_KEYWORDS.some(k => domain.includes(k))) return 'Temporary email addresses are not allowed.'
  return null
}

function getPasswordStrength(pw) {
  if (!pw) return { score: 0, label: '', color: 'transparent' }
  let score = 0
  if (pw.length >= 8) score++
  if (pw.length >= 12) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^a-zA-Z0-9]/.test(pw)) score++
  if (score <= 1) return { score, label: 'Too weak', color: '#ff4757' }
  if (score === 2) return { score, label: 'Weak', color: '#ff6b35' }
  if (score === 3) return { score, label: 'Fair', color: '#ffd700' }
  if (score === 4) return { score, label: 'Good', color: '#7bed9f' }
  return { score, label: 'Strong', color: 'var(--green)' }
}

export default function AuthPage({ onBack }) {
  const { login, register, error, setError } = useAuth()
  const [mode, setMode] = useState('login') // login | register
  const [form, setForm] = useState({ name: '', email: '', password: '', honeypot: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [localError, setLocalError] = useState('')

  const set = (field) => (e) => {
    setError('')
    setLocalError('')
    setForm(prev => ({ ...prev, [field]: e.target.value }))
  }

  const handleSubmit = async () => {
    if (!form.email || !form.password) return
    if (mode === 'register' && !form.name) return

    // ── Honeypot: bots fill hidden fields, humans don't ───────────────────────
    if (form.honeypot) return // silently reject bots

    if (mode === 'register') {
      // Client-side quick checks
      const emailErr = quickEmailCheck(form.email)
      if (emailErr) { setLocalError(emailErr); return }

      const strength = getPasswordStrength(form.password)
      if (strength.score < 2) {
        setLocalError('Password is too weak. Use at least 8 characters with letters and numbers.')
        return
      }
    }

    setLoading(true)
    if (mode === 'login') await login(form.email, form.password)
    else await register(form.name, form.email, form.password)
    setLoading(false)
  }

  const inputStyle = {
    width: '100%',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: '14px 18px',
    fontSize: 16,
    color: 'var(--text-primary)',
    outline: 'none',
    transition: 'border-color 0.15s',
    fontFamily: 'var(--font-display)',
  }

  return (
    <div style={{
      height: '100vh', width: '100vw',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-base)',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Background glow */}
      <div style={{
        position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)',
        width: 600, height: 600, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,229,255,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Back to home */}
      {onBack && (
        <button
          onClick={onBack}
          style={{
            position: 'absolute', top: 24, left: 24,
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)',
            borderRadius: 10, padding: '8px 14px',
            fontSize: 13, fontWeight: 600,
            color: 'var(--text-secondary)', cursor: 'pointer',
            fontFamily: 'var(--font-display)',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.09)'; e.currentTarget.style.color = 'var(--text-primary)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
        >
          <ArrowLeft size={14} /> Back to Home
        </button>
      )}

      <div style={{
        width: '100%', maxWidth: 400,
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 20,
        padding: '40px 36px',
        position: 'relative',
        animation: 'fadeIn 0.4s ease',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 36 }}>
          <img src="/logo.png" alt="Mind Form" style={{ width: 48, height: 48, borderRadius: 12, objectFit: 'contain' }} />
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '0.04em' }}>MIND FORM</div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', letterSpacing: '0.12em' }}>PRODUCTIVITY SUITE</div>
          </div>
        </div>

        {/* Title */}
        <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 8 }}>
          {mode === 'login' ? 'Welcome back' : 'Create account'}
        </h2>
        <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 32 }}>
          {mode === 'login' ? 'Sign in to your dashboard' : 'Start tracking your habits & tasks'}
        </p>

        {/* Error */}
        {(error || localError) && (
          <div style={{
            background: 'rgba(255,71,87,0.08)', border: '1px solid rgba(255,71,87,0.35)',
            borderRadius: 10, padding: '12px 16px', fontSize: 13, color: 'var(--red)',
            marginBottom: 20, display: 'flex', alignItems: 'flex-start', gap: 8,
          }}>
            <ShieldAlert size={15} style={{ marginTop: 1, flexShrink: 0 }} />
            <span>{error || localError}</span>
          </div>
        )}

        {/* Fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {mode === 'register' && (
            <input
              value={form.name} onChange={set('name')}
              placeholder="Full name"
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = 'rgba(0,229,255,0.4)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
            />
          )}
          <input
            type="email" value={form.email} onChange={set('email')}
            placeholder="Email address"
            style={inputStyle}
            onFocus={e => e.target.style.borderColor = 'rgba(0,229,255,0.4)'}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
          />
          {/* Honeypot – hidden from real users, bots fill it */}
          <input
            value={form.honeypot}
            onChange={set('honeypot')}
            tabIndex={-1}
            aria-hidden="true"
            style={{ position: 'absolute', left: -9999, top: -9999, opacity: 0, height: 0, width: 0 }}
            autoComplete="off"
          />
          <div style={{ position: 'relative' }}>
            <input
              type={showPwd ? 'text' : 'password'} value={form.password} onChange={set('password')}
              placeholder={mode === 'register' ? 'Password (min 8 chars + number)' : 'Password'}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              style={{ ...inputStyle, paddingRight: 44, width: '100%', boxSizing: 'border-box' }}
              onFocus={e => e.target.style.borderColor = 'rgba(0,229,255,0.4)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
            />
            <button onClick={() => setShowPwd(v => !v)} style={{
              position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
              background: 'none', color: 'var(--text-muted)', display: 'flex', padding: 0,
            }}>
              {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {/* Password strength meter */}
          {mode === 'register' && form.password && (() => {
            const s = getPasswordStrength(form.password)
            return (
              <div>
                <div style={{ height: 4, background: 'var(--border)', borderRadius: 4, overflow: 'hidden', marginBottom: 4 }}>
                  <div style={{ height: '100%', width: `${Math.min(100, (s.score / 5) * 100)}%`, background: s.color, transition: 'all 0.3s', borderRadius: 4 }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11 }}>
                  {s.score >= 4 ? <ShieldCheck size={11} color={s.color} /> : <ShieldAlert size={11} color={s.color} />}
                  <span style={{ color: s.color, fontWeight: 700 }}>{s.label}</span>
                </div>
              </div>
            )
          })()}
        </div>{/* end fields */}

        {/* Submit */}
        <button onClick={handleSubmit} disabled={loading} style={{
          width: '100%', marginTop: 28,
          background: loading ? 'var(--cyan-dim)' : 'linear-gradient(135deg, var(--cyan), #0077ff)',
          border: 'none', borderRadius: 12,
          padding: '15px', fontSize: 16, fontWeight: 700,
          color: loading ? 'var(--cyan)' : '#000',
          cursor: loading ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          transition: 'opacity 0.15s',
          fontFamily: 'var(--font-display)',
          letterSpacing: '0.03em',
        }}>
          {loading ? <><Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> {mode === 'login' ? 'Signing in...' : 'Creating account...'}</> : mode === 'login' ? 'Sign In' : 'Create Account'}
        </button>

        {/* Toggle mode */}
        <div style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: 'var(--text-secondary)' }}>
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button onClick={() => { setMode(m => m === 'login' ? 'register' : 'login'); setError('') }} style={{
            background: 'none', color: 'var(--cyan)', fontWeight: 600, fontSize: 14,
            cursor: 'pointer', fontFamily: 'var(--font-display)',
          }}>
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
