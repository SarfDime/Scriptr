'use client'

import { useEffect } from 'react'

/**
 * Creates (and revokes) a `blob:` object URL for a local `File` — used to
 * preview a file the user has picked but not yet uploaded (e.g. in
 * `CreateScriptModal`, before `useScriptUpload` has sent it anywhere).
 * Returns `null` while there's no file.
 */
export function useObjectUrl(file: File | null): string | null {
  const url = file ? URL.createObjectURL(file) : null

  useEffect(() => {
    return () => {
      if (url) URL.revokeObjectURL(url)
    }
  }, [url])

  return url
}
