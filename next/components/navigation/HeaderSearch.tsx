'use client'

import CloseIcon from '@sanity/icons/Close'
import SearchIcon from '@sanity/icons/Search'
import { UI_STRINGS } from '@shared/config/strings'
import { useRouter } from 'next/navigation'
import { useEffect, useEffectEvent, useId, useRef, useState } from 'react'
import { cn } from '@/lib/common-utils'
import { buildSearchHref } from '@/lib/script-search'
import { Box } from '../common/Box'
import { Button } from '../common/Button'
import { SearchForm } from '../search/SearchForm'

/** Header search: the icon expands an inline bar that submits to `/search`.
 *
 * Below `sm` the bar overlays the whole header (so it can never push the
 * notification and profile buttons off a narrow screen); from `sm` up it sits
 * inline, left of the icon. Escape and a press outside close it; focus moves
 * into the input on open and back to the icon on Escape and the close button.
 * An outside press leaves focus wherever the user clicked, and a submit just
 * closes the bar (the icon must not keep focus on the page we navigate to).
 *
 * It does not read the current `?q=`: `useSearchParams` in the root layout
 * would opt every static route into client-side rendering. */
export const HeaderSearch = () => {
  const router = useRouter()
  const triggerId = useId()
  const panelId = useId()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const closeAndRestoreFocus = () => {
    setOpen(false)
    document.getElementById(triggerId)?.focus()
  }

  const handlePointerDown = useEffectEvent((e: PointerEvent) => {
    if (e.target instanceof Node && containerRef.current?.contains(e.target)) {
      return
    }
    setOpen(false)
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
    router.push(buildSearchHref(query))
    setOpen(false)
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
              ariaLabel={UI_STRINGS.scripts.search.quickSearchLabel}
              inputRef={inputRef}
              onValidSubmit={handleValidSubmit}
              className='min-w-0 flex-1'
              errorClassName='absolute top-full left-0 z-10 rounded-md bg-background-250 px-2 pb-1'
            />
            <Button
              onClick={closeAndRestoreFocus}
              aria-label={UI_STRINGS.scripts.search.closeSearch}
              className='button ghost p-2 sm:hidden'
            >
              <CloseIcon />
            </Button>
          </>
        )}
      </Box>
      <Button
        id={triggerId}
        onClick={() => setOpen(!open)}
        aria-label={UI_STRINGS.scripts.search.formAriaLabel}
        aria-expanded={open}
        aria-controls={panelId}
        className='button ghost p-2'
      >
        <SearchIcon />
      </Button>
    </div>
  )
}
