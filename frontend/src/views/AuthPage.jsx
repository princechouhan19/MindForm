import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Zap, Eye, EyeOff, Loader } from 'lucide-react'

export default function AuthPage() {
  const { login, register, error, setError } = useAuth()
  const [mode, setMode] = useState('login') // login | register
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)

  const set = (field) => (e) => {
    setError('')
    setForm(prev => ({ ...prev, [field]: e.target.value }))
  }

  const handleSubmit = async () => {
    if (!form.email || !form.password) return
    if (mode === 'register' && !form.name) return
    setLoading(true)
    if (mode === 'login') await login(form.email, form.password)
    else await register(form.name, form.email, form.password)
    setLoading(false)
  }

  const inputStyle = {
    width: '100%',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 10,
    padding: '12px 16px',
    fontSize: 14,
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: 'linear-gradient(135deg, var(--cyan), #0077ff)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 20px var(--cyan-glow)',
          }}>
            <Zap size={20} color="#000" fill="#000" />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: '0.04em' }}>MIND FORM</div>
            <div style={{ fontSize: 10, color: 'var(--text-secondary)', letterSpacing: '0.12em' }}>PRODUCTIVITY SUITE</div>
          </div>
        </div>

        {/* Title */}
        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>
          {mode === 'login' ? 'Welcome back' : 'Create account'}
        </h2>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 28 }}>
          {mode === 'login' ? 'Sign in to your dashboard' : 'Start tracking your habits & tasks'}
        </p>

        {/* Error */}
        {error && (
          <div style={{
            background: 'rgba(255,71,87,0.1)', border: '1px solid rgba(255,71,87,0.3)',
            borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--red)',
            marginBottom: 20,
          }}>
            {error}
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
          <div style={{ position: 'relative' }}>
            <input
              type={showPwd ? 'text' : 'password'} value={form.password} onChange={set('password')}
              placeholder="Password" onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              style={{ ...inputStyle, paddingRight: 44 }}
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
        </div>

        {/* Submit */}
        <button onClick={handleSubmit} disabled={loading} style={{
          width: '100%', marginTop: 24,
          background: loading ? 'var(--cyan-dim)' : 'linear-gradient(135deg, var(--cyan), #0077ff)',
          border: 'none', borderRadius: 10,
          padding: '13px', fontSize: 14, fontWeight: 700,
          color: loading ? 'var(--cyan)' : '#000',
          cursor: loading ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          transition: 'opacity 0.15s',
          fontFamily: 'var(--font-display)',
          letterSpacing: '0.03em',
        }}>
          {loading ? <><Loader size={15} style={{ animation: 'spin 1s linear infinite' }} /> {mode === 'login' ? 'Signing in...' : 'Creating account...'}</> : mode === 'login' ? 'Sign In' : 'Create Account'}
        </button>

        {/* Toggle mode */}
        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text-secondary)' }}>
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button onClick={() => { setMode(m => m === 'login' ? 'register' : 'login'); setError('') }} style={{
            background: 'none', color: 'var(--cyan)', fontWeight: 600, fontSize: 13,
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
