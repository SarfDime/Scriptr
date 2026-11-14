'use client'

import type { LocaleId } from '@shared/config/localization-constants'
import { setActiveLocale } from '@shared/utils/localized-strings'
import { createContext, use, useEffect } from 'react'

type LocaleContextValue = {
  locale: LocaleId
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

/**
 * Holds the language Client Components read their copy in. It is the route's
 * language, handed down from the root layout, so the server and the client
 * always agree: `/mk/…` renders Macedonian on both sides, and no stored
 * preference can flip a page after hydration.
 *
 * There is no `setLocale`: switching language is a navigation to the other
 * locale's address (`LanguageToggle`), and the preference that `/` and a study
 * host's root read is written by `setStoredLocale`, not by this tree.
 */
export function LocaleProvider({
  locale,
  children,
}: {
  locale: LocaleId
  children: React.ReactNode
}) {
  // Mirrors the language onto things outside React: `<html lang>` for screen
  // readers, and the module-level value the non-hook helpers read.
  useEffect(() => {
    setActiveLocale(locale)
    document.documentElement.lang = locale
  }, [locale])

  return <LocaleContext value={{ locale }}>{children}</LocaleContext>
}

export function useLocale() {
  const context = use(LocaleContext)
  if (!context) {
    throw new Error('useLocale must be used within a LocaleProvider')
  }
  return context
}
