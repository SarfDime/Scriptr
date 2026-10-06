'use client'

import DownloadIcon from '@sanity/icons/Download'
import EyeOpenIcon from '@sanity/icons/EyeOpen'
import { UI_STRINGS } from '@shared/config/strings'
import type { ScriptFile } from '@shared/types/scripts.types'
import { Box } from '@/components/common/Box'
import { Button } from '@/components/common/Button'
import { cn } from '@/lib/common-utils'
import { ScriptDownloadButton } from './actions/ScriptDownloadButton'

/** Both actions share one size so they always match. `text-sm!` is important
 * because `solid` sets its own `font-size`, which otherwise made Download
 * taller than Preview. */
const ACTION_BUTTON_CLASS = 'gap-2 px-4 py-2 text-sm! font-semibold'
/** `overwrite` opts out of the global 1.5rem sanity-icon size. */
const ACTION_ICON_CLASS = 'overwrite size-5 shrink-0'

export type ScriptFileActionsProps = {
  scriptId: string
  file: ScriptFile
  /** Whether the file type can be previewed in the modal. */
  canPreview: boolean
  /** Buttons stop stretching once the card is wide enough for a row layout. */
  isWide: boolean
  onPreview: () => void
}

/** Preview (when available) and Download for one file. The preview modal
 * itself is owned by the card, which also opens it from the thumbnail. */
export function ScriptFileActions({
  scriptId,
  file,
  canPreview,
  isWide,
  onPreview,
}: ScriptFileActionsProps) {
  const itemClass = cn('grow', isWide && '@md:min-w-28 @md:grow-0')

  return (
    <Box className='ui-cluster gap-2'>
      {canPreview && (
        <Box className={itemClass}>
          <Button
            onClick={onPreview}
            className={cn('button outline w-full', ACTION_BUTTON_CLASS)}
          >
            <EyeOpenIcon className={ACTION_ICON_CLASS} />
            {UI_STRINGS.scripts.actions.preview}
          </Button>
        </Box>
      )}
      <ScriptDownloadButton
        scriptId={scriptId}
        file={file}
        icon={<DownloadIcon className={ACTION_ICON_CLASS} />}
        buttonClassName={cn('button solid w-full', ACTION_BUTTON_CLASS)}
        className={itemClass}
      >
        {UI_STRINGS.scripts.actions.download}
      </ScriptDownloadButton>
    </Box>
  )
}
