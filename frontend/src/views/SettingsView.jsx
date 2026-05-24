import React, { useState, useEffect } from 'react'
import {
  User, LogOut, Mail, AtSign, Bell, MapPin, Volume2, ShieldCheck, Sun, Moon
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

export default function SettingsView({ theme, setTheme }) {
  const { user, logout } = useAuth()
  const isMobile = useIsMobile()

  const [notifPermission, setNotifPermission] = useState(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  )
  const [geoStatus, setGeoStatus] = useState('unknown')
  const [geoCoords, setGeoCoords] = useState(null)
  const [audioStatus, setAudioStatus] = useState('suspended')

  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' }).then(p => {
        setGeoStatus(p.state)
        p.onchange = () => setGeoStatus(p.state)
      }).catch(() => {})
    }
  }, [])

  const requestNotif = async () => {
    if (!('Notification' in window)) {
      alert('Notifications are not supported on this browser.')
      return
    }
    const res = await Notification.requestPermission()
    setNotifPermission(res)
  }

  const requestGeo = () => {
    if (!('geolocation' in navigator)) {
      alert('Geolocation is not supported by your browser.')
      return
    }
    setGeoStatus('prompting...')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoStatus('granted')
        setGeoCoords(`${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`)
      },
      (err) => {
        console.warn(err)
        setGeoStatus('denied')
        setGeoCoords(null)
      }
    )
  }

  const testAudio = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      if (ctx.state === 'suspended') {
        ctx.resume().then(() => {
          setAudioStatus(ctx.state)
          playTestSound(ctx)
        })
      } else {
        setAudioStatus(ctx.state)
        playTestSound(ctx)
      }
    } catch (e) {
      alert('Web Audio API not supported.')
    }
  }

  const playTestSound = (ctx) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(880, ctx.currentTime)
    gain.gain.setValueAtTime(0.1, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.4)
  }

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

      {/* Mobile & App Permissions */}
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.12em' }}>APP PERMISSIONS</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <ShieldCheck size={12} color="var(--brand-primary)" />
            <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>SECURE</span>
          </div>
        </div>

        {/* Notification Permission Row */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 14,
          padding: '16px 20px',
          borderBottom: '1px solid var(--border)',
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'var(--bg-glass)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Bell size={15} color={notifPermission === 'granted' ? 'var(--green)' : 'var(--text-muted)'} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Push Notifications</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
              Status: <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: notifPermission === 'granted' ? 'var(--green)' : notifPermission === 'denied' ? 'var(--red)' : 'var(--amber)' }}>{notifPermission}</span>
            </div>
          </div>
          <button onClick={requestNotif} style={{
            background: notifPermission === 'granted' ? 'rgba(91,168,143,0.06)' : 'var(--bg-glass)',
            border: `1px solid ${notifPermission === 'granted' ? 'var(--green)' : 'var(--border)'}`,
            color: notifPermission === 'granted' ? 'var(--green)' : 'var(--text-primary)',
            padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s'
          }}>
            {notifPermission === 'granted' ? 'Allowed' : 'Request'}
          </button>
        </div>

        {/* Geolocation Permission Row */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 14,
          padding: '16px 20px',
          borderBottom: '1px solid var(--border)',
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'var(--bg-glass)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <MapPin size={15} color={geoStatus === 'granted' ? 'var(--brand-primary)' : 'var(--text-muted)'} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Location Access</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {geoCoords ? `Coords: ${geoCoords}` : `Status: ${geoStatus}`}
            </div>
          </div>
          <button onClick={requestGeo} style={{
            background: geoStatus === 'granted' ? 'var(--brand-primary-dim)' : 'var(--bg-glass)',
            border: `1px solid ${geoStatus === 'granted' ? 'var(--brand-primary)' : 'var(--border)'}`,
            color: geoStatus === 'granted' ? 'var(--brand-primary)' : 'var(--text-primary)',
            padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s'
          }}>
            {geoStatus === 'granted' ? 'Enabled' : 'Request'}
          </button>
        </div>

        {/* Web Audio Context Row */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 14,
          padding: '16px 20px',
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'var(--bg-glass)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Volume2 size={15} color={audioStatus === 'running' ? 'var(--amber)' : 'var(--text-muted)'} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Audio Alerts Context</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
              Engine Status: <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: audioStatus === 'running' ? 'var(--green)' : 'var(--text-muted)' }}>{audioStatus}</span>
            </div>
          </div>
          <button onClick={testAudio} style={{
            background: 'var(--bg-glass)',
            border: '1px solid var(--border)',
            color: 'var(--text-primary)',
            padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s'
          }}>
            Test Sound
          </button>
        </div>
      </div>

      {/* Appearance Selection */}
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.12em' }}>APPEARANCE</div>
        </div>
        <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Interface Theme</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Customize how MindForm looks on your device</div>
          </div>
          <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} style={{
            background: 'var(--bg-glass)',
            border: '1px solid var(--border)',
            color: 'var(--text-primary)',
            padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
            display: 'flex', alignItems: 'center', gap: 8
          }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-glass-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-glass)'}>
            {theme === 'dark' ? (
              <>
                <Sun size={14} color="var(--brand-primary)" /> Light Mode
              </>
            ) : (
              <>
                <Moon size={14} color="var(--brand-primary)" /> Dark Mode
              </>
            )}
          </button>
        </div>
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
