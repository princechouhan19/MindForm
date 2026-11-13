import React, { useEffect, useState } from 'react'
import { Home, RefreshCw, ArrowLeft, AlertTriangle, FileQuestion, WifiOff, ChevronDown, ChevronUp, Sparkles, ShieldOff, BookOpen } from 'lucide-react'
import { navigateTo } from '../lib/nav'

/* ═══════════════════════════════════════════════════════════════
   ErrorPage — the one error surface for the whole SPA.

   Rendered by App.jsx for unknown routes (404), by the global
   ErrorBoundary (500 / crash) and by the offline detector (network).
   Also served as /404 and /500. The Express backend has matching
   static pages (public/404.html, public/500.html) for asset misses.
   ═══════════════════════════════════════════════════════════════ */

const ERROR_CONFIGS = {
  404: {
    badge: '404 Error',
    badgeColor: 'var(--brand-warning, #f59e0b)',
    badgeBg: 'rgba(245, 158, 11, 0.12)',
    title: 'Lost in the stream.',
    subtitle: 'The page you are looking for has moved, expired, or never existed in this dimension.',
    icon: FileQuestion,
  },
  500: {
    badge: '500 Error',
    badgeColor: 'var(--brand-error, #ef4444)',
    badgeBg: 'rgba(239, 68, 68, 0.12)',
    title: 'Something broke the cadence.',
    subtitle: 'An unexpected glitch occurred on our end. Your habits and data remain safe on the server.',
    icon: AlertTriangle,
  },
  403: {
    badge: '403 Error',
    badgeColor: 'var(--brand-error, #ef4444)',
    badgeBg: 'rgba(239, 68, 68, 0.12)',
    title: 'Off limits.',
    subtitle: 'You do not have permission to view this page. If you think this is a mistake, sign in with the right account.',
    icon: ShieldOff,
  },
  network: {
    badge: 'Offline',
    badgeColor: 'var(--cyan, #06b6d4)',
    badgeBg: 'rgba(6, 182, 212, 0.12)',
    title: 'Signal lost.',
    subtitle: 'We cannot reach the MindForm servers. Check your connection or verify that the server is online.',
    icon: WifiOff,
  },
}

export default function ErrorPage({
  code = 404,
  error = null,
  title,            // optional overrides
  subtitle,
  onHome,
  onRetry,
  onBack,
}) {
  const [showDetails, setShowDetails] = useState(false)
  const config = ERROR_CONFIGS[code] || ERROR_CONFIGS[404]
  const Icon = config.icon

  useEffect(() => {
    document.title = `${code === 'network' ? 'Offline' : code} — MindForm`
    // Error surfaces must never inherit a stale scroll offset.
    window.scrollTo(0, 0)
    return () => { document.title = 'MindForm — Habit Tracker, Task Planner & Voice Training' }
  }, [code])

  const handleReload = () => {
    if (onRetry) onRetry()
    else window.location.reload()
  }

  const handleGoHome = () => {
    if (onHome) onHome()
    else navigateTo('/')
  }

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      background: 'var(--bg-base, #0b0c10)',
      color: 'var(--text-primary, #ffffff)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 20px',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: 'var(--font-body, system-ui, sans-serif)',
      boxSizing: 'border-box',
    }}>
      {/* Ambient background glow */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: '-25%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '120vw',
          maxWidth: 1200,
          height: 700,
          background: code === 500
            ? 'radial-gradient(ellipse at center, rgba(239,68,68,0.12) 0%, rgba(147,51,234,0.06) 45%, transparent 70%)'
            : 'radial-gradient(ellipse at center, rgba(10,132,255,0.14) 0%, rgba(94,92,230,0.08) 40%, transparent 70%)',
          filter: 'blur(35px)',
          pointerEvents: 'none',
        }}
      />

      <div style={{
        maxWidth: 540,
        width: '100%',
        textAlign: 'center',
        position: 'relative',
        zIndex: 2,
        padding: '40px 32px',
        borderRadius: 24,
        background: 'var(--bg-elevated, rgba(22, 24, 30, 0.7))',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid var(--border-bright, rgba(255, 255, 255, 0.08))',
        boxShadow: '0 24px 60px rgba(0,0,0,0.45)',
      }}>
        {/* Brand / Logo */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
          <img src="/logo.png" alt="MindForm" style={{ width: 34, height: 34, borderRadius: 9, objectFit: 'contain' }} />
          <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.01em', fontFamily: 'var(--font-display, inherit)' }}>
            MindForm
          </span>
        </div>

        {/* Status Badge */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
            padding: '6px 14px',
            borderRadius: 999,
            background: config.badgeBg,
            border: `1px solid ${config.badgeColor}40`,
            color: config.badgeColor,
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}>
            <Icon size={15} />
            <span>{config.badge}</span>
          </div>
        </div>

        {/* Big Code Graphic */}
        <div style={{
          fontSize: 'clamp(4.5rem, 12vw, 6.5rem)',
          fontWeight: 800,
          fontFamily: 'var(--font-display, inherit)',
          letterSpacing: '-0.04em',
          lineHeight: 1,
          marginBottom: 16,
          background: code === 500
            ? 'linear-gradient(180deg, #ffffff 40%, rgba(239, 68, 68, 0.6) 100%)'
            : 'linear-gradient(180deg, #ffffff 40%, rgba(10, 132, 255, 0.6) 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          {code}
        </div>

        {/* Title & Description */}
        <h1 style={{
          fontSize: 'clamp(20px, 3.5vw, 24px)',
          fontWeight: 700,
          marginBottom: 12,
          letterSpacing: '-0.02em',
          fontFamily: 'var(--font-display, inherit)',
        }}>
          {title || config.title}
        </h1>
        <p style={{
          fontSize: 15,
          color: 'var(--text-secondary, #94a3b8)',
          lineHeight: 1.6,
          margin: '0 auto 32px',
          maxWidth: 420,
        }}>
          {subtitle || config.subtitle}
        </p>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: 12,
          justifyContent: 'center',
          flexWrap: 'wrap',
          marginBottom: error ? 24 : 0,
        }}>
          <button
            onClick={handleGoHome}
            className="lp-btn-primary"
            style={{
              padding: '12px 24px',
              fontSize: 14.5,
              fontWeight: 600,
              minHeight: 44,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
              borderRadius: 999,
            }}
          >
            <Home size={16} /> Return Home
          </button>

          {code !== 404 && (
            <button
              onClick={handleReload}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 22px',
                fontSize: 14.5,
                fontWeight: 600,
                color: 'var(--text-primary, #ffffff)',
                background: 'var(--bg-glass, rgba(255,255,255,0.06))',
                border: '1px solid var(--border-bright, rgba(255,255,255,0.12))',
                borderRadius: 999,
                cursor: 'pointer',
                transition: 'background 0.2s, border-color 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-glass, rgba(255,255,255,0.06))'}
            >
              <RefreshCw size={15} /> Try Again
            </button>
          )}

          <button
            onClick={() => navigateTo('/docs')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 22px',
              fontSize: 14.5,
              fontWeight: 600,
              color: 'var(--text-primary, #ffffff)',
              background: 'var(--bg-glass, rgba(255,255,255,0.06))',
              border: '1px solid var(--border-bright, rgba(255,255,255,0.12))',
              borderRadius: 999,
              cursor: 'pointer',
              transition: 'background 0.2s, border-color 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-glass, rgba(255,255,255,0.06))'}
          >
            <BookOpen size={15} /> Docs
          </button>

          {onBack && (
            <button
              onClick={onBack}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '12px 18px',
                fontSize: 14,
                color: 'var(--text-secondary, #94a3b8)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                transition: 'color 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary, #ffffff)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary, #94a3b8)'}
            >
              <ArrowLeft size={15} /> Back
            </button>
          )}
        </div>

        {/* Technical Error Details Accordion (for 500 / exceptions) */}
        {error && (
          <div style={{ marginTop: 24, textAlign: 'left', borderTop: '1px solid var(--border, rgba(255,255,255,0.08))', paddingTop: 18 }}>
            <button
              onClick={() => setShowDetails(v => !v)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted, #64748b)',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 0',
              }}
            >
              <span>Technical Diagnostics</span>
              {showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {showDetails && (
              <pre style={{
                marginTop: 10,
                padding: '12px 14px',
                background: 'rgba(0,0,0,0.45)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 10,
                fontSize: 12,
                color: 'var(--brand-error, #f87171)',
                fontFamily: 'var(--font-mono, monospace)',
                overflowX: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                maxHeight: 220,
              }}>
                {typeof error === 'string' ? error : (error.stack || error.message || JSON.stringify(error, null, 2))}
              </pre>
            )}
          </div>
        )}
      </div>

      {/* Subtle footer */}
      <div style={{
        marginTop: 28,
        fontSize: 12.5,
        color: 'var(--text-muted, #64748b)',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
      }}>
        <Sparkles size={12} color="var(--brand-primary, #0a84ff)" /> MindForm Resilience System
      </div>
    </div>
  )
}
