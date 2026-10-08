import { UI_STRINGS } from '@shared/config/strings'
import { SCRIPT_STRINGS } from '@shared/strings/scripts-strings'
import type { ScriptFile } from '@shared/types/scripts.types'
import { ScriptFileCard } from '@/components/academics/scripts/ScriptFileCard'
import { ScriptSurface } from '@/components/academics/scripts/ScriptSurface'
import { Box } from '@/components/common/Box'
import { SectionHeader } from '@/components/common/SectionHeader'
import { Text } from '@/components/typography/Text'
import { cn } from '@/lib/common-utils'

export type ScriptFilesSectionProps = {
  scriptId: string
  /** Already ordered by `position`. */
  files: Array<ScriptFile>
}

/** The script's files on their own frosted surface. Takes nearly all the free
 * space in the overview row and wraps below the info group first when that
 * row is too narrow. */
export function ScriptFilesSection({
  scriptId,
  files,
}: ScriptFilesSectionProps) {
  return (
    <ScriptSurface className='ui-stack min-w-0 grow-100 basis-[24rem] gap-3'>
      <SectionHeader title={SCRIPT_STRINGS.files.title} count={files.length} />
      {files.length === 0 ? (
        <Text className='ui-subtitle'>
          {UI_STRINGS.scripts.actions.noFilesAttached}
        </Text>
      ) : (
        // Columns come from the available width, not the viewport: as many
        // cards per row as fit at the minimum width, each growing to share the
        // row. Each card switches between stacked and side-by-side on its own
        // width (see ScriptFileCard). `items-start` keeps cards at their
        // content height instead of stretching to the surface's height. A lone
        // file is capped at the width of its own content: 20rem thumbnail +
        // 1rem gap + two 7rem buttons with their 0.5rem gap + the card's 2rem
        // padding and borders ≈ 37.6rem, so 38rem. Container queries need a
        // width that doesn't depend on the content, so this is a measured cap,
        // not `w-fit`; any narrower and the buttons would wrap.
        <Box
          className={cn(
            'grid grid-cols-[repeat(auto-fit,minmax(min(100%,18rem),1fr))] items-start gap-3',
            files.length === 1 && 'max-w-152'
          )}
        >
          {files.map((file) => (
            <ScriptFileCard
              key={file.id}
              scriptId={scriptId}
              file={file}
              layout='wide'
            />
          ))}
        </Box>
      )}
    </ScriptSurface>
  )
}
