import { Box } from '@/components/common/Box'
import type { ScriptActionsProps } from '@/types/components/Scripts.types'
import { ScriptPreviewButton } from './ScriptPreviewButton'
import { ScriptCommentsLink } from './ScriptsCommentLink'
import { ScriptVoteCount } from './ScriptVoteCount'

/** Full action row for a single script: a read-only vote count, a comment
 * count that links to the comments section of the script's detail page and
 * preview. Everything here is driven by props — no per-card viewer-state
 * fetching — so cards are safe to render on static pages. Voting and saving
 * live on the detail page.
 */
export const ScriptActions = ({
  id,
  slug,
  siteSlug,
  scriptTitle,
  likes,
  comments,
  title,
  description,
  files,
  children,
}: ScriptActionsProps) => (
  <>
    <Box className='ui-cluster justify-center sm:justify-start gap-0 grow'>
      <ScriptVoteCount votes={likes} />
      <ScriptCommentsLink
        id={id}
        slug={slug}
        siteSlug={siteSlug}
        scriptTitle={scriptTitle}
        comments={comments}
      />
    </Box>
    {children && children}
    <ScriptPreviewButton
      id={id}
      title={title}
      description={description}
      files={files}
    />
  </>
)
