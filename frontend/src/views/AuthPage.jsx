import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { Eye, EyeOff, Loader, ArrowLeft, ShieldAlert, ShieldCheck } from 'lucide-react'
import WebGLBackground from '../components/WebGLBackground'

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
  if (score <= 1) return { score, label: 'Too weak', color: 'var(--brand-error)' }
  if (score === 2) return { score, label: 'Weak', color: 'var(--brand-warning)' }
  if (score === 3) return { score, label: 'Fair', color: 'var(--brand-primary)' }
  if (score === 4) return { score, label: 'Good', color: 'var(--brand-success)' }
  return { score, label: 'Strong', color: 'var(--brand-success)' }
}

export default function AuthPage({ onBack }) {
  const { login, register, error, setError } = useAuth()
  const [mode, setMode] = useState('login') // login | register
  const [form, setForm] = useState({ name: '', email: '', password: '', honeypot: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [localError, setLocalError] = useState('')
  const [theme] = useState('dark') // Auth page usually looks best in dark mode for this brand

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const set = (field) => (e) => {
    setError('')
    setLocalError('')
    setForm(prev => ({ ...prev, [field]: e.target.value }))
  }

  const handleSubmit = async () => {
    if (!form.email || !form.password) return
    if (mode === 'register' && !form.name) return

    if (form.honeypot) return 

    if (mode === 'register') {
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
    background: 'var(--bg-glass)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)',
    padding: '14px 18px',
    fontSize: 15,
    color: 'var(--text-primary)',
    outline: 'none',
    transition: 'all 0.3s var(--ease-out-expo)',
    fontFamily: 'var(--font-body)',
  }

  return (
    <div style={{
      height: '100vh', width: '100vw',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-base)',
      position: 'relative', overflow: 'hidden',
    }}>
      <WebGLBackground theme={theme} />

      {/* Back to home */}
      {onBack && (
        <button
          onClick={onBack}
          className="lp-btn-secondary"
          style={{
            position: 'absolute', top: 32, left: 32,
            padding: '10px 18px',
            fontSize: 13,
            gap: 8,
            zIndex: 10,
          }}
        >
          <ArrowLeft size={14} /> Back to Home
        </button>
      )}

      <div className="lp-card" style={{
        width: '100%', maxWidth: 420,
        padding: '48px 40px',
        position: 'relative',
        zIndex: 5,
        backdropFilter: 'blur(16px)',
        boxShadow: 'var(--shadow-xl)',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 40 }}>
          <img src="/logo.png" alt="Mind Form" style={{ width: 52, height: 52, borderRadius: 14, objectFit: 'contain' }} />
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '0.04em', fontFamily: 'var(--font-display)' }}>MIND FORM</div>
            <div style={{ fontSize: 10, color: 'var(--brand-primary)', letterSpacing: '0.15em', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>PRODUCTIVITY SUITE</div>
          </div>
        </div>

        {/* Title */}
        <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 12, fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>
          {mode === 'login' ? 'Welcome back' : 'Join MindForm'}
        </h2>
        <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 36, fontFamily: 'var(--font-body)', lineHeight: 1.6 }}>
          {mode === 'login' ? 'Sign in to access your dashboard' : 'Start your journey to unbreakable focus'}
        </p>

        {/* Error */}
        {(error || localError) && (
          <div style={{
            background: 'rgba(201,95,95,0.08)', border: '1px solid rgba(201,95,95,0.2)',
            borderRadius: 'var(--radius-sm)', padding: '12px 16px', fontSize: 13, color: 'var(--brand-error)',
            marginBottom: 24, display: 'flex', alignItems: 'flex-start', gap: 10,
            fontFamily: 'var(--font-body)',
          }}>
            <ShieldAlert size={16} style={{ marginTop: 2, flexShrink: 0 }} />
            <span>{error || localError}</span>
          </div>
        )}

        {/* Fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {mode === 'register' && (
            <input
              value={form.name} onChange={set('name')}
              placeholder="Full name"
              style={inputStyle}
              onFocus={e => { e.target.style.borderColor = 'var(--brand-primary)'; e.target.style.background = 'var(--bg-glass-hover)' }}
              onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.background = 'var(--bg-glass)' }}
            />
          )}
          <input
            type="email" value={form.email} onChange={set('email')}
            placeholder="Email address"
            style={inputStyle}
            onFocus={e => { e.target.style.borderColor = 'var(--brand-primary)'; e.target.style.background = 'var(--bg-glass-hover)' }}
            onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.background = 'var(--bg-glass)' }}
          />
          {/* Honeypot */}
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
              placeholder={mode === 'register' ? 'Password (min 8 chars)' : 'Password'}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              style={{ ...inputStyle, paddingRight: 48 }}
              onFocus={e => { e.target.style.borderColor = 'var(--brand-primary)'; e.target.style.background = 'var(--bg-glass-hover)' }}
              onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.background = 'var(--bg-glass)' }}
            />
            <button onClick={() => setShowPwd(v => !v)} style={{
              position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)',
              background: 'none', color: 'var(--text-muted)', display: 'flex', padding: 0,
              cursor: 'pointer', transition: 'color 0.2s',
            }} onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
              {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* Password strength meter */}
          {mode === 'register' && form.password && (() => {
            const s = getPasswordStrength(form.password)
            return (
              <div style={{ padding: '0 4px' }}>
                <div style={{ height: 4, background: 'var(--border)', borderRadius: 4, overflow: 'hidden', marginBottom: 6 }}>
                  <div style={{ height: '100%', width: `${Math.min(100, (s.score / 5) * 100)}%`, background: s.color, transition: 'all 0.5s var(--ease-out-expo)', borderRadius: 4 }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontFamily: 'var(--font-mono)' }}>
                  {s.score >= 4 ? <ShieldCheck size={12} color={s.color} /> : <ShieldAlert size={12} color={s.color} />}
                  <span style={{ color: s.color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</span>
                </div>
              </div>
            )
          })()}
        </div>

        {/* Submit */}
        <button onClick={handleSubmit} disabled={loading} className="lp-btn-primary" style={{
          width: '100%', marginTop: 32,
          justifyContent: 'center',
          opacity: loading ? 0.7 : 1,
          pointerEvents: loading ? 'none' : 'auto',
        }}>
          {loading ? <><Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> {mode === 'login' ? 'Authenticating...' : 'Processing...'}</> : mode === 'login' ? 'Sign In' : 'Create Account'}
        </button>

        {/* Toggle mode */}
        <div style={{ textAlign: 'center', marginTop: 32, fontSize: 14, color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}>
          {mode === 'login' ? "New to MindForm? " : 'Already have an account? '}
          <button onClick={() => { setMode(m => m === 'login' ? 'register' : 'login'); setError('') }} style={{
            background: 'none', color: 'var(--brand-primary)', fontWeight: 700, fontSize: 14,
            cursor: 'pointer', fontFamily: 'var(--font-body)', transition: 'opacity 0.2s',
          }} onMouseEnter={e => e.currentTarget.style.opacity = 0.8} onMouseLeave={e => e.currentTarget.style.opacity = 1}>
            {mode === 'login' ? 'Create an account' : 'Sign in here'}
          </button>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
