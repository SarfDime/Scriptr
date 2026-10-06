import { ScriptSurface } from '@/components/academics/scripts/ScriptSurface'
import { Box } from '@/components/common/Box'
import type { ScriptDetailViewModel } from '@/types/components/ScriptDetail.types'
import { ScriptAdditionalReading } from './ScriptAdditionalReading'
import { ScriptFilesSection } from './ScriptFilesSection'
import { ScriptInfoPanel } from './ScriptInfoPanel'

/**
 * The top section of the script page. Two frosted surfaces share a row: the
 * info group (script info + additional reading, itself wrapping) and the
 * files. The files take almost all the free space (grow 100 vs 1), so the info
 * group stays near its basis; when the row can't fit both, the *first* wrap is
 * the files dropping below the info group, and only then does the info group
 * wrap internally (reading below the info). Cells in a flex line stretch, so
 * the two surfaces match heights.
 */
export function ScriptDetailOverview({
  detail,
}: {
  detail: ScriptDetailViewModel
}) {
  const { scriptId, script, files } = detail

  return (
    <Box className='flex flex-wrap gap-4'>
      <ScriptSurface className='flex min-w-0 grow basis-[34rem] flex-wrap gap-3'>
        <ScriptInfoPanel detail={detail} />
        <ScriptAdditionalReading links={script.additional_reading} />
      </ScriptSurface>
      <ScriptFilesSection scriptId={scriptId} files={files} />
    </Box>
  )
}
