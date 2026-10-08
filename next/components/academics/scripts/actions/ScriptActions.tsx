import { Box } from '@/components/common/Box'
import type { ScriptActionsProps } from '@/types/components/Scripts.types'
import { ScriptPreviewButton } from './ScriptPreviewButton'
import { ScriptCommentsLink } from './ScriptsCommentLink'
import { ScriptVoteCount } from './ScriptVoteCount'

/** Full action row for a single script: a read-only vote count, a comment
 * count that links to the comments section of the script's detail page and
 * preview. Everything here is driven by props — no per-card
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
      <ScriptPreviewButton
        id={id}
        title={title}
        description={description}
        files={files}
      />
    </Box>
  </>
)
