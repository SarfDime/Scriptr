import { Box } from '@/components/common/Box'
import type { ScriptActionsProps } from '@/types/components/Scripts.types'
import { ScriptDownloadButton } from './ScriptDownloadButton'
import { ScriptPreviewButton } from './ScriptPreviewButton'
import { ScriptCommentsLink } from './ScriptsCommentLink'
import { ScriptVoteCount } from './ScriptVoteCount'

/** Full action row for a single script: a read-only vote count, a comment
 * count that links to the comments section of the script's detail page,
 * download, and preview. Everything here is driven by props — no per-card
 * viewer-state fetching — so cards are safe to render on static pages.
 * Voting and saving live on the detail page.
 */
export const ScriptActions = ({
  id,
  scriptTitle,
  likes,
  comments,
  title,
  description,
  files,
}: ScriptActionsProps) => (
  <>
    <Box className='ui-cluster justify-center sm:justify-start gap-2 grow'>
      <ScriptVoteCount votes={likes} />
      <ScriptCommentsLink
        id={id}
        scriptTitle={scriptTitle}
        comments={comments}
      />
    </Box>
    <Box className='md:ml-auto ui-cluster justify-center grow sm:grow-0 gap-2'>
      {files.map((file) => (
        <ScriptDownloadButton
          key={file.id}
          scriptId={id}
          file={file}
          className='grow sm:grow-0'
        >
          {files.length === 1
            ? 'Download'
            : `Download file ${file.position + 1} (${file.file_type})`}
        </ScriptDownloadButton>
      ))}
      <ScriptPreviewButton
        id={id}
        title={title}
        description={description}
        files={files}
        className='grow sm:grow-0'
      />
    </Box>
  </>
)
