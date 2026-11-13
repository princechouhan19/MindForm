import React, { useState, useEffect } from 'react'
import {
  LogOut, Mail, AtSign, Bell, MapPin, Volume2, ShieldCheck, Sun, Moon,
  ChevronRight, Palette, User, Info, Brain, Cable,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/Toast'
import { IOSToggle } from './SocialView'
import MCPModal from '../components/MCPModal'

/* ═══════════════════════════════════════════════════════════════
   Settings — iOS Settings app design language (v2.1)
   • Inset-grouped rounded lists with section headers
   • Colored rounded-square icon tiles (signature iOS look)
   • Theme preview cards instead of a bare toggle
   • 44-pt rows, chevron/status accessories
═══════════════════════════════════════════════════════════════ */

function useIsMobile() {
  const [m, setM] = useState(window.innerWidth <= 768)
  useEffect(() => {
    const fn = () => setM(window.innerWidth <= 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])
  return m
}

/* iOS icon tile — colored rounded square with a white glyph */
function IconTile({ icon: Icon, bg, size = 30 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.26, background: bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      <Icon size={size * 0.55} color="#ffffff" strokeWidth={2.2} />
    </div>
  )
}

/* Inset-grouped card with iOS section header */
function Group({ title, footer, children }) {
  return (
    <div style={{ marginBottom: 22 }}>
      {title && (
        <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.04em', textTransform: 'uppercase', padding: '0 16px 7px' }}>
          {title}
        </div>
      )}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        {children}
      </div>
      {footer && (
        <div style={{ fontSize: 12.5, color: 'var(--text-muted)', padding: '7px 16px 0', lineHeight: 1.5 }}>{footer}</div>
      )}
    </div>
  )
}

/* One settings row */
function Row({ icon, iconBg, title, subtitle, accessory, onClick, last = false }) {
  const clickable = Boolean(onClick)
  return (
    <div
      onClick={onClick}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={clickable ? (e) => e.key === 'Enter' && onClick() : undefined}
      style={{
        display: 'flex', alignItems: 'center', gap: 13,
        padding: '12px 16px', minHeight: 52,
        borderBottom: last ? 'none' : '1px solid var(--border)',
        cursor: clickable ? 'pointer' : 'default',
        transition: 'background 0.15s',
      }}
      onMouseEnter={clickable ? (e => e.currentTarget.style.background = 'var(--bg-glass)') : undefined}
      onMouseLeave={clickable ? (e => e.currentTarget.style.background = 'transparent') : undefined}>
      {icon && <IconTile icon={icon} bg={iconBg} />}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>{title}</div>
        {subtitle && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.4 }}>{subtitle}</div>}
      </div>
      {accessory}
    </div>
  )
}

const statusChip = (text, color) => (
  <span style={{
    fontSize: 12, fontWeight: 600, color,
    background: `color-mix(in srgb, ${color} 12%, transparent)`,
    padding: '4px 11px', borderRadius: 20, whiteSpace: 'nowrap',
  }}>
    {text}
  </span>
)

/* Theme preview card — Apple-style visual preference */
function ThemeCard({ mode, active, onSelect, icon: Icon, name, hint }) {
  const dark = mode === 'dark'
  return (
    <button onClick={() => onSelect(mode)}
      style={{
        flex: 1, minWidth: 0, cursor: 'pointer', textAlign: 'left',
        border: active ? '2px solid var(--brand-primary)' : '1px solid var(--border)',
        borderRadius: 14, padding: 12, background: 'transparent',
        boxShadow: active ? 'var(--shadow-brand)' : 'none',
        transition: 'all 0.18s var(--ease-apple)',
      }}>
      {/* mini preview */}
      <div style={{
        height: 64, borderRadius: 9, marginBottom: 10,
        background: dark ? '#0a0a0c' : '#f5f5f7',
        border: '1px solid var(--border)', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: 8, left: 8, right: dark ? 28 : 28, bottom: 8,
          borderRadius: 6, background: dark ? '#1c1c1e' : '#ffffff',
          border: '1px solid ' + (dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'),
        }}>
          <div style={{ height: 6, margin: 6, borderRadius: 3, width: '55%', background: dark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.16)' }} />
          <div style={{ height: 5, margin: '0 6px', borderRadius: 3, width: '80%', background: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }} />
          <div style={{ height: 5, margin: '4px 6px 0', borderRadius: 3, width: '40%', background: 'var(--brand-primary)', opacity: 0.8 }} />
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <Icon size={15} color={active ? 'var(--brand-primary)' : 'var(--text-secondary)'} />
        <span style={{ fontSize: 14, fontWeight: active ? 700 : 600, color: 'var(--text-primary)' }}>{name}</span>
        {active && (
          <span style={{ marginLeft: 'auto', width: 20, height: 20, borderRadius: '50%', background: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#fff', fontWeight: 600 }}>✓</span>
        )}
      </div>
      <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 3 }}>{hint}</div>
    </button>
  )
}

export default function SettingsView({ theme, setTheme, onNavigate }) {
  const { user, logout } = useAuth()
  const toast = useToast()
  const isMobile = useIsMobile()
  const [showMCP, setShowMCP] = useState(false)

  const [notifPermission, setNotifPermission] = useState(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  )
  const [geoStatus, setGeoStatus] = useState('unknown')
  const [geoCoords, setGeoCoords] = useState(null)
  const [audioStatus, setAudioStatus] = useState('suspended')

  useEffect(() => {
    let status
    if (typeof window !== 'undefined' && navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' }).then(p => {
        status = p
        setGeoStatus(p.state)
        const onChange = () => setGeoStatus(p.state)
        p.addEventListener('change', onChange)
        status._cleanup = () => p.removeEventListener('change', onChange)
      }).catch(() => {})
    }
    return () => { if (status?._cleanup) status._cleanup() }
  }, [])

  const requestNotif = async () => {
    if (!('Notification' in window)) {
      toast.warning('Notifications are not supported on this browser.')
      return
    }
    try {
      const res = await Notification.requestPermission()
      setNotifPermission(res)
      if (res === 'granted') toast.success('Notifications enabled.')
      else if (res === 'denied') toast.error('Notifications blocked — enable them in browser settings.')
    } catch { toast.error('Could not request notification permission.') }
  }

  const requestGeo = () => {
    if (!('geolocation' in navigator)) {
      toast.warning('Geolocation is not supported by your browser.')
      return
    }
    setGeoStatus('prompting')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoStatus('granted')
        setGeoCoords(`${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`)
      },
      (err) => {
        console.warn(err)
        setGeoStatus(err.code === 1 ? 'denied' : 'unavailable')
        setGeoCoords(null)
        toast.warning(err.code === 1 ? 'Location permission denied.' : 'Location unavailable.')
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
    } catch {
      toast.warning('Web Audio API not supported.')
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
    osc.start()
    osc.stop(ctx.currentTime + 0.4)
    osc.onended = () => ctx.close().catch(() => {})
  }

  const notifColor = notifPermission === 'granted' ? 'var(--brand-success)' : notifPermission === 'denied' ? 'var(--brand-error)' : 'var(--brand-orange)'
  const geoColor = geoStatus === 'granted' ? 'var(--brand-primary)' : geoStatus === 'denied' ? 'var(--brand-error)' : 'var(--text-muted)'

  const content = (
    <div style={{ maxWidth: 620, width: '100%', margin: '0 auto' }}>
      {/* Profile header card */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 16,
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-xl)', padding: '18px 20px', marginBottom: 24,
      }}>
        <div style={{
          width: 60, height: 60, borderRadius: '50%',
          background: 'var(--btn-primary-bg)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 24, fontWeight: 600, color: '#fff', flexShrink: 0,
        }}>
          {user?.name?.[0]?.toUpperCase() || '?'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>{user?.name}</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
        </div>
        <User size={18} color="var(--text-muted)" />
      </div>

      {/* Appearance */}
      <Group title="Appearance">
        <div style={{ padding: 16, display: 'flex', gap: 12 }}>
          <ThemeCard mode="dark" active={theme === 'dark'} onSelect={setTheme}
            icon={Moon} name="Dark" hint="OLED-friendly. Best at night." />
          <ThemeCard mode="light" active={theme === 'light'} onSelect={setTheme}
            icon={Sun} name="Light" hint="apple.com canvas. Best in daylight." />
        </div>
      </Group>

      {/* Account */}
      <Group title="Account" footer="Your account details are managed by your sign-in.">
        <Row icon={AtSign} iconBg="var(--brand-primary)"
          title="Display Name" subtitle={user?.name || '—'} />
        <Row icon={Mail} iconBg="var(--brand-secondary)"
          title="Email Address" subtitle={user?.email || '—'} last />
      </Group>

      {/* Permissions */}
      <Group
        title="App permissions"
        footer="Permissions are handled entirely by your browser — MindForm never receives data you don't explicitly grant.">
        <Row icon={Bell} iconBg="var(--brand-error)"
          title="Push Notifications"
          subtitle="Task reminders and streak alerts"
          accessory={
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {statusChip(notifPermission, notifColor)}
              {notifPermission !== 'granted' && (
                <button onClick={requestNotif}
                  style={{
                    background: 'var(--btn-primary-bg)', color: '#fff', border: 'none', borderRadius: 980,
                    padding: '7px 15px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', minHeight: 32,
                  }}>
                  {notifPermission === 'denied' ? 'How to fix' : 'Enable'}
                </button>
              )}
            </div>
          } />
        <Row icon={MapPin} iconBg="var(--brand-success)"
          title="Location Access"
          subtitle={geoCoords ? `Coordinates: ${geoCoords}` : 'Used to localise day boundaries'}
          accessory={
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {statusChip(geoStatus, geoColor)}
              {geoStatus !== 'granted' && (
                <button onClick={requestGeo}
                  style={{
                    background: 'var(--btn-primary-bg)', color: '#fff', border: 'none', borderRadius: 980,
                    padding: '7px 15px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', minHeight: 32,
                  }}>
                  Enable
                </button>
              )}
            </div>
          } />
        <Row icon={Volume2} iconBg="var(--brand-orange)"
          title="Audio Alerts"
          subtitle={`Sound engine: ${audioStatus}`}
          accessory={
            <button onClick={testAudio}
              style={{
                background: 'var(--bg-glass)', border: '1px solid var(--border)', color: 'var(--text-primary)',
                padding: '7px 15px', borderRadius: 20, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', minHeight: 32,
              }}>
              Test sound
            </button>
          }
          last />
      </Group>

      {/* AI & integrations */}
      <Group
        title="AI & integrations"
        footer="Coach reads your plan and proposes edits; MCP lets external AI tools do the same with plain tool calls. Both always ask before writing.">
        <Row icon={Brain} iconBg="var(--purple)"
          title="Coach"
          subtitle="Your AI copilot — plans weeks, replans habits, sets goals"
          onClick={() => onNavigate?.('ai')}
          accessory={
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--brand-primary)', fontSize: 13.5, fontWeight: 600 }}>
              Open <ChevronRight size={14} />
            </span>
          } />
        <Row icon={Cable} iconBg="var(--purple)"
          title="MCP Server"
          subtitle="Connect Claude Desktop, Cursor & friends — 12 quick-edit tools"
          onClick={() => setShowMCP(true)}
          accessory={<ChevronRight size={15} color="var(--text-muted)" />}
          last />
      </Group>

      {/* About */}
      <Group title="About">
        <Row icon={ShieldCheck} iconBg="var(--brand-teal)"
          title="Privacy by design"
          subtitle="Your streaks, tasks and logs stay in your account."
          accessory={<ChevronRight size={15} color="var(--text-muted)" style={{ opacity: 0.5 }} />} />
        <Row icon={Info} iconBg="var(--brand-secondary)"
          title="MindForm 3.1"
          subtitle="Apple-grade productivity suite · Coach · Speak · MCP"
          last />
      </Group>

      {/* Session / danger */}
      <Group title="Session" footer="Signing out keeps your data safe on the server.">
        <Row icon={LogOut} iconBg="var(--brand-error)"
          title="Sign Out"
          subtitle="You'll need to log in again to access your data"
          onClick={logout}
          accessory={
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--brand-error)', fontSize: 13.5, fontWeight: 600 }}>
              Sign out <ChevronRight size={14} />
            </span>
          }
          last />
      </Group>

      {/* MCP setup modal */}
      {showMCP && <MCPModal onClose={() => setShowMCP(false)} />}
    </div>
  )

  // ── Mobile ──
  if (isMobile) return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '16px 14px 0', flexShrink: 0 }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em' }}>Settings</h1>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '14px 14px 96px' }}>
        {content}
      </div>
    </div>
  )

  // ── Desktop ──
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '20px 24px 0', flexShrink: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--brand-primary)', letterSpacing: '0.16em', marginBottom: 4 }}>
          MINDFORM
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.02em' }}>Settings</h1>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '18px 24px 28px' }}>
        {content}
      </div>
    </div>
  )
}
