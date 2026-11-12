'use client'

import { UI_STRINGS } from '@shared/config/strings'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useSyncExternalStore } from 'react'
import { Box } from '@/components/common/Box'
import { NextLink } from '@/components/common/NextLink'
import { Text } from '@/components/typography/Text'
import { studySiteSetupPath } from '@/lib/academic-routes'
import {
  EMPTY_STUDY_SETUP,
  readStudySetup,
  type StudySetupRecord,
  subscribeToStudySetup,
} from '@/lib/study-setup-storage'
import { useSession } from '@/providers/SessionProvider'

/** A stable snapshot: `useSyncExternalStore` compares these by identity. */
const toSnapshot = (record: StudySetupRecord) =>
  `${record.completedAt ?? ''}|${record.dismissedAt ?? ''}|${record.subjectIds.length}`

/**
 * Sends a reader who has no academic profile for this study to the study's
 * setup page — unless they dismissed it, in which case it offers the link back
 * instead of doing it again.
 *
 * Client-side on purpose: a guest's profile lives in this browser, so the server
 * cannot answer the question, and reading the session here keeps the study pages
 * static instead of paying for a cookie read on every one of them.
 */
export const StudySetupGate = ({ studyId }: { studyId: string }) => {
  const router = useRouter()
  const { session } = useSession()
  const subscribe = useCallback(
    (listener: () => void) => subscribeToStudySetup(studyId, listener),
    [studyId]
  )
  const snapshot = useSyncExternalStore(
    subscribe,
    () => toSnapshot(readStudySetup(studyId)),
    () => toSnapshot(EMPTY_STUDY_SETUP)
  )
  const record = readStudySetup(studyId)

  const isSignedIn = session.status === 'authenticated'
  const hasAccountProfile =
    isSignedIn && session.user.selected_study_ids.includes(studyId)
  const isReady = session.status !== 'loading'

  const needsSetup =
    isReady &&
    !hasAccountProfile &&
    record.completedAt === null &&
    record.dismissedAt === null

  useEffect(() => {
    if (needsSetup) router.replace(studySiteSetupPath)
  }, [needsSetup, router])

  const showResume =
    isReady &&
    !hasAccountProfile &&
    record.completedAt === null &&
    record.dismissedAt !== null

  if (!showResume) return null

  // `snapshot` is read to subscribe to this study's record; the render itself
  // comes from `record` above, which is the same value.
  return (
    <Box key={snapshot} className='ui-stack ui-above-inside gap-2 p-3'>
      <Text className='ui-body-strong'>
        {UI_STRINGS.onboarding.academicSetup.resumeTitle}
      </Text>
      <Text className='ui-caption'>
        {UI_STRINGS.onboarding.academicSetup.resumeBody}
      </Text>
      <NextLink href={studySiteSetupPath} className='button button-sm w-fit'>
        {UI_STRINGS.onboarding.academicSetup.resume}
      </NextLink>
    </Box>
  )
}
