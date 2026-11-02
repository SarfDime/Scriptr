'use client'

import { useState } from 'react'

/**
 * Load state shared by the admin lists. `initialItems` is what the server
 * loader returned (`null` when it failed, which starts in the error state), and
 * `load` re-fetches through whichever call the list needs.
 */
export function useAdminList<T>(initialItems: Array<T> | null) {
  const [items, setItems] = useState<Array<T>>(initialItems ?? [])
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState(initialItems === null)

  const load = (fetchItems: () => Promise<Array<T>>) => {
    setLoading(true)
    setLoadError(false)
    return fetchItems()
      .then((result) => {
        setItems(result)
        setLoading(false)
      })
      .catch(() => {
        setLoadError(true)
        setLoading(false)
      })
  }

  return { items, setItems, loading, loadError, load }
}
