'use client'

import { type ReactNode, useRef } from 'react'
import { cn } from '@/lib/common-utils'
import { DROPDOWN_CARET, type PTIconComponent } from './PTicons'

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

  const handleBlur = (event: React.FocusEvent<HTMLDetailsElement>) => {
    if (
      detailsRef.current &&
      !detailsRef.current.contains(event.relatedTarget)
    ) {
      detailsRef.current.open = false
    }
  }

  const displayIcons =
    // biome-ignore lint/style/noNestedTernary: <Simplest way to do this>
    icons && icons.length > 0 ? icons.slice(0, 3) : Icon ? [Icon] : []
  return (
    <details ref={detailsRef} onBlur={handleBlur} className='group relative'>
      <summary
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
          const Icon = iconComponent
          return (
            <Icon
              key={index}
              className={cn('flex h-5 w-5 shrink-0', iconClass)}
            />
          )
        })}
        {label && <span className='hidden md:block'>{label}</span>}
        <DROPDOWN_CARET className='h-4 w-4 shrink-0 transition-transform group-open:rotate-180 md:block hidden' />
      </summary>
      <div
        className={cn(
          'absolute right-0 z-10 mt-1 flex max-w-[calc(100vw-1rem)] min-w-max flex-col items-stretch gap-0.5 overflow-x-auto',
          'bg-background-150 rounded-md p-1 text-left'
        )}
      >
        {children}
      </div>
    </details>
  )
}
