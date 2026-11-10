import React, { createContext, useContext, useState, useCallback, useRef, useMemo } from 'react'
import { CheckCircle2, AlertCircle, Info, XCircle } from 'lucide-react'

const ToastContext = createContext(null)

let idCounter = 0

const KIND = {
  success: { icon: CheckCircle2, color: 'var(--brand-success)' },
  error:   { icon: XCircle,      color: 'var(--brand-error)' },
  info:    { icon: Info,         color: 'var(--brand-primary)' },
  warning: { icon: AlertCircle,  color: 'var(--brand-orange)' },
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timers = useRef({})

  const dismiss = useCallback((id) => {
    setToasts(list => list.map(t => t.id === id ? { ...t, leaving: true } : t))
    setTimeout(() => setToasts(list => list.filter(t => t.id !== id)), 280)
    clearTimeout(timers.current[id])
    delete timers.current[id]
  }, [])

  const show = useCallback((message, kind = 'info', duration = 3200) => {
    const id = ++idCounter
    setToasts(list => [...list.slice(-3), { id, message, kind }])
    timers.current[id] = setTimeout(() => dismiss(id), duration)
    return id
  }, [dismiss])

  const value = useMemo(() => ({
    success: (msg, d) => show(msg, 'success', d),
    error: (msg, d) => show(msg, 'error', d || 4200),
    info: (msg, d) => show(msg, 'info', d),
    warning: (msg, d) => show(msg, 'warning', d),
  }), [show])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        style={{
          position: 'fixed', top: 14, left: '50%', transform: 'translateX(-50%)',
          zIndex: 10000, display: 'flex', flexDirection: 'column', gap: 8,
          alignItems: 'center', pointerEvents: 'none', width: 'min(92vw, 380px)',
        }}
      >
        {toasts.map(({ id, message, kind, leaving }) => {
          const { icon: Icon, color } = KIND[kind] || KIND.info
          return (
            <div key={id} className={`mf-toast ${leaving ? 'leaving' : ''}`} role="status" onClick={() => dismiss(id)}>
              <Icon size={17} style={{ color, flexShrink: 0 }} />
              <span style={{ flex: 1 }}>{message}</span>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}
