'use client'

/**
 * Calls `onChange` when another tab writes `key` — the persisted preferences
 * (language, theme, simple mode, navbar) all stay in step that way.
 *
 * A `storage` event never fires in the tab that made the change, so a listener
 * cannot echo the write back and loop. `key` is `null` when another tab called
 * `localStorage.clear()`, which is reported as `null` so the caller can fall
 * back to its default.
 */
export const subscribeToStorage = (
  key: string,
  onChange: (value: string | null) => void
): (() => void) => {
  const onStorage = (event: StorageEvent) => {
    if (event.key !== null && event.key !== key) return
    onChange(event.key === null ? null : event.newValue)
  }

  window.addEventListener('storage', onStorage)

  return () => window.removeEventListener('storage', onStorage)
}
