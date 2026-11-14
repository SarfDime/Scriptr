'use client'

import {
  SUPPORTED_LANGUAGES,
  type SupportedLanguage,
} from '@shared/config/localization-constants'
import { localizedPath, unprefixedPath } from '@shared/utils/localized-path'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/common-utils'
import { useLocale } from '@/providers/locale/LocaleProvider'
import { setStoredLocale } from '@/providers/locale/locale-store'
import { useUIStrings } from '@/providers/locale/use-strings'
import { NextLink } from '../common/NextLink'

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
 * Each option is named in its own language — someone looking for Macedonian
 * should recognise it without already reading English.
 */
export function LanguageToggle({ className }: { className?: string }) {
  const UI_STRINGS = useUIStrings()
  const { locale } = useLocale()
  const pathname = usePathname()
  const router = useRouter()

  const hrefFor = (language: SupportedLanguage): string =>
    localizedPath(unprefixedPath(pathname), language.id)

  return (
    <fieldset
      className={cn(
        'ui-above-inside p-1.5 gap-1.5 flex flex-col w-fit mx-auto',
        className
      )}
    >
      <legend className='sr-only'>{UI_STRINGS.general.language}</legend>
      {SUPPORTED_LANGUAGES.map((language) => {
        const isActive = locale === language.id
        const href = hrefFor(language)

        return (
          <NextLink
            className='button ghost grow px-1.5 py-2 text-sm rounded-lg'
            href={href}
            isActive={isActive}
            aria-current={isActive ? 'page' : undefined}
            key={language.id}
            onClick={(event) => {
              setStoredLocale(language.id)

              // With a query or a hash a plain link would drop it, so the
              // navigation is made here instead.
              const suffix = `${window.location.search}${window.location.hash}`
              if (!suffix) return
              event.preventDefault()
              router.push(`${href}${suffix}`)
            }}
          >
            {language.nativeTitle}
          </NextLink>
        )
      })}
    </fieldset>
  )
}
