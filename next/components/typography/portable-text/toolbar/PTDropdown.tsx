'use client'

import { type ReactNode, useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/common-utils'
import { DROPDOWN_CARET, type PTIconComponent } from './PTicons'

/** Gap between the panel and the edge of the viewport, and above/below the trigger. */
const VIEWPORT_MARGIN = 8
const TRIGGER_GAP = 4
/** A long list scrolls instead of running off the screen. */
const PANEL_MAX_HEIGHT = 320
/** Never taller than this, even when the trigger sits near an edge. */
const PANEL_MIN_HEIGHT = 96

type PanelPosition = { top: number; left: number; maxHeight: number }

export const PTDropdown = ({
  label,
  title,
  icon: Icon,
  icons,
  iconClass,
  active = false,
  children,
}: {
  label?: string
  title?: string
  icon?: PTIconComponent
  icons?: Array<PTIconComponent>
  iconClass?: string
  /** Something inside is selected: the trigger takes the accent. */
  active?: boolean
  children: ReactNode
}) => {
  const detailsRef = useRef<HTMLDetailsElement>(null)
  const summaryRef = useRef<HTMLElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState<PanelPosition | null>(null)

  /**
   * Places the panel against the viewport instead of against the trigger. The
   * toolbar scrolls horizontally and the editor sits in clipped, scrolling
   * containers, so an absolutely positioned panel gets cut off by them and can
   * run past either edge — the leftmost dropdowns hung off the left of the
   * screen. Clamping to `innerWidth` keeps it on screen, and it flips above the
   * trigger when there is no room below.
   */
  const place = () => {
    const trigger = summaryRef.current
    if (!trigger) return

    const rect = trigger.getBoundingClientRect()
    const panel = panelRef.current
    const panelWidth = panel?.offsetWidth ?? rect.width
    const panelHeight = panel?.offsetHeight ?? PANEL_MAX_HEIGHT
    const maxLeft = window.innerWidth - panelWidth - VIEWPORT_MARGIN
    const spaceBelow = window.innerHeight - rect.bottom - VIEWPORT_MARGIN
    const spaceAbove = rect.top - VIEWPORT_MARGIN
    const openUp =
      spaceBelow < Math.min(panelHeight, PANEL_MAX_HEIGHT) &&
      spaceAbove > spaceBelow
    const maxHeight = Math.max(
      PANEL_MIN_HEIGHT,
      Math.min(PANEL_MAX_HEIGHT, openUp ? spaceAbove : spaceBelow)
    )

    setPosition({
      top: openUp
        ? rect.top - Math.min(panelHeight, maxHeight) - TRIGGER_GAP
        : rect.bottom + TRIGGER_GAP,
      left: Math.min(
        Math.max(VIEWPORT_MARGIN, rect.left),
        Math.max(VIEWPORT_MARGIN, maxLeft)
      ),
      maxHeight,
    })
  }

  const close = () => {
    if (detailsRef.current) detailsRef.current.open = false
    setPosition(null)
  }

  const handleBlur = (event: React.FocusEvent<HTMLDetailsElement>) => {
    if (
      detailsRef.current &&
      !detailsRef.current.contains(event.relatedTarget)
    ) {
      close()
    }
  }

  const handleToggle = (event: React.SyntheticEvent<HTMLDetailsElement>) => {
    if (event.currentTarget.open) {
      place()
      return
    }
    setPosition(null)
  }

  // An open panel is anchored to a rectangle that stops being right the moment
  // the page scrolls, and the panel escapes the scroll container, so it would
  // hang in place while its trigger moves away. Closing is the honest answer.
  useEffect(() => {
    if (!position) return

    const onScroll = () => close()
    const onResize = () => place()

    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onResize)

    return () => {
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onResize)
    }
  })

  const displayIcons =
    // biome-ignore lint/style/noNestedTernary: <Simplest way to do this>
    icons && icons.length > 0 ? icons.slice(0, 3) : Icon ? [Icon] : []

  return (
    // biome-ignore lint/a11y/noNoninteractiveElementInteractions: `details` is the interactive element; blur and toggle are what keep the panel open only while its trigger has focus.
    <details
      ref={detailsRef}
      onBlur={handleBlur}
      onToggle={handleToggle}
      className='group relative'
    >
      <summary
        ref={summaryRef}
        title={title}
        aria-label={title ?? label}
        className={cn(
          'button button-sm subtle rounded-sm py-0.5 px-1 pl-0.5',
          'list-none select-none',
          '[&::-webkit-details-marker]:hidden',
          active && ' bg-brand-300/15'
        )}
      >
        {displayIcons?.map((iconComponent, index) => {
          const IconComponent = iconComponent
          return (
            <IconComponent
              key={index}
              className={cn('flex h-5 w-5 shrink-0', iconClass)}
            />
          )
        })}
        {label && <span className='hidden md:block'>{label}</span>}
        <DROPDOWN_CARET className='h-4 w-4 shrink-0 transition-transform group-open:rotate-180 md:block hidden' />
      </summary>
      <div
        ref={panelRef}
        style={{
          top: position?.top,
          left: position?.left,
          maxHeight: position?.maxHeight,
          maxWidth: `calc(100vw - ${VIEWPORT_MARGIN * 2}px)`,
          visibility: position ? 'visible' : 'hidden',
        }}
        className={cn(
          'fixed z-50 flex flex-col items-stretch gap-0.5 overflow-y-auto',
          'bg-background-150 rounded-md p-1 text-left'
        )}
      >
        {children}
      </div>
    </details>
  )
}
