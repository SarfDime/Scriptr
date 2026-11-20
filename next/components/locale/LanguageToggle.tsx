'use client'

import { LANGUAGE_FLAGS } from '@shared/components/language-flags'
import {
  SUPPORTED_LANGUAGES,
  type SupportedLanguage,
} from '@shared/config/localization-constants'
import { localizedPath, unprefixedPath } from '@shared/utils/localized-path'
import { usePathname, useRouter } from 'next/navigation'
import { Fragment, useEffect, useRef } from 'react'
import { cn } from '@/lib/common-utils'
import { useLoading } from '@/providers/loading/LoadingProvider'
import { useLocale } from '@/providers/locale/LocaleProvider'
import { setStoredLocale } from '@/providers/locale/locale-store'
import { useUIStrings } from '@/providers/locale/use-strings'
import { Box } from '../common/Box'
import { NextLink } from '../common/NextLink'
import { Divider } from '../ui/Divider'
import { Skeleton } from '../ui/skeleton/Skeleton'

/**
 * Switches the language by navigating to the same page in the other language:
 * the address is the state, so the destination is a prerendered document rather
 * than a re-render in place, and a shared link carries the language with it.
 *
 * The query string is kept for the pages that carry one (`?view=…&date=…` on the
 * calendar) by re-applying it on click. `useSearchParams` would make every page
 * that renders the navbar bail out of static rendering, which is the one thing
 * this migration exists to avoid; a plain `href` is also what a crawler and a
 * middle-click follow.
 *
 * The chosen language is recorded as a preference as well, because `/` and a
 * study host's root read it to pick where a reader lands next time.
 *
 * Each option carries its flag and its short code (`EN`, `MKD`), which is
 * shorter than either language's own name and recognised without reading the
 * other one.
 *
 * Pressing an option starts the global loader, because the switch is a
 * navigation to another document: until that document mounts (and starts its
 * own boot tasks) the press would otherwise look like nothing happened.
 */

/** The loader task a language switch holds; keyed so it cannot pile up on a
 * second press before the first navigation lands. */
const LANGUAGE_SWITCH_TASK = 'locale-switch'

/** A switch that never lands must not leave the overlay up — it is a modal
 * dialog with Escape disabled, so a task with no owner would freeze the page. */
const SWITCH_TIMEOUT_MS = 15_000

export function LanguageToggle({ className }: { className?: string }) {
  const UI_STRINGS = useUIStrings()
  const { locale } = useLocale()
  const pathname = usePathname()
  const router = useRouter()
  const { startTask, finishTask } = useLoading()

  /** The page a switch was started from; the loader stays up until the address
   * changes, so it covers the gap rather than the new page. */
  const switchingFromRef = useRef<string | null>(null)
  const switchTimeoutRef = useRef<number | null>(null)

  /** Opens the loader for the navigation the press just started. */
  const beginSwitch = () => {
    switchingFromRef.current = pathname
    startTask(LANGUAGE_SWITCH_TASK)
    switchTimeoutRef.current = window.setTimeout(() => {
      switchingFromRef.current = null
      switchTimeoutRef.current = null
      finishTask(LANGUAGE_SWITCH_TASK)
    }, SWITCH_TIMEOUT_MS)
  }

  useEffect(() => {
    if (switchingFromRef.current === null) return
    if (switchingFromRef.current === pathname) return

    switchingFromRef.current = null
    if (switchTimeoutRef.current !== null) {
      window.clearTimeout(switchTimeoutRef.current)
      switchTimeoutRef.current = null
    }
    finishTask(LANGUAGE_SWITCH_TASK)
  }, [pathname, finishTask])

  // The toggle can also leave the screen before the address changes (the drawer
  // closes on navigation), and a task left behind would hold the overlay open.
  useEffect(
    () => () => {
      if (switchTimeoutRef.current !== null) {
        window.clearTimeout(switchTimeoutRef.current)
      }
      finishTask(LANGUAGE_SWITCH_TASK)
    },
    [finishTask]
  )

  const hrefFor = (language: SupportedLanguage): string =>
    localizedPath(unprefixedPath(pathname), language.id)

  return (
    <fieldset
      className={cn(
        'ui-above-inside p-1.5 gap-1 flex flex-col w-fit mx-auto',
        className
      )}
    >
      <legend className='sr-only'>{UI_STRINGS.general.language}</legend>
      {SUPPORTED_LANGUAGES.map((language, index) => {
        const isActive = locale === language.id
        const href = hrefFor(language)
        const Flag = LANGUAGE_FLAGS[language.id]

        return (
          <Fragment key={language.id}>
            {index > 0 && <Divider orientation='vertical' aria-hidden='true' />}
            <NextLink
              className='button ghost grow gap-2 px-1 py-2 text-sm rounded-lg'
              href={href}
              isActive={isActive}
              aria-current={isActive ? 'page' : undefined}
              onClick={(event) => {
                setStoredLocale(language.id)

                if (!isActive) beginSwitch()

                // With a query or a hash a plain link would drop it, so the
                // navigation is made here instead.
                const suffix = `${window.location.search}${window.location.hash}`
                if (!suffix) return
                event.preventDefault()
                router.push(`${href}${suffix}`)
              }}
            >
              <Flag aria-hidden='true' className='h-4 w-4 overwrite shrink-0' />
              {language.nativeTitle}
            </NextLink>
          </Fragment>
        )
      })}
    </fieldset>
  )
}

/**
 * Reserves the control's box while the route's URL is unknown: a route with a
 * reader-supplied segment cannot build the other language's address in its
 * static shell. The control itself replaces this as soon as the URL resolves.
 */
export function LanguageToggleFallback({ className }: { className?: string }) {
  return (
    <Box
      className={cn(
        'ui-above-inside p-1.5 gap-1 flex flex-col w-fit mx-auto',
        className
      )}
      aria-hidden='true'
    >
      <Skeleton loading className='h-8 w-20 rounded-lg' />
      <Skeleton loading className='h-8 w-20 rounded-lg' />
    </Box>
  )
}
