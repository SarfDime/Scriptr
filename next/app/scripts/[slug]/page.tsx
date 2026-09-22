import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { ScriptDownloadButton } from '@/components/academics/scripts/actions/ScriptDownloadButton'
import { ScriptVoteButton } from '@/components/academics/scripts/actions/ScriptVoteButton'
import { FilePreviewContent } from '@/components/academics/scripts/FilePreviewContent'
import { FilePreviewModal } from '@/components/academics/scripts/FilePreviewModal'
import { CommentSection } from '@/components/comments/CommentSection'
import { Box } from '@/components/common/Box'
import { PortableTextContent } from '@/components/typography/PortableTextContent'
import { Text } from '@/components/typography/Text'
import { FlagReportButton } from '@/components/ui/FlagReportButton'
import { getScriptComments } from '@/lib/api/comments-api'
import { getScript } from '@/lib/api/scripts-api'
import { getMyScriptVote, getScriptVoteStats } from '@/lib/api/votes-api'
import { getPreviewableKind } from '@/lib/file-preview'
import { fetchSanityData } from '@/sanity/lib/utils'
import { subjectByIdQuery } from '@/sanity/queries/academics/subject.queries'
import type { SubjectById } from '@/types/academics/subject.types'

export default async function ScriptDetailPage({
  params,
}: {
  params: Promise<{ scriptId: string }>
}) {
  const { scriptId } = await params
  const cookieHeader = (await cookies()).toString()

  // Independent reads — fetched in parallel. Only the script itself is
  // required for the page to render; votes/comments degrade gracefully.
  const [scriptResult, statsResult, myVoteResult, commentsResult] =
    await Promise.allSettled([
      getScript(scriptId, cookieHeader),
      getScriptVoteStats(scriptId),
      getMyScriptVote(scriptId, cookieHeader),
      getScriptComments(scriptId, cookieHeader),
    ])

  if (scriptResult.status === 'rejected') {
    notFound()
  }

  const script = scriptResult.value

  const voteStats =
    statsResult.status === 'fulfilled'
      ? statsResult.value
      : { upvotes: 0, score: 0 }

  // GET /script/:scriptId/my-vote returns the raw votes row or `null` —
  // never `{ voted: boolean }`. "Has the current user voted" is
  // `myVote !== null`.
  const myVote = myVoteResult.status === 'fulfilled' ? myVoteResult.value : null

  const comments =
    commentsResult.status === 'fulfilled' ? commentsResult.value : []

  const subjectSanityId = script.subject?.sanity_id ?? null
  const subject = subjectSanityId
    ? await fetchSanityData<SubjectById | null>({
        query: subjectByIdQuery,
        params: { subjectId: subjectSanityId },
        fetchOrigin: `script-detail-subject-${subjectSanityId}`,
      }).catch(() => null)
    : null

  const onlyFile = script.files.length === 1 ? script.files[0] : null
  const onlyFileKind = onlyFile ? getPreviewableKind(onlyFile.file_type) : null

  return (
    <Box as='main' className='ui-container ui-section ui-stack gap-6'>
      <Box className='ui-stack gap-2'>
        <PortableTextContent renderWrapper={false}>
          {script.title}
        </PortableTextContent>
        {script.description && (
          <PortableTextContent renderWrapper={false}>
            {script.description}
          </PortableTextContent>
        )}
        <div className='ui-cluster gap-2'>
          {subject && <Text className='ui-subtitle'>{subject.name}</Text>}
          {script.exam_session && (
            <Text className='ui-caption'>{script.exam_session}</Text>
          )}
        </div>
      </Box>

      <div className='ui-cluster gap-3 items-center'>
        <ScriptVoteButton
          scriptId={scriptId}
          initialVoted={myVote !== null}
          initialScore={voteStats.score}
        />
        <FlagReportButton
          targetType='script'
          targetId={scriptId}
          triggerLabel='Report script'
        />
      </div>

      {script.files.length === 0 ? (
        <Text className='ui-subtitle'>No files attached to this script.</Text>
      ) : (
        <Box className='ui-stack gap-4'>
          {onlyFile && onlyFileKind && (
            <FilePreviewContent
              url={onlyFile.file_url}
              kind={onlyFileKind}
              fileName={`Script file (${onlyFile.file_type})`}
            />
          )}

          <div className='ui-cluster gap-2'>
            {script.files.map((file) => (
              <Box key={file.id} className='ui-cluster gap-2 items-center'>
                <ScriptDownloadButton scriptId={scriptId} file={file} />
                {getPreviewableKind(file.file_type) && (
                  <FilePreviewModal
                    file={{
                      url: file.file_url,
                      fileName: `Script file (${file.file_type})`,
                      fileType: file.file_type,
                    }}
                  />
                )}
              </Box>
            ))}
          </div>
        </Box>
      )}

      {script.additional_reading.length > 0 && (
        <Box className='ui-stack gap-1'>
          <Text className='ui-label'>Additional reading</Text>
          <div className='ui-stack gap-1'>
            {script.additional_reading.map((link) => (
              <a
                key={link}
                href={link}
                target='_blank'
                rel='noopener noreferrer'
                className='button link'
              >
                {link}
              </a>
            ))}
          </div>
        </Box>
      )}

      <CommentSection target={{ scriptId }} initialComments={comments} />
    </Box>
  )
}
