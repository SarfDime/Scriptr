'use client'

import type {
  CommentPage,
  CommentWithReplyPreview,
} from '@shared/types/comments.types'
import { useEffect, useState } from 'react'
import { getProfessorComments } from '@/lib/api/comments-api'

type ProfessorCommentsState =
  | { status: 'loading' }
  | { status: 'loaded'; comments: CommentPage<CommentWithReplyPreview> }
  | { status: 'error' }

/**
 * Loads the first page of a professor's comments in the browser, after mount.
 * Professor pages are statically generated, and reading the viewer's cookie
 * on the server (needed for `liked_by_me` / `my_reactions`) would make every
 * professor route dynamic. The browser sends its own session cookie and the
 * client path of `getProfessorComments` is `no-store`, so the first page is
 * personalised and never stale.
 *
 * State only changes inside the fetch promise callbacks, never synchronously
 * in the effect (Biome's useReactCompiler lint). There is no reset when
 * `professorId` changes: render this under `key={professorId}` so a new
 * professor remounts it with fresh `loading` state instead of showing the
 * previous professor's comments.
 */
export function useProfessorComments(professorId: string) {
  const [state, setState] = useState<ProfessorCommentsState>({
    status: 'loading',
  })

  useEffect(() => {
    let cancelled = false

    getProfessorComments(professorId)
      .then((comments) => {
        if (!cancelled) setState({ status: 'loaded', comments })
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'error' })
      })

    return () => {
      cancelled = true
    }
  }, [professorId])

  return state
}
