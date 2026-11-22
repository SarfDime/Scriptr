import { UI_STRINGS_PACK } from '@shared/config/strings'
import { SCRIPT_STRINGS_PACK } from '@shared/strings/scripts-strings'
import type { ScriptFile } from '@shared/types/scripts.types'
import { ScriptFileCard } from '@/components/academics/scripts/ScriptFileCard'
import { Box } from '@/components/common/Box'
import { SectionHeader } from '@/components/common/SectionHeader'
import { Text } from '@/components/typography/Text'
import { cn } from '@/lib/common-utils'
import { getPreviewableKind } from '@/lib/file-preview'
import { getServerStrings } from '@/lib/server-strings'

export type ScriptFilesSectionProps = {
  scriptId: string
  /** Already ordered by `position`. */
  files: Array<ScriptFile>
  /** Shows each file's remove action (author or admin). */
  canManage?: boolean
}

/** The script's files on their own translucent surface. Takes nearly all the free
 * space in the overview row and wraps below the info group first when that
 * row is too narrow. A script's only file, when it can be rendered inline,
 * fills the whole surface and is previewed in place. */
export async function ScriptFilesSection({
  scriptId,
  files,
  canManage = false,
}: ScriptFilesSectionProps) {
  const strings = await getServerStrings(SCRIPT_STRINGS_PACK)
  const ui = await getServerStrings(UI_STRINGS_PACK)
  const [soleFile, ...otherFiles] = files
  const previewsSoleFile =
    soleFile !== undefined &&
    otherFiles.length === 0 &&
    Boolean(getPreviewableKind(soleFile.file_type))

  return (
    <Box className='ui-above ui-stack min-w-0 grow-100 basis-[24rem] gap-3 p-3'>
      <SectionHeader
        title={strings.files.title}
        titleVariant='modern'
        count={files.length}
      />
      {files.length === 0 ? (
        <Text className='ui-subtitle'>
          {ui.scripts.actions.noFilesAttached}
        </Text>
      ) : (
        // Columns come from the available width, not the viewport: as many
        // cards per row as fit at the minimum width, each growing to share the
        // row. Each card switches between stacked and side-by-side on its own
        // width (see ScriptFileCard). `items-start` keeps cards at their
        // content height instead of stretching to the surface's height. A lone
        // file is capped at the width of its own content — 20rem thumbnail +
        // 1rem gap + two 7rem buttons with their 0.5rem gap + the card's 2rem
        // padding and borders ≈ 37.6rem, so 38rem — unless it is previewable,
        // in which case it spans the surface to show the inline preview.
        // Container queries need a width that doesn't depend on the content,
        // so the cap is measured, not `w-fit`; any narrower and the buttons
        // would wrap.
        <Box
          className={cn(
            'ui-card-grid items-start [--grid-min:18rem] h-full',
            files.length === 1 && !previewsSoleFile && 'max-w-152'
          )}
        >
          {files.map((file) => (
            <ScriptFileCard
              key={file.id}
              scriptId={scriptId}
              file={file}
              layout='wide'
              canRemove={canManage}
              inlinePreview={previewsSoleFile}
            />
          ))}
        </Box>
      )}
    </Box>
  )
}
