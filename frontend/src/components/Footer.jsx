import React from 'react'
import { ArrowRight } from 'lucide-react'
import { navigateTo } from '../lib/nav'

/* ═══════════════════════════════════════════════════════════════
   SiteFooter — the single footer used across every marketing and
   content page (landing, Privacy, Terms, FAQ, How it works, Docs,
   error pages). One component, one design language: parchment
   canvas, hairline dividers, fine print — per DESIGN.md.

   Props
     onNavigate(path)   optional — SPA navigation override
     onHome()           optional — back-to-home override
     onGetStarted(mode) optional — 'login' | 'register'; shows CTAs
     maxWidth           content column width (default 980)
   ═══════════════════════════════════════════════════════════════ */

const go = (onNavigate, path) => (onNavigate ? onNavigate(path) : navigateTo(path))

const PRODUCT_LINKS = ['Task Tracker', 'Habit Tracker', 'Goals', 'Fapless', 'Speak', 'Social', 'AI Coach']
const RESOURCE_LINKS = [
  { label: 'How it works', path: '/how-it-works' },
  { label: 'FAQ', path: '/faq' },
  { label: 'Docs home', path: '/docs' },
  { label: 'MCP server docs', path: '/docs/mcp' },
  { label: 'AI Coach docs', path: '/docs/ai-coach' },
]
const LEGAL_LINKS = [
  { label: 'Privacy Policy', path: '/privacy' },
  { label: 'Terms of Use', path: '/terms' },
]

function FooterLink({ children, onClick }) {
  return (
    <div className="lp-fine" style={{ color: 'var(--lp-ink-2)', padding: '5px 0', cursor: 'pointer', lineHeight: 1.9 }}
      onMouseEnter={e => { e.currentTarget.style.color = 'var(--lp-accent)'; e.currentTarget.style.textDecoration = 'underline' }}
      onMouseLeave={e => { e.currentTarget.style.color = 'var(--lp-ink-2)'; e.currentTarget.style.textDecoration = 'none' }}
      onClick={onClick}
    >{children}</div>
  )
}

export default function SiteFooter({ onNavigate, onHome, onGetStarted, maxWidth = 980 }) {
  const home = () => (onHome ? onHome() : go(onNavigate, '/'))
  return (
    <footer style={{ background: 'var(--lp-parchment)', borderTop: '1px solid var(--lp-hairline)' }}>
      <div style={{ maxWidth, margin: '0 auto', padding: '40px clamp(20px, 5vw, 80px) 28px' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 28, paddingBottom: 24, borderBottom: '1px solid var(--lp-hairline)',
        }}>
          <div>
            <div className="lp-caption-strong" style={{ fontSize: 12, color: 'var(--lp-ink)', marginBottom: 10 }}>Product</div>
            {PRODUCT_LINKS.map(l => (
              <FooterLink key={l} onClick={onGetStarted ? () => onGetStarted('register') : home}>{l}</FooterLink>
            ))}
          </div>
          <div>
            <div className="lp-caption-strong" style={{ fontSize: 12, color: 'var(--lp-ink)', marginBottom: 10 }}>Resources</div>
            {RESOURCE_LINKS.map(l => (
              <FooterLink key={l.label} onClick={() => go(onNavigate, l.path)}>{l.label}</FooterLink>
            ))}
          </div>
          <div>
            <div className="lp-caption-strong" style={{ fontSize: 12, color: 'var(--lp-ink)', marginBottom: 10 }}>Legal</div>
            {LEGAL_LINKS.map(l => (
              <FooterLink key={l.label} onClick={() => go(onNavigate, l.path)}>{l.label}</FooterLink>
            ))}
            <FooterLink onClick={() => go(onNavigate, '/faq')}>Self-hosting</FooterLink>
          </div>
          {onGetStarted && (
            <div>
              <div className="lp-caption-strong" style={{ fontSize: 12, color: 'var(--lp-ink)', marginBottom: 10 }}>Get started</div>
              <div className="lp-fine" style={{ color: 'var(--lp-ink-2)', padding: '5px 0' }}>Free forever</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
                <button className="lp-btn-primary" onClick={() => onGetStarted('register')} style={{ padding: '6px 16px', fontSize: 12, cursor: 'pointer' }}>
                  Sign up free <ArrowRight size={12} />
                </button>
                <button onClick={() => onGetStarted('login')} className="lp-link" style={{ fontSize: 12, textAlign: 'left', cursor: 'pointer', background: 'none', border: 'none', padding: '2px 0' }}>
                  Sign in
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="lp-fine" style={{ paddingTop: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, color: 'var(--lp-ink-3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <img src="/logo.png" alt="MindForm" style={{ width: 16, height: 16, borderRadius: 4, objectFit: 'contain' }} />
            <span>© {new Date().getFullYear()} MindForm. All rights reserved.</span>
          </div>
          <div style={{ display: 'flex', gap: 18, alignItems: 'center', flexWrap: 'wrap' }}>
            {[['Privacy Policy', '/privacy'], ['Terms of Use', '/terms'], ['FAQ', '/faq']].map(([l, target]) => (
              <span key={l} style={{ cursor: 'pointer', transition: 'color 0.2s' }}
                onClick={() => go(onNavigate, target)}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--lp-ink)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--lp-ink-3)'}
              >{l}</span>
            ))}
            {onGetStarted && (
              <button onClick={() => onGetStarted('login')} className="lp-link" style={{ fontSize: 12, cursor: 'pointer', background: 'none', border: 'none' }}>
                Sign in <ArrowRight size={12} />
              </button>
            )}
          </div>
        </div>
      </div>
    </footer>
  )
}
