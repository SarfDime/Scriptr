'use client'

import {
  STRING_PACKS,
  type StringPackId,
  type StringPackPath,
} from '@shared/config/string-packs'
import { UI_STRINGS_PACK } from '@shared/config/strings'
import type {
  ResolvedStrings,
  StringPathArgs,
} from '@shared/types/localization.types'
import { getMessage, getStrings } from '@shared/utils/localized-strings'
import { useLocale } from './LocaleProvider'

/**
 * A string collection in the language the reader picked. The component
 * re-renders when that changes, and the same object comes back for a given
 * language, so nothing downstream needs memoising.
 *
 * A collection that has not been translated yet resolves to itself, which is
 * what lets a collection be migrated one entry at a time. Only the collection
 * most components read has a named hook; another comes through
 * `useStrings(CALENDAR_STRINGS_PACK)`.
 */
export function useStrings<T extends object>(strings: T): ResolvedStrings<T> {
  const { locale } = useLocale()
  return getStrings(strings, locale)
}

export function useUIStrings() {
  return useStrings(UI_STRINGS_PACK)
}

type CopyOptions<P extends StringPackId> = {
  /** Which collection the path is read from. Defaults to `UI_STRINGS`. */
  pack?: P
  args?: StringPathArgs<(typeof STRING_PACKS)[P], StringPackPath<P>>
}

/**
 * One message as a plain string, for a Client Component that needs copy where a
 * node cannot go: an attribute (`aria-label`, `title`), or a prop typed
 * `string`.
 *
 * A Server Component does not need this: it awaits `getServerStrings`
 * (`next/lib/server-strings.ts`) and renders the string directly.
 */
export function useCopy<P extends StringPackId = 'ui'>(
  path: StringPackPath<P>,
  options: CopyOptions<P> = {}
): string {
  const pack = options.pack ?? 'ui'
  const args = (options.args ?? []) as ReadonlyArray<string | number>
  const strings = useStrings(STRING_PACKS[pack])

  return getMessage(strings, path, args) ?? ''
}
