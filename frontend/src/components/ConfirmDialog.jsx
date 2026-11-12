import React, { createContext, useContext, useState, useCallback, useMemo, useRef } from 'react'
import { AlertTriangle } from 'lucide-react'

const ConfirmContext = createContext(null)

/**
 * Replacement for window.confirm — Apple-style centered dialog.
 * const confirm = useConfirm()
 * const ok = await confirm({ title: 'Delete task?', body: 'This can’t be undone.', confirmLabel: 'Delete', danger: true })
 */
export function ConfirmProvider({ children }) {
  const [dialog, setDialog] = useState(null)
  const resolverRef = useRef(null)

  const confirm = useCallback((opts = {}) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve
      setDialog({
        title: opts.title || 'Are you sure?',
        body: opts.body || '',
        confirmLabel: opts.confirmLabel || 'Confirm',
        cancelLabel: opts.cancelLabel || 'Cancel',
        danger: !!opts.danger,
      })
    })
  }, [])

  const close = useCallback((result) => {
    if (resolverRef.current) resolverRef.current(result)
    resolverRef.current = null
    setDialog(null)
  }, [])

  const value = useMemo(() => ({ confirm }), [confirm])

  // Escape key handling
  React.useEffect(() => {
    if (!dialog) return
    const onKey = (e) => { if (e.key === 'Escape') close(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [dialog, close])

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      {dialog && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 9000,
            background: 'rgba(0,0,0,0.45)',
            backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20,
          }}
          onClick={() => close(false)}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-label={dialog.title}
            className="mf-sheet"
            style={{ width: 'min(92vw, 340px)', padding: '26px 24px 20px', textAlign: 'center' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              width: 46, height: 46, borderRadius: 14, margin: '0 auto 16px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: dialog.danger ? 'var(--red-dim)' : 'var(--brand-primary-dim)',
            }}>
              <AlertTriangle size={22} style={{ color: dialog.danger ? 'var(--brand-error)' : 'var(--brand-primary)' }} />
            </div>
            <div style={{ fontSize: 18, fontWeight: 600, fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', marginBottom: 8 }}>
              {dialog.title}
            </div>
            {dialog.body && (
              <div style={{ fontSize: 14.5, color: 'var(--text-secondary)', lineHeight: 1.55, marginBottom: 22, fontFamily: 'var(--font-body)' }}>
                {dialog.body}
              </div>
            )}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => close(false)}
                style={{
                  flex: 1, minHeight: 46, borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-glass)', border: '1px solid var(--border-bright)',
                  color: 'var(--text-primary)', fontSize: 15.5, fontWeight: 600, fontFamily: 'var(--font-body)',
                  cursor: 'pointer', transition: 'background 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-glass-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-glass)'}
              >
                {dialog.cancelLabel}
              </button>
              <button
                autoFocus
                onClick={() => close(true)}
                style={{
                  flex: 1, minHeight: 46, borderRadius: 'var(--radius-md)',
                  background: dialog.danger ? 'var(--brand-error)' : 'var(--brand-primary)',
                  color: '#fff', fontSize: 15.5, fontWeight: 600, fontFamily: 'var(--font-body)',
                  cursor: 'pointer', transition: 'filter 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.08)'}
                onMouseLeave={e => e.currentTarget.style.filter = 'none'}
              >
                {dialog.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  )
}

export const useConfirm = () => {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm must be used inside ConfirmProvider')
  return ctx.confirm
}
