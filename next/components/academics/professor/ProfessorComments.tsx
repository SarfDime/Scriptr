'use client'

import { COMMENTS_SECTION_ID } from '@shared/config/shared-constants'
import { COMMENT_STRINGS_PACK } from '@shared/strings/comments-strings'
import { useId } from 'react'
import { CommentSection } from '@/components/comments/CommentSection'
import { Box } from '@/components/common/Box'
import { SectionHeader } from '@/components/common/SectionHeader'
import { Text } from '@/components/typography/Text'
import { useProfessorComments } from '@/hooks/useProfessorComments'
import { EMPTY_COMMENT_PAGE } from '@/lib/comments/empty-comment-page'
import { useStrings } from '@/providers/locale/use-strings'

/**
 * Comments for a professor. The page stays static, so the first page of
 * comments is fetched here in the browser. While it loads we show a heading
 * placeholder; if the read fails, `CommentSection` renders its own retry UI.
 * Render with `key={professorId}` (see useProfessorComments).
 */
export function ProfessorComments({ professorId }: { professorId: string }) {
  const state = useProfessorComments(professorId)

  if (state.status === 'loading') return <ProfessorCommentsLoading />

  return (
    <CommentSection
      target={{ professorId }}
      initialComments={
        state.status === 'loaded' ? state.comments : EMPTY_COMMENT_PAGE
      }
      initialLoadFailed={state.status === 'error'}
    />
  )
}

/** Same section id and heading as the loaded states, so `#comments` links and
 * the landmark label are valid while loading. Only one of these three states
 * is ever mounted, so the ids never collide. */
function ProfessorCommentsLoading() {
  const strings = useStrings(COMMENT_STRINGS_PACK)
  const headingId = useId()

  return (
    <Box
      as='section'
      id={COMMENTS_SECTION_ID}
      aria-labelledby={headingId}
      aria-busy='true'
      className='ui-stack scroll-mt-20 ui-above'
    >
      <SectionHeader
        title={strings.general.title}
        titleProps={{ id: headingId }}
      />
      <Text className='ui-caption' role='status'>
        {strings.general.loadingComments}
      </Text>
    </Box>
  )
}
