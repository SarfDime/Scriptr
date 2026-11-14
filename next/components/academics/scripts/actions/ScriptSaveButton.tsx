'use client'

import BookmarkIcon from '@sanity/icons/Bookmark'
import { SCRIPT_STRINGS_PACK } from '@shared/strings/scripts-strings'
import { useState } from 'react'
import { Button } from '@/components/common/Button'
import { Text } from '@/components/typography/Text'
import { useRequireSignIn } from '@/hooks/useRequireSignIn'
import { addFavorite, removeFavorite } from '@/lib/api/favorites-api'
import { cn } from '@/lib/common-utils'
import { useStrings } from '@/providers/locale/use-strings'
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
  const strings = useStrings(SCRIPT_STRINGS_PACK)
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
          ? strings.favorite.failedTitleRemove
          : strings.favorite.failedTitleAdd,
        description: strings.favorite.failedDescription,
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
      aria-label={saved ? strings.favorite.remove : strings.favorite.add}
      className={cn(
        'button subtle button-sm gap-1.5',
        saved && 'cp-yellow',
        className
      )}
    >
      <BookmarkIcon className={cn(saved && 'fill-current')} />
      <Text>{strings.favorite.favorite}</Text>
    </Button>
  )
}
