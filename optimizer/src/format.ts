const KIB = 1024
const MIB = KIB * 1024
const MAX_ERROR_LENGTH = 300

/** How sizes read in the logs: `3.50 MB`, `812.0 KB`, `93 B`. */
export const formatBytes = (bytes: number): string => {
  if (bytes >= MIB) return `${(bytes / MIB).toFixed(2)} MB`
  if (bytes >= KIB) return `${(bytes / KIB).toFixed(1)} KB`
  return `${bytes} B`
}

export const formatDuration = (ms: number): string =>
  ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`

/** An error's message for a log line: short, since tools like Ghostscript
 * can echo a whole command line. */
export const describeError = (error: unknown): string =>
  (error instanceof Error ? error.message : String(error)).slice(
    0,
    MAX_ERROR_LENGTH
  )
