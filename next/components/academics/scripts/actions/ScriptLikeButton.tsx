'use client'

import HeartIcon from '@sanity/icons/Heart'
import { useState } from 'react'
import { Button } from '@/components/common/Button'
import { Text } from '@/components/typography/Text'
import { cn } from '@/lib/common-utils'
import type { ScriptLikeButtonProps } from '@/types/components/Scripts.types'

/** Like toggle for a single script. Owns its own liked state and computes
 * an optimistic display count locally from the base `likes` prop.
 */ // TODO: wire this up to actually persist the like state.
export const ScriptLikeButton = ({
  id,
  scriptTitle,
  likes,
  className,
  iconProps,
  countProps,
  ...props
}: ScriptLikeButtonProps) => {
  const [isLiked, setIsLiked] = useState(false)
  const displayedLikes = likes + (isLiked ? 1 : 0)

  return (
    <Button
      {...props}
      onClick={() => setIsLiked((current) => !current)}
      className={cn(
        'button subtle gap-1.5 p-2',
        isLiked && 'text-rose-pink',
        className
      )}
      aria-label={`${isLiked ? 'Unlike' : 'Like'} ${scriptTitle}`}
      data-script-id={id}
    >
      <HeartIcon
        {...iconProps}
        className={cn(isLiked && 'text-rose-pink', iconProps?.className)}
      />
      <Text {...countProps} className={cn('ui-caption', countProps?.className)}>
        {displayedLikes}
      </Text>
    </Button>
  )
}
