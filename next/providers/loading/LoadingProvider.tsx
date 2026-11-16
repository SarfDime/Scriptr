'use client'

import {
  createContext,
  use,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'
import { Box } from '@/components/common/Box'
import { Text } from '@/components/typography/Text'
import { useBodyScrollLock } from '@/hooks/useBodyScroll'
import { useIsomorphicLayoutEffect } from '@/hooks/useIsomorphicLayoutEffect'
import { useUIStrings } from '@/providers/locale/use-strings'
import { cn } from '../../lib/common-utils'

/** What the overlay says under the logo. Both are optional: a task with no
 * details (the theme boot, say) just shows the animation. */
export type LoadingTaskDetails = {
  /** What is happening right now, e.g. "Optimizing files…". */
  message?: string
  /** One standing line under it, e.g. why the wait is worth it. */
  hint?: string
}

type LoadingContextType = {
  isReady: boolean
  /** Whether the overlay is on screen right now, splash included. `isReady`
   * only says no task is pending, which is already true before the splash has
   * finished leaving. */
  isOverlayVisible: boolean
  startTask: (key: string, details?: LoadingTaskDetails) => void
  finishTask: (key: string) => void
}

const LoadingContext = createContext<LoadingContextType | null>(null)

const LOGO_LETTERS = ['S', 'c', 'r', 'i', 'p', 't', 'r']
const JUMP_DELAYS = [0.15, 0.42, 0.08, 0.55, 0.25, 0.62, 0.5]
const HANG_DELAY = 750

const emptySubscribe = () => () => undefined
const getClientSnapshot = () => true
const getServerSnapshot = () => false

/** What the overlay shows. Shared by the dialog and the stand-in that covers the
 * first frame; `animated` is false for the stand-in because the wordmark's jump
 * is infinite, and starting it there and again in the dialog would visibly
 * restart it a few hundred milliseconds in. */
function LoadingContent({
  details,
  animated,
}: {
  details: LoadingTaskDetails
  animated: boolean
}) {
  return (
    <Box className='ui-stack items-center justify-center gap-6 px-6 text-center'>
      <Box className='flex items-baseline text-7xl sm:text-8xl md:text-9xl font-black tracking-tight font-olive'>
        {LOGO_LETTERS.map((letter, index) => (
          <Box
            key={index}
            className={cn(
              'inline-block select-none text-fg',
              animated && 'animate-jump'
            )}
            style={
              animated
                ? { animationDelay: `${JUMP_DELAYS[index]}s` }
                : undefined
            }
          >
            {letter}
          </Box>
        ))}

        <Box
          className={cn(
            'inline-block h-[0.25em] w-[0.25em] ml-[0.05em] rounded-full bg-linear-to-r from-brand-400 to-brand-500',
            animated && 'animate-jump'
          )}
          style={animated ? { animationDelay: '0.9s' } : undefined}
        />
      </Box>

      {details.message && (
        <Text role='status' aria-live='polite' className='ui-title-modern'>
          {details.message}
        </Text>
      )}

      {details.hint && (
        <Text className='ui-label-modern max-w-prose'>{details.hint}</Text>
      )}
    </Box>
  )
}

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const ui = useUIStrings()
  const [pendingTasks, setPendingTasks] = useState<
    Map<string, LoadingTaskDetails>
  >(new Map())
  const dialogRef = useRef<HTMLDialogElement>(null)
  /** Whether the dialog has been promoted to the top layer. Tracked here rather
   * than asked of the DOM, since `:modal` is not in every supported browser and
   * calling `showModal()` on a modal dialog throws. */
  const isModalRef = useRef(false)

  const isClient = useSyncExternalStore(
    emptySubscribe,
    getClientSnapshot,
    getServerSnapshot
  )

  const [phase, setPhase] = useState<
    'loading' | 'hanging' | 'exiting' | 'hidden'
  >('loading')

  // Both only close over `setPendingTasks`, so React Compiler gives them a
  // stable identity — callers hold a task from an effect that lists them as
  // dependencies, and a fresh function every render would make that effect
  // start a task, re-render and start it again.
  const startTask = (key: string, details?: LoadingTaskDetails) =>
    setPendingTasks((prev) => new Map(prev).set(key, details ?? {}))

  const finishTask = (key: string) =>
    setPendingTasks((prev) => {
      if (!prev.has(key)) return prev
      const next = new Map(prev)
      next.delete(key)
      return next
    })

  useEffect(() => {
    if (!isClient) {
      return undefined
    }

    if (pendingTasks.size === 0) {
      const transitionTimer = setTimeout(() => {
        setPhase('hanging')
      }, 0)

      const hangTimer = setTimeout(() => {
        setPhase('exiting')
      }, HANG_DELAY)

      return () => {
        clearTimeout(transitionTimer)
        clearTimeout(hangTimer)
      }
    }

    const loadTimer = setTimeout(() => {
      setPhase('loading')
    }, 0)

    return () => clearTimeout(loadTimer)
  }, [isClient, pendingTasks.size])

  useEffect(() => {
    if (phase !== 'exiting') {
      return undefined
    }

    const exitTimer = setTimeout(() => {
      setPhase('hidden')
    }, 500)

    return () => {
      clearTimeout(exitTimer)
    }
  }, [phase])

  const isReady = isClient && pendingTasks.size === 0

  // The last task to start owns the words: it is the one the user just caused.
  const details = [...pendingTasks.values()].at(-1) ?? {}

  const isVisible = phase !== 'hidden'
  useBodyScrollLock({ isLocked: isVisible })

  // `loading.module.css` keeps the veil fully opaque until this attribute shows
  // up: the server-rendered stand-in must not show the page behind it, and
  // hydration is the point where the theme and simple mode have settled — so
  // that is when the fade to the resting translucency starts. It is never
  // removed, so a later task opening the overlay does not replay the fade.
  useEffect(() => {
    if (!isClient) return
    document.documentElement.dataset.loaderReady = ''
  }, [isClient])

  // The dialog only paints once it is modal, and it cannot be made modal until
  // after hydration — so something has to cover the first frames. A plain
  // element carrying the same class does that, and is replaced by the dialog in
  // the same commit, before paint.
  const [hasDialog, setHasDialog] = useState(false)

  useIsomorphicLayoutEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (isVisible) {
      if (!isModalRef.current) {
        dialog.showModal()
        isModalRef.current = true
      }
      setHasDialog(true)
      return
    }
    if (isModalRef.current) {
      dialog.close()
      isModalRef.current = false
    }
  }, [isVisible])

  return (
    <LoadingContext
      value={{ isReady, isOverlayVisible: isVisible, startTask, finishTask }}
    >
      {children}

      {/* Covers the first paint, before the dialog above can be opened. Rendered
       * on the server as well, so there is no frame showing the page instead. */}
      {isVisible && !hasDialog && (
        <div
          aria-hidden={true}
          className='ui-loading-overlay flex items-center justify-center'
        >
          <LoadingContent details={details} animated={false} />
        </div>
      )}

      <dialog
        ref={dialogRef}
        aria-label={ui.general.loading}
        aria-busy={true}
        onCancel={(event) => event.preventDefault()}
        className={cn(
          'ui-loading-overlay',
          phase === 'exiting' && 'ui-loading-overlay-exiting'
        )}
      >
        <LoadingContent details={details} animated={true} />
      </dialog>
    </LoadingContext>
  )
}

export function useLoading() {
  const context = use(LoadingContext)
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider')
  }
  return context
}
