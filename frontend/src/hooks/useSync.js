import { useEffect, useRef, useState } from 'react'

// Debounced auto-sync to backend
export function useSync(saveFn, data, delay = 1500) {
  const [status, setStatus] = useState('idle') // idle | saving | saved | error
  const timerRef = useRef(null)
  const isFirstRender = useRef(true)

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    setStatus('saving')
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      try {
        await saveFn(data)
        setStatus('saved')
        setTimeout(() => setStatus('idle'), 2000)
      } catch (err) {
        setStatus('error')
        console.error('Sync error:', err)
      }
    }, delay)

    return () => clearTimeout(timerRef.current)
  }, [JSON.stringify(data)])

  return status
}
