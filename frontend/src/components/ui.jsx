import React from 'react'

/* ═══════════════════════════════════════════════════════════════
   MFButton — the shared button used by docs pages, the MCP modal,
   error pages and any new surface. Variants follow DESIGN.md:
   primary (Action Blue pill), secondary (hairline pill), glass and
   danger. 44-pt minimum touch target on md/lg (HIG).
   ═══════════════════════════════════════════════════════════════ */

const VARIANTS = {
  primary: {
    background: 'var(--btn-primary-bg, var(--lp-accent))',
    color: '#fff',
    border: '1px solid transparent',
    fontWeight: 600,
  },
  secondary: {
    background: 'transparent',
    color: 'var(--lp-accent, var(--brand-primary))',
    border: '1px solid var(--lp-hairline, var(--border))',
    fontWeight: 600,
  },
  glass: {
    background: 'var(--bg-glass)',
    color: 'var(--text-secondary)',
    border: '1px solid var(--border)',
    fontWeight: 600,
  },
  danger: {
    background: 'color-mix(in srgb, var(--red) 12%, transparent)',
    color: 'var(--red)',
    border: '1px solid color-mix(in srgb, var(--red) 35%, transparent)',
    fontWeight: 600,
  },
}

const SIZES = {
  sm: { padding: '7px 14px', fontSize: 12.5, borderRadius: 980, minHeight: 32 },
  md: { padding: '10px 20px', fontSize: 13.5, borderRadius: 980, minHeight: 44 },
  lg: { padding: '12px 26px', fontSize: 15, borderRadius: 980, minHeight: 48 },
}

export default function MFButton({
  variant = 'primary',
  size = 'md',
  children,
  onClick,
  disabled = false,
  type = 'button',
  style = {},
  ...rest
}) {
  const v = VARIANTS[variant] || VARIANTS.primary
  const s = SIZES[size] || SIZES.md
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        ...v, ...s,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.55 : 1,
        fontFamily: 'var(--font-display)',
        transition: 'transform 0.15s var(--ease-apple), opacity 0.15s, background 0.15s',
        ...style,
      }}
      onMouseDown={e => { if (!disabled) e.currentTarget.style.transform = 'scale(0.97)' }}
      onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
      {...rest}
    >
      {children}
    </button>
  )
}
