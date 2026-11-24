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
  /** The subject's name in the reader's language. The script payload carries a
   *  single name — the one the row was linked with — so it is only a fallback
   *  for a Sanity read that failed. */
  subjectName: string | null
  /** The chosen professor's localized name; absent when the script has none. */
  professorName: string | null
  /** `null` renders the professor as plain text. */
  professorHref: string | null
}

/** Subject, professor, exam session/year and download count; absent fields are
 * skipped. */
export async function ScriptMetaList({
  script,
  subjectHref,
  subjectName,
  professorName,
  professorHref,
}: ScriptMetaListProps) {
  const strings = await getServerStrings(SCRIPT_STRINGS_PACK)
  const name = subjectName ?? script.subject?.name

  return (
    <dl className='ui-stack gap-3'>
      {script.subject && name && (
        <ScriptDetailItem label={strings.info.subject}>
          {subjectHref ? (
            <NextLink href={subjectHref} className='hover:text-brand'>
              {name}
            </NextLink>
          ) : (
            name
          )}
        </ScriptDetailItem>
      )}
      {professorName && (
        <ScriptDetailItem label={strings.info.professor}>
          {professorHref ? (
            <NextLink href={professorHref} className='hover:text-brand'>
              {professorName}
            </NextLink>
          ) : (
            professorName
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
