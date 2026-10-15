'use client'

import {
  createContext,
  use,
  useEffect,
  useState,
  useSyncExternalStore,
} from 'react'
import { Box } from '@/components/common/Box'
import { cn } from '../../lib/common-utils'

type LoadingContextType = {
  isReady: boolean
  startTask: (key: string) => void
  finishTask: (key: string) => void
}

const LoadingContext = createContext<LoadingContextType | null>(null)

const LOGO_LETTERS = ['S', 'c', 'r', 'i', 'p', 't', 'r']
const JUMP_DELAYS = [0.15, 0.42, 0.08, 0.55, 0.25, 0.62, 0.5]
const HANG_DELAY = 750

const emptySubscribe = () => () => undefined
const getClientSnapshot = () => true
const getServerSnapshot = () => false

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [pendingTasks, setPendingTasks] = useState<Set<string>>(new Set())

  const isClient = useSyncExternalStore(
    emptySubscribe,
    getClientSnapshot,
    getServerSnapshot
  )

  const [phase, setPhase] = useState<
    'loading' | 'hanging' | 'exiting' | 'hidden'
  >('loading')

  const startTask = (key: string) =>
    setPendingTasks((prev) => new Set(prev).add(key))

  const finishTask = (key: string) =>
    setPendingTasks((prev) => {
      const next = new Set(prev)
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

  return (
    <LoadingContext value={{ isReady, startTask, finishTask }}>
      {children}

      {phase !== 'hidden' && (
        <Box
          aria-hidden={phase === 'exiting'}
          className={cn(
            'ui-loading-overlay fixed inset-0 z-50 flex items-center justify-center bg-background-100/70 backdrop-blur-xl transition-all duration-500 ease-in-out',
            phase === 'exiting'
              ? 'pointer-events-none scale-105 opacity-0'
              : 'scale-100 opacity-100'
          )}
        >
          <Box className='flex items-baseline text-7xl sm:text-8xl md:text-9xl font-black tracking-tight font-olive'>
            {LOGO_LETTERS.map((letter, index) => (
              <Box
                key={index}
                className='inline-block select-none text-fg animate-jump'
                style={{
                  animationDelay: `${JUMP_DELAYS[index]}s`,
                }}
              >
                {letter}
              </Box>
            ))}

            <Box
              className='inline-block h-[0.25em] w-[0.25em] ml-[0.05em] rounded-full bg-linear-to-r from-brand-400 to-brand-500 animate-jump'
              style={{
                animationDelay: '0.9s',
              }}
            />
          </Box>
        </Box>
      )}
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
