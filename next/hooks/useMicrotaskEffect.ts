import { useEffect, useRef } from 'react'

/**
 * Executes a callback asynchronously in a microtask immediately after mount.
 * Use this to safely read from localStorage/IndexedDB to avoid Next.js
 * hydration mismatches.
 *
 * The callback is kept in a ref, but the ref is only ever written inside an
 * effect — never during render, which the React Compiler flags as an
 * impure render. The mount effect below only reads `callbackRef.current`
 * and runs once: callers pass a fresh inline arrow function every render,
 * so depending on the callback directly would rerun this on every render
 * instead of just on mount.
 */
export const useMicrotaskEffect = (callback: () => void) => {
  const callbackRef = useRef(callback)

  useEffect(() => {
    callbackRef.current = callback
  })

  useEffect(() => {
    let active = true

    queueMicrotask(() => {
      if (active) callbackRef.current()
    })

    return () => {
      active = false
    }
    // Intentionally mount-only — see comment above.
  }, [])
}
