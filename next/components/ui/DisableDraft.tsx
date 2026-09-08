'use client'

import { usePathname } from 'next/navigation'
import { useIsPresentationTool } from 'next-sanity/hooks'
import { NextLink } from '../common/NextLink'

export function DisableDraft({ currentPath }: { currentPath?: string }) {
  const isPresentationTool = useIsPresentationTool()
  const pathname = usePathname()
  const path = currentPath ?? pathname

  if (isPresentationTool) return null

  // const href = path ? `${API.draftDisable}?slug=${path}` : API.draftDisable //TODO: Set this up properly

  const href = path ? `/api/disable-draft?slug=${path}` : `/api/disable-draft`

  return (
    <NextLink
      prefetch={false}
      href={href}
      aria-label='Disable Draft Mode'
      title='Disable draft mode'
      className='button red fixed top-[unset] bottom-4 left-4 z-50'
    >
      Exit draft
    </NextLink>
  )
}
