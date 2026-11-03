'use client'

import BookmarkIcon from '@sanity/icons/Bookmark'
import { SCRIPT_STRINGS } from '@shared/strings/scripts-strings'
import { useState } from 'react'
import { Button } from '@/components/common/Button'
import { Text } from '@/components/typography/Text'
import { useRequireSignIn } from '@/hooks/useRequireSignIn'
import { addFavorite, removeFavorite } from '@/lib/api/favorites-api'
import { cn } from '@/lib/common-utils'
import { useMyProfileActions } from '@/providers/ProfileProvider'
import { useToast } from '@/providers/toaster/ToasterProvider'

export type ScriptSaveButtonProps = {
  scriptId: string
  /** Server-fetched via GET apiRoutes.favorites.byScriptId (`!== null`) — pass down rather than re-fetching client-side on mount. */
  initialSaved: boolean
  disabled?: boolean
  className?: string
}

/**
 * Save/bookmark toggle for the script detail page. Saved state is seeded by
 * the server (no mount-time fetch), then toggled via POST/DELETE on
 * apiRoutes.favorites.byScriptId. Favoring is exempt from restriction checks
 * (docs/ARCHITECTURE-USERS-AUTH.md), so there's no useProtectedAction
 * wrapper — failures are surfaced as a toast.
 */
export function ScriptSaveButton({
  scriptId,
  initialSaved,
  disabled = false,
  className,
}: ScriptSaveButtonProps) {
  const [saved, setSaved] = useState(initialSaved)
  const [isPending, setIsPending] = useState(false)
  const { addToast } = useToast()
  const requireSignIn = useRequireSignIn()
  const { reload: reloadProfile } = useMyProfileActions()

  const handleClick = async () => {
    if (!requireSignIn()) return

    const wasSaved = saved
    setIsPending(true)
    try {
      if (wasSaved) {
        await removeFavorite(scriptId)
      } else {
        await addFavorite(scriptId)
      }
      setSaved(!wasSaved)
      await reloadProfile()
    } catch {
      addToast({
        type: 'error',
        title: wasSaved
          ? SCRIPT_STRINGS.favorite.failedTitleRemove
          : SCRIPT_STRINGS.favorite.failedTitleAdd,
        description: SCRIPT_STRINGS.favorite.failedDescription,
      })
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Button
      onClick={handleClick}
      disabled={disabled || isPending}
      aria-pressed={saved}
      aria-label={
        saved ? SCRIPT_STRINGS.favorite.remove : SCRIPT_STRINGS.favorite.add
      }
      className={cn(
        'button subtle button-sm gap-1.5',
        saved && 'cp-yellow',
        className
      )}
    >
      <BookmarkIcon className={cn(saved && 'fill-current')} />
      <Text>{SCRIPT_STRINGS.favorite.favorite}</Text>
    </Button>
  )
}
