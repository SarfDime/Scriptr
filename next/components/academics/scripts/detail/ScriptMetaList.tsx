import { SCRIPT_STRINGS_PACK } from '@shared/strings/scripts-strings'
import type { ScriptSummary } from '@shared/types/scripts.types'
import { NextLink } from '@/components/common/NextLink'
import { getServerStrings } from '@/lib/server-strings'
import { ScriptDetailItem } from './ScriptDetailItem'

export type ScriptMetaListProps = {
  script: Pick<
    ScriptSummary,
    'subject' | 'exam_session' | 'exam_year' | 'download_count'
  >
  /** `null` renders the subject as plain text. */
  subjectHref: string | null
}

/** Subject, exam session/year and download count; absent fields are skipped. */
export async function ScriptMetaList({
  script,
  subjectHref,
}: ScriptMetaListProps) {
  const strings = await getServerStrings(SCRIPT_STRINGS_PACK)

  return (
    <dl className='ui-stack gap-3'>
      {script.subject && (
        <ScriptDetailItem label={strings.info.subject}>
          {subjectHref ? (
            <NextLink href={subjectHref} className='hover:text-brand'>
              {script.subject.name}
            </NextLink>
          ) : (
            script.subject.name
          )}
        </ScriptDetailItem>
      )}
      {script.exam_session && (
        <ScriptDetailItem label={strings.info.examSession}>
          {strings.info.examSessionValue(script.exam_session, script.exam_year)}
        </ScriptDetailItem>
      )}
      <ScriptDetailItem label={strings.info.downloads}>
        {script.download_count}
      </ScriptDetailItem>
    </dl>
  )
}
