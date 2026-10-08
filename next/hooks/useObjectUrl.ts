'use client'

import { useEffect, useState } from 'react'

/**
 * Creates (and revokes) a `blob:` object URL for a local `File` — used to
 * preview a file the user has picked but not yet uploaded (e.g. in
 * `CreateScriptModal`, before `useScriptUpload` has sent it anywhere).
 * Returns `null` while there's no file.
 */
export function useObjectUrl(file: File | null): string | null {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!file) {
      // biome-ignore lint/nursery/useReactCompiler: Resetting derived external-resource state when the source file is removed.
      setUrl(null)
      return
    }

    const objectUrl = URL.createObjectURL(file)
    setUrl(objectUrl)

    return () => {
      URL.revokeObjectURL(objectUrl)
    }
  }, [file])

  return url
}
