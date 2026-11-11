import React, { useState, useEffect } from 'react'
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
  if (score <= 1) return { score, label: 'Too weak', color: 'var(--brand-error)' }
  if (score === 2) return { score, label: 'Weak', color: 'var(--brand-orange)' }
  if (score === 3) return { score, label: 'Fair', color: 'var(--brand-warning)' }
  if (score === 4) return { score, label: 'Good', color: 'var(--brand-success)' }
  return { score, label: 'Strong', color: 'var(--brand-success)' }
}

const styles = {
  field: {
    width: '100%',
    background: 'var(--bg-glass)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)',
    padding: '13px 16px',
    fontSize: 16,
    color: 'var(--text-primary)',
    transition: 'border-color 0.25s, background 0.25s',
    fontFamily: 'var(--font-body)',
    minHeight: 48,
  },
  label: {
    display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)',
    marginBottom: 7, fontFamily: 'var(--font-body)', letterSpacing: '0.01em',
  },
}

export default function AuthPage({ initialMode = 'login', onBack }) {
  const { login, register, error, setError } = useAuth()
  const [mode, setMode] = useState(initialMode)
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [localError, setLocalError] = useState('')

  useEffect(() => {
    setMode(initialMode)
    setError('')
    setLocalError('')
  }, [initialMode, setError])

  const set = (field) => (e) => {
    setError('')
    setLocalError('')
    setForm(prev => ({ ...prev, [field]: e.target.value }))
  }

  const switchMode = (newMode) => {
    setMode(newMode)
    setError('')
    setLocalError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLocalError('')

    const email = form.email.trim()
    const password = form.password
    const name = form.name.trim()

    if (!email || !password) {
      setLocalError('Please enter both email and password.')
      return
    }

    if (mode === 'register') {
      if (!name) {
        setLocalError('Please enter your full name.')
        return
      }
      const emailErr = quickEmailCheck(email)
      if (emailErr) { setLocalError(emailErr); return }
      const strength = getPasswordStrength(password)
      if (strength.score < 2) {
        setLocalError('Password is too weak. Use at least 8 characters with letters and numbers.')
        return
      }
    }

    setLoading(true)
    try {
      if (mode === 'login') {
        const ok = await login(email, password)
        if (!ok && !error) {
          setLocalError('Could not sign in. Please verify your credentials.')
        }
      } else {
        const ok = await register(name, email, password)
        if (!ok && !error) {
          setLocalError('Could not create account. Please check your details.')
        }
      }
    } catch (err) {
      console.error('Submit error:', err)
      setLocalError(err.message || 'An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', width: '100vw',
      display: 'flex', flexDirection: 'column',
      background: 'var(--bg-base)',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Ambient glow */}
      <div aria-hidden style={{
        position: 'absolute', top: '-40%', left: '50%', transform: 'translateX(-50%)',
        width: '120vw', maxWidth: 1200, height: 800,
        background: 'radial-gradient(ellipse at center, rgba(10,132,255,0.13) 0%, rgba(94,92,230,0.08) 40%, transparent 70%)',
        filter: 'blur(30px)', pointerEvents: 'none',
      }} />

      {/* Top bar */}
      <div style={{ position: 'relative', zIndex: 10, padding: '18px 22px', flexShrink: 0 }}>
        {onBack && (
          <button
            onClick={onBack}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              background: 'none', border: 'none', padding: '8px 4px',
              color: 'var(--text-secondary)', fontSize: 14.5, fontWeight: 500,
              cursor: 'pointer', borderRadius: 8, minHeight: 36,
              fontFamily: 'var(--font-body)', transition: 'color 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
          >
            <ArrowLeft size={16} /> Home
          </button>
        )}
      </div>

      {/* Card */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '4vh 20px 40px' }}>
        <form
          onSubmit={handleSubmit}
          className="mf-sheet"
          style={{
            width: '100%', maxWidth: 420,
            padding: '36px 32px 30px',
            position: 'relative', zIndex: 5,
          }}
        >
          {/* Logo & Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 26 }}>
            <img src="/logo.png" alt="MindForm" style={{ width: 42, height: 42, borderRadius: 12, objectFit: 'contain' }} />
            <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', fontFamily: 'var(--font-display)' }}>
              MindForm
            </div>
          </div>

          {/* Segmented Mode Switcher */}
          <div style={{
            display: 'flex',
            background: 'var(--bg-glass)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-pill)',
            padding: 4,
            marginBottom: 24,
            gap: 4,
          }}>
            <button
              type="button"
              onClick={() => switchMode('login')}
              style={{
                flex: 1,
                padding: '9px 16px',
                borderRadius: 'var(--radius-pill)',
                border: 'none',
                background: mode === 'login' ? 'var(--brand-primary)' : 'transparent',
                color: mode === 'login' ? '#ffffff' : 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: 14,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => switchMode('register')}
              style={{
                flex: 1,
                padding: '9px 16px',
                borderRadius: 'var(--radius-pill)',
                border: 'none',
                background: mode === 'register' ? 'var(--brand-primary)' : 'transparent',
                color: mode === 'register' ? '#ffffff' : 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: 14,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              Sign Up
            </button>
          </div>

          {/* Title */}
          <h2 style={{ fontSize: 26, fontWeight: 700, marginBottom: 6, fontFamily: 'var(--font-display)', letterSpacing: '-0.022em' }}>
            {mode === 'login' ? 'Welcome back.' : 'Create your account.'}
          </h2>
          <p style={{ fontSize: 14.5, color: 'var(--text-secondary)', marginBottom: 24, fontFamily: 'var(--font-body)', lineHeight: 1.5 }}>
            {mode === 'login'
              ? 'Sign in to access your dashboard and continue your streak.'
              : 'Start your journey to unbreakable discipline and focus.'}
          </p>

          {/* Error Banner */}
          {(error || localError) && (
            <div role="alert" style={{
              background: 'var(--red-dim)', border: '1px solid color-mix(in srgb, var(--red) 30%, transparent)',
              borderRadius: 'var(--radius-md)', padding: '11px 14px', fontSize: 13.5, color: 'var(--brand-error)',
              marginBottom: 20, display: 'flex', alignItems: 'flex-start', gap: 9,
              fontFamily: 'var(--font-body)', lineHeight: 1.45,
            }}>
              <ShieldAlert size={16} style={{ marginTop: 1, flexShrink: 0 }} />
              <span>{error || localError}</span>
            </div>
          )}

          {/* Fields */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {mode === 'register' && (
              <div>
                <label htmlFor="mf-name" style={styles.label}>Name</label>
                <input
                  id="mf-name"
                  name="name"
                  type="text"
                  required
                  value={form.name} onChange={set('name')}
                  placeholder="Alex Carter"
                  autoComplete="name"
                  style={styles.field}
                />
              </div>
            )}
            <div>
              <label htmlFor="mf-email" style={styles.label}>Email</label>
              <input
                id="mf-email"
                name="email"
                type="email"
                required
                value={form.email} onChange={set('email')}
                placeholder="you@example.com"
                autoComplete="email"
                style={styles.field}
              />
            </div>
            <div>
              <label htmlFor="mf-password" style={styles.label}>
                Password
                {mode === 'register' && <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}> · min 8 characters</span>}
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="mf-password"
                  name="password"
                  required
                  type={showPwd ? 'text' : 'password'} value={form.password} onChange={set('password')}
                  placeholder="••••••••"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  style={{ ...styles.field, paddingRight: 48 }}
                />
                <button type="button" onClick={() => setShowPwd(v => !v)} aria-label={showPwd ? 'Hide password' : 'Show password'} style={{
                  position: 'absolute', right: 8, top: 4,
                  width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'none', color: 'var(--text-muted)', borderRadius: 8,
                  cursor: 'pointer', transition: 'color 0.2s',
                }} onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
                  {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {/* Password strength meter */}
              {mode === 'register' && form.password && (() => {
                const s = getPasswordStrength(form.password)
                return (
                  <div style={{ padding: '10px 2px 0' }}>
                    <div style={{ height: 4, background: 'var(--border)', borderRadius: 4, overflow: 'hidden', marginBottom: 7 }}>
                      <div style={{ height: '100%', width: `${(s.score / 5) * 100}%`, background: s.color, transition: 'all 0.4s var(--ease-out-expo)', borderRadius: 4 }} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                      {s.score >= 4 ? <ShieldCheck size={13} color={s.color} /> : <ShieldAlert size={13} color={s.color} />}
                      <span style={{ color: s.color, fontWeight: 600 }}>{s.label}</span>
                    </div>
                  </div>
                )
              })()}
            </div>
          </div>

          {/* Submit */}
          <button type="submit" disabled={loading} className="lp-btn-primary" style={{
            width: '100%', marginTop: 24, justifyContent: 'center', minHeight: 48,
            opacity: loading ? 0.7 : 1,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}>
            {loading
              ? <><Loader size={17} style={{ animation: 'spin 1s linear infinite' }} /> {mode === 'login' ? 'Signing in…' : 'Creating account…'}</>
              : mode === 'login' ? 'Sign In' : 'Sign Up'}
          </button>

          {/* Footer toggle link */}
          <div style={{ textAlign: 'center', marginTop: 22, fontSize: 14, color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}>
            {mode === 'login' ? 'New to MindForm? ' : 'Already have an account? '}
            <button type="button" onClick={() => switchMode(mode === 'login' ? 'register' : 'login')} style={{
              background: 'none', border: 'none', color: 'var(--brand-primary)', fontWeight: 600, fontSize: 14,
              cursor: 'pointer', fontFamily: 'var(--font-body)', padding: '4px 2px',
            }}>
              {mode === 'login' ? 'Create an account' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
