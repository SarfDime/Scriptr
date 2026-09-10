'use client'

import BookmarkIcon from '@sanity/icons/Bookmark'
import { useState } from 'react'
import { Button } from '@/components/common/Button'
import { cn } from '@/lib/common-utils'
import type { ScriptSaveButtonProps } from '@/types/components/Scripts.types'

/** Save/bookmark toggle for a single script. Owns its own saved state
 * locally — callers only need to identify the script, not track which
 * scripts are saved.
 * TODO: wire this up to actually persist the saved state.
 */
export const ScriptSaveButton = ({
  id,
  scriptTitle,
  className,
  iconProps,
  ...props
}: ScriptSaveButtonProps) => {
  const [isSaved, setIsSaved] = useState(false)

  return (
    <Button
      {...props}
      onClick={() => setIsSaved((current) => !current)}
      className={cn(
        'button subtle p-2',
        isSaved && 'text-golden-yellow',
        className
      )}
      aria-label={
        isSaved
          ? `Remove ${scriptTitle} from favorites`
          : `Add ${scriptTitle} to favorites`
      }
      data-script-id={id}
    >
      <BookmarkIcon
        {...iconProps}
        className={cn(isSaved && 'text-golden-yellow', iconProps?.className)}
      />
    </Button>
  )
}
