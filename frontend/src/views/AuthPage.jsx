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

    const email = (form.email || '').trim()
    const password = form.password || ''
    const name = (form.name || '').trim()

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
      if (emailErr) {
        setLocalError(emailErr)
        return
      }
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
      setLocalError(err.message || 'An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      /* Fixed height (not min-height) so the card wrapper below is the
         scroll container: the register card centers when it fits and
         scrolls instead of overflowing off-screen when it doesn't. */
      height: '100dvh', width: '100vw',
      display: 'flex', flexDirection: 'column',
      background: 'var(--bg-base)',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Ambient glow */}
      <div aria-hidden style={{
        position: 'absolute', top: '-40%', left: '50%', transform: 'translateX(-50%)',
        width: '120vw', maxWidth: 1200, height: 800,
        background: 'var(--bg-base)',
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
              color: 'var(--text-secondary)', fontSize: 14.5, fontWeight: 600,
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

      {/* Card — scrollable when the register form is taller than the window.
          `margin: auto` centers the card when there is room and collapses to
          zero (enabling scroll) when it overflows — no more clipped card. */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '4vh 20px 40px', overflowY: 'auto' }}>
        <form
          onSubmit={handleSubmit}
          className="mf-sheet"
          style={{
            width: '100%', maxWidth: 400,
            padding: '40px 36px 34px',
            position: 'relative', zIndex: 5,
            margin: 'auto',
          }}
        >
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 34 }}>
            <img src="/logo.png" alt="MindForm" style={{ width: 44, height: 44, borderRadius: 12, objectFit: 'contain' }} />
            <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.02em', fontFamily: 'var(--font-display)' }}>
              MindForm
            </div>
          </div>

          {/* Title */}
          <h2 style={{ fontSize: 28, fontWeight: 600, marginBottom: 8, fontFamily: 'var(--font-display)', letterSpacing: '-0.022em' }}>
            {mode === 'login' ? 'Welcome back.' : 'Create your account.'}
          </h2>
          <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 30, fontFamily: 'var(--font-body)', lineHeight: 1.55 }}>
            {mode === 'login'
              ? 'Sign in to pick up where you left off.'
              : 'Start your journey to unbreakable focus.'}
          </p>

          {/* Error */}
          {(error || localError) && (
            <div role="alert" style={{
              background: 'var(--red-dim)', border: '1px solid color-mix(in srgb, var(--red) 30%, transparent)',
              borderRadius: 'var(--radius-md)', padding: '11px 14px', fontSize: 13.5, color: 'var(--brand-error)',
              marginBottom: 22, display: 'flex', alignItems: 'flex-start', gap: 9,
              fontFamily: 'var(--font-body)', lineHeight: 1.45,
            }}>
              <ShieldAlert size={16} style={{ marginTop: 1, flexShrink: 0 }} />
              <span>{error || localError}</span>
            </div>
          )}

          {/* Fields */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {mode === 'register' && (
              <div>
                <label htmlFor="mf-name" style={styles.label}>Name</label>
                <input
                  id="mf-name"
                  name="name"
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
                type="email" value={form.email} onChange={set('email')}
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
            width: '100%', marginTop: 28, justifyContent: 'center', minHeight: 50,
            opacity: loading ? 0.7 : 1,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}>
            {loading
              ? <><Loader size={17} style={{ animation: 'spin 1s linear infinite' }} /> {mode === 'login' ? 'Signing in…' : 'Creating account…'}</>
              : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>

          {/* Toggle mode */}
          <div style={{ textAlign: 'center', marginTop: 26, fontSize: 14, color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}>
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
