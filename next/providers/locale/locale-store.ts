'use client'

import type { LocaleId } from '@shared/config/localization-constants'

/**
 * The reader's language as a preference — what `/` and a study host's root read
 * when deciding where to send someone. Nothing renders from it: the language a
 * page is in comes from its `[locale]` segment, so the store has no
 * subscription and no snapshot, only a write.
 *
 * `localStorage` keeps it for the browser and the cookie for the config
 * redirect, which can read nothing else.
 */
const storageKey = 'scriptr-language'

export const setStoredLocale = (locale: LocaleId): void => {
  try {
    window.localStorage.setItem(storageKey, locale)
    // A preference, not a credential: no `HttpOnly`, a year, and `lax` so it
    // never rides a cross-site POST.
    // biome-ignore lint/suspicious/noDocumentCookie: the Cookie Store API is not available in every browser this app supports, and the value must be written where the redirect can read it.
    document.cookie = `${storageKey}=${locale}; path=/; max-age=31536000; samesite=lax`
  } catch {
    // Storage unavailable (private mode, blocked): the redirect keeps the last
    // language it saw, and the page the reader is on is already correct.
  }
}
