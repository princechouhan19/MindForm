// useSync — debounced auto-save hook with server-first protection.
// Fixes the critical race where switching weeks/months fired a save with
// stale/default data before the fresh GET returned (data loss).

import { useRef, useEffect, useState } from 'react'

/**
 * @param {(payload: unknown) => Promise<unknown>} saveFn - persist function
 * @param {unknown} data  - reactive data to serialize
 * @param {object} opts
 * @param {boolean} opts.ready  - only start saving once initial data has loaded
 *                                 (prevents defaults overwriting server data)
 * @param {number}  opts.delay  - debounce ms (default 1500)
 * @returns {'idle'|'saving'|'saved'|'error'}
 */
export default function useSync(saveFn, data, opts = {}) {
  const { ready = true, delay = 1500 } = opts
  const [status, setStatus] = useState('idle')

  const serialized = JSON.stringify(data)
  const serializedRef = useRef(serialized)
  const saveFnRef = useRef(saveFn)
  const latestDataRef = useRef(data)
  const timerRef = useRef(null)
  const resetTimerRef = useRef(null)
  const savingRef = useRef(false)
  const pendingRef = useRef(false)

  // keep refs fresh without re-triggering the effect
  saveFnRef.current = saveFn
  latestDataRef.current = data

  useEffect(() => {
    if (!ready) {
      serializedRef.current = serialized
      return
    }
    if (serialized === serializedRef.current) return
    serializedRef.current = serialized

    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      if (savingRef.current) {
        pendingRef.current = true
        return
      }
      savingRef.current = true
      setStatus('saving')
      try {
        await saveFnRef.current(latestDataRef.current)
        setStatus('saved')
        clearTimeout(resetTimerRef.current)
        resetTimerRef.current = setTimeout(() => setStatus('idle'), 2000)
      } catch (err) {
        console.error('Auto-save failed:', err)
        setStatus('error')
      } finally {
        savingRef.current = false
        if (pendingRef.current) {
          pendingRef.current = false
          // run one follow-up save immediately with the latest data
          setStatus('saving')
          try {
            await saveFnRef.current(latestDataRef.current)
            setStatus('saved')
            clearTimeout(resetTimerRef.current)
            resetTimerRef.current = setTimeout(() => setStatus('idle'), 2000)
          } catch (err) {
            console.error('Auto-save retry failed:', err)
            setStatus('error')
          }
        }
      }
    }, delay)

    return () => clearTimeout(timerRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serialized, ready, delay])

  // cleanup unmount timers
  useEffect(() => () => {
    clearTimeout(timerRef.current)
    clearTimeout(resetTimerRef.current)
  }, [])

  return status
}

export { useSync }
