'use client'

import CloseIcon from '@sanity/icons/Close'
import SearchIcon from '@sanity/icons/Search'
import { useRouter } from 'next/navigation'
import { useEffect, useEffectEvent, useId, useRef, useState } from 'react'
import { cn } from '@/lib/common-utils'
import {
  buildSearchHref,
  isValidSearchQuery,
  SEARCH_PAGE_PATH,
} from '@/lib/script-search'
import { studySitePath } from '@/lib/study-origin'
import { useLocale } from '@/providers/locale/LocaleProvider'
import { useUIStrings } from '@/providers/locale/use-strings'
import { Box } from '../common/Box'
import { Button } from '../common/Button'
import { SearchForm } from '../search/SearchForm'

/** A study's content surface, relative to its own site. */
const STUDY_FEED_PATH = '/scripts'

export type HeaderSearchProps = {
  /** The study whose site this header belongs to, when it is one. Search then
   * finds that study's scripts and lands on its `/scripts` feed instead of the
   * catalog's `/search`, which deliberately carries only catalog entities. */
  studySiteSlug?: string | null
}

/** Header search: the icon expands an inline bar that submits to `/search`, or
 * to the study's `/scripts?q=…` when the header is rendered inside a study.
 *
 * Below `sm` the bar overlays the whole header (so it can never push the
 * notification and profile buttons off a narrow screen); from `sm` up it sits
 * inline, left of the icon. Escape and a press outside close it; focus moves
 * into the input on open and back to the icon on Escape and the close button.
 * An outside press leaves focus wherever the user clicked, and a submit just
 * closes the bar (the icon must not keep focus on the page we navigate to).
 *
 * It does not read the current `?q=`: `useSearchParams` in the root layout
 * would opt every static route into client-side rendering. The study arrives
 * as a prop from the study's own layout for the same reason — that layout
 * knows the handle on the server, so this never reads the host. */
export const HeaderSearch = ({ studySiteSlug }: HeaderSearchProps) => {
  const ui = useUIStrings()
  const { locale } = useLocale()
  const router = useRouter()
  const triggerId = useId()
  const panelId = useId()
  const [open, setOpen] = useState(false)
  const [hasQuery, setHasQuery] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const inStudy = Boolean(studySiteSlug)
  const searchLabel = inStudy
    ? ui.scripts.search.scriptsLabel
    : ui.scripts.search.formAriaLabel
  const searchPlaceholder = inStudy
    ? ui.scripts.search.scriptsPlaceholder
    : ui.scripts.search.placeholder
  const searchBasePath = studySiteSlug
    ? studySitePath(studySiteSlug, STUDY_FEED_PATH, locale)
    : SEARCH_PAGE_PATH

  const close = () => {
    setOpen(false)
    setHasQuery(false)
  }

  const closeAndRestoreFocus = () => {
    close()
    document.getElementById(triggerId)?.focus()
  }

  const handlePointerDown = useEffectEvent((e: PointerEvent) => {
    if (e.target instanceof Node && containerRef.current?.contains(e.target)) {
      return
    }
    setOpen(false)
    setHasQuery(false)
  })

  const handleKeyDown = useEffectEvent((e: KeyboardEvent) => {
    if (e.key === 'Escape') closeAndRestoreFocus()
  })

  useEffect(() => {
    if (!open) return
    inputRef.current?.focus()
    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  const handleValidSubmit = (query: string) => {
    router.push(buildSearchHref(query, searchBasePath))
    close()
  }

  /** The icon opens the bar; while it is open it submits what was typed, and
   * an empty field gives it nothing to search so it just closes. */
  const handleTriggerClick = () => {
    if (!open) {
      setOpen(true)
      return
    }
    const value = inputRef.current?.value ?? ''
    if (isValidSearchQuery(value)) {
      handleValidSubmit(value.trim())
      return
    }
    closeAndRestoreFocus()
  }

  return (
    <div className='flex min-w-0 items-center gap-2' ref={containerRef}>
      <Box
        id={panelId}
        className={cn(
          open ? 'flex' : 'hidden',
          'absolute inset-0 z-10 items-center gap-2 bg-background-250 px-5',
          'sm:static sm:inset-auto sm:z-auto sm:w-60 sm:bg-transparent sm:p-0 md:w-72'
        )}
      >
        {open && (
          <>
            <SearchForm
              compact
              ariaLabel={ui.scripts.search.quickSearchLabel}
              placeholder={searchPlaceholder}
              inputRef={inputRef}
              clearable
              onValidSubmit={handleValidSubmit}
              onValueChange={(value) => setHasQuery(value.trim().length > 0)}
              className='min-w-0 flex-1'
              errorClassName='absolute top-full left-0 z-10 rounded-md bg-background-250 px-2 pb-1'
            />
            <Button
              onClick={closeAndRestoreFocus}
              aria-label={ui.scripts.search.closeSearch}
              className='button ghost p-2 sm:hidden'
            >
              <CloseIcon />
            </Button>
          </>
        )}
      </Box>
      <Button
        id={triggerId}
        onClick={handleTriggerClick}
        aria-label={
          open && !hasQuery ? ui.scripts.search.closeSearch : searchLabel
        }
        aria-expanded={open}
        aria-controls={panelId}
        className={cn('button p-2', open && hasQuery ? 'solid' : 'ghost')}
      >
        <SearchIcon />
      </Button>
    </div>
  )
}
