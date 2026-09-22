import { Box } from '@/components/common/Box'
import { cn } from '@/lib/common-utils'
import type { ScriptActionsProps } from '@/types/components/Scripts.types'
import { ScriptDownloadButton } from './ScriptDownloadButton'
import { ScriptLikeButton } from './ScriptLikeButton'
import { ScriptPreviewButton } from './ScriptPreviewButton'
import { ScriptSaveButton } from './ScriptSaveButton'
import { ScriptCommentsLink } from './ScriptsCommentLink'

/** Full action row for a single script: save, like, a comment count that
 * links to the script's detail page, download, and preview. Each action
 * is its own component — this composes them into one row and doesn't own
 * any state itself.
 */
export const ScriptActions = ({
  id,
  scriptTitle,
  likes,
  comments,
  title,
  description,
  files,
  className,
  ...rest
}: ScriptActionsProps) => (
  <Box
    {...rest}
    className={cn('ui-cluster flex-wrap items-center gap-2', className)}
  >
    <ScriptSaveButton id={id} scriptTitle={scriptTitle} />
    <ScriptLikeButton id={id} scriptTitle={scriptTitle} likes={likes} />
    <ScriptCommentsLink id={id} scriptTitle={scriptTitle} comments={comments} />
    <Box className='ml-auto ui-cluster flex-wrap gap-2'>
      {files.map((file) => (
        <ScriptDownloadButton key={file.id} scriptId={id} file={file} />
      ))}
      <ScriptPreviewButton
        id={id}
        title={title}
        description={description}
        files={files}
      />
    </Box>
  </Box>
)
