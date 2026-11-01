'use client'

import { getReadingLinkErrors } from '@shared/utils/link-utils'
import { useState } from 'react'
import { useReadingLinkTouched } from '@/hooks/useReadingLinkTouched'
import type { ReadingLinksFieldProps } from '@/types/components/ReadingLinksField.types'

/**
 * Additional-reading rows plus the "touched" bookkeeping that decides when a
 * half-typed URL is flagged. Shared by both script forms: the inputs are the
 * same, so the state behind them is too.
 */
export function useScriptReadingLinks(initialLinks: Array<string>) {
  const [links, setLinks] = useState(initialLinks)
  const {
    touched,
    touch,
    touchAll,
    reset: resetTouched,
    forgetRemoved,
  } = useReadingLinkTouched()

  const addLink = () => setLinks((current) => [...current, ''])
  const changeLink = (index: number, value: string) =>
    setLinks((current) =>
      current.map((link, currentIndex) =>
        currentIndex === index ? value : link
      )
    )
  // Removing a row shifts every later index down by one.
  const removeLink = (index: number) => {
    setLinks((current) =>
      current.filter((_, currentIndex) => currentIndex !== index)
    )
    forgetRemoved(index)
  }

  const fieldProps = {
    links,
    touched,
    onAdd: addLink,
    onChange: changeLink,
    onRemove: removeLink,
    onTouch: touch,
  } satisfies Omit<ReadingLinksFieldProps, 'disabled'>

  return {
    links,
    fieldProps,
    hasErrors: getReadingLinkErrors(links).some((error) => error !== null),
    touchAll: () => touchAll(links.length),
    /** The trimmed, non-empty list both endpoints expect. */
    toPayload: () => links.map((link) => link.trim()).filter(Boolean),
    reset: (next: Array<string> = []) => {
      setLinks(next)
      resetTouched()
    },
  }
}

export type UseScriptReadingLinksReturn = ReturnType<
  typeof useScriptReadingLinks
>
