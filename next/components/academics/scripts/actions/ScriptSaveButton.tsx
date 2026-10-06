'use client'

import BookmarkIcon from '@sanity/icons/Bookmark'
import { useState } from 'react'
import { Button } from '@/components/common/Button'
import { Text } from '@/components/typography/Text'
import { useRequireSignIn } from '@/hooks/useRequireSignIn'
import { addFavorite, removeFavorite } from '@/lib/api/favorites-api'
import { cn } from '@/lib/common-utils'
import { useToast } from '@/providers/toaster/ToasterProvider'

export type ScriptSaveButtonProps = {
  scriptId: string
  /** Server-fetched via GET apiRoutes.favorites.byScriptId (`!== null`) — pass down rather than re-fetching client-side on mount. */
  initialSaved: boolean
  className?: string
}

/**
 * Save/bookmark toggle for the script detail page. Saved state is seeded by
 * the server (no mount-time fetch), then toggled via POST/DELETE on
 * apiRoutes.favorites.byScriptId. Favoring is exempt from restriction
 * checks (ARCHITECTURE.md §4), so there's no useProtectedAction wrapper —
 * failures are surfaced as a toast.
 */
export function ScriptSaveButton({
  scriptId,
  initialSaved,
  className,
}: ScriptSaveButtonProps) {
  const [saved, setSaved] = useState(initialSaved)
  const [isPending, setIsPending] = useState(false)
  const { addToast } = useToast()
  const requireSignIn = useRequireSignIn()

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
    } catch {
      addToast({
        type: 'error',
        title: wasSaved
          ? 'Couldn’t remove from favorites'
          : 'Couldn’t save script',
        description: 'Please try again.',
      })
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Button
      onClick={handleClick}
      disabled={isPending}
      aria-pressed={saved}
      aria-label={saved ? 'Remove script from favorites' : 'Save script'}
      className={cn(
        'button subtle gap-1.5',
        saved && 'text-golden-yellow',
        className
      )}
    >
      <BookmarkIcon className={cn(saved && 'fill-golden-yellow')} />
      <Text>{saved ? 'Saved' : 'Save'}</Text>
    </Button>
  )
}
