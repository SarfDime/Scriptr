import { SCRIPT_STRINGS } from '@shared/strings/scripts-strings'
import { Box } from '@/components/common/Box'
import { Divider } from '@/components/ui/Divider'
import { FlagReportButton } from '@/components/ui/FlagReportButton'
import { ScriptDetailItem } from './ScriptDetailItem'

export type ScriptInfoFooterProps = {
  scriptId: string
  /** ISO timestamp of the script's last update. */
  updatedAt: string
}

/** Pinned to the bottom of the info panel: last-updated on the left, report
 * on the right, under their own divider. */
export function ScriptInfoFooter({
  scriptId,
  updatedAt,
}: ScriptInfoFooterProps) {
  return (
    <Box className='ui-stack mt-auto gap-3'>
      <Divider />
      <Box className='ui-cluster items-end justify-between gap-2'>
        <dl>
          <ScriptDetailItem label={SCRIPT_STRINGS.info.updated}>
            {new Date(updatedAt).toLocaleDateString()}
          </ScriptDetailItem>
        </dl>
        <FlagReportButton
          targetType='script'
          targetId={scriptId}
          triggerLabel={SCRIPT_STRINGS.info.reportTrigger}
          triggerClassName='button cp-warning-int shrink-0 gap-1.5 px-3 py-1.5 text-xs font-medium'
        />
      </Box>
    </Box>
  )
}
