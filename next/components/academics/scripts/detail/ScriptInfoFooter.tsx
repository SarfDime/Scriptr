import { SCRIPT_STRINGS_PACK } from '@shared/strings/scripts-strings'
import { formatNumericDate } from '@shared/utils/date-format.utils'
import { Box } from '@/components/common/Box'
import { Badge } from '@/components/ui/Badge'
import { Divider } from '@/components/ui/Divider'
import { FlagReportButton } from '@/components/ui/FlagReportButton'
import { getServerLocale, getServerStrings } from '@/lib/server-strings'
import { ScriptDetailItem } from './ScriptDetailItem'

export type ScriptInfoFooterProps = {
  scriptId: string
  isAuthor: boolean
  /** ISO timestamp of the script's last update. */
  updatedAt: string
}

/** Pinned to the bottom of the info panel: last-updated on the left, report
 * on the right, under their own divider. */
export async function ScriptInfoFooter({
  scriptId,
  isAuthor,
  updatedAt,
}: ScriptInfoFooterProps) {
  const strings = await getServerStrings(SCRIPT_STRINGS_PACK)
  const locale = await getServerLocale()

  return (
    <Box className='ui-stack mt-auto gap-3'>
      <Divider />
      <Box className='ui-cluster items-end justify-between gap-2'>
        <dl>
          <ScriptDetailItem label={strings.info.updated}>
            {formatNumericDate(new Date(updatedAt), locale)}
          </ScriptDetailItem>
        </dl>
        {!isAuthor && (
          <FlagReportButton
            targetType='script'
            targetId={scriptId}
            triggerLabel={strings.info.reportTrigger}
            triggerClassName='button button-sm cp-warning-int shrink-0 gap-1.5 px-3 py-1.5 font-medium'
          />
        )}
        {isAuthor && (
          <Badge colorPalette='cp-brand' className='ui-label h-full'>
            {strings.info.yourScript}
          </Badge>
        )}
      </Box>
    </Box>
  )
}
