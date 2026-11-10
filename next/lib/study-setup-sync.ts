import type { ProfileSubjectStatus } from '@shared/types/profile.types'
import {
  addProfileStudy,
  getMyProfile,
  setProfileSubjectStatus,
} from '@/lib/api/profile-api'
import { nextLogs } from '@/lib/logger'
import { clearStudySetups, listStudySetups } from '@/lib/study-setup-storage'

const COMPLETED: ProfileSubjectStatus = 'completed'

/**
 * Applies what a guest set up in this browser to the account that just signed
 * in. An academic profile is per study, so this walks each stored study and
 * writes it through the same study-scoped endpoints the setup form uses —
 * which is why registration no longer carries an academic profile at all.
 *
 * Records without a completed setup are skipped: "skip for now" is a dismissal,
 * not an enrolment. So is anything the account already has, so a device that was
 * used while signed in does not re-write its own mirror on the next sign-in.
 *
 * Failures are logged and left in storage rather than thrown: the person is
 * already signed in, and the study's own setup page can finish the job.
 */
export const applyStoredStudySetup = async (): Promise<void> => {
  const setups = listStudySetups().filter(({ record }) => record.completedAt)
  if (setups.length === 0) return

  try {
    const profile = await getMyProfile()
    const memberStudyIds = new Set(
      profile.selected_studies.flatMap(({ study }) => (study ? [study.id] : []))
    )
    const completedSubjectIds = new Set(
      profile.subjects
        .filter((subject) => subject.status === COMPLETED)
        .map((subject) => subject.subject_id)
    )

    for (const { studyId, record } of setups) {
      if (!memberStudyIds.has(studyId)) await addProfileStudy(studyId)

      await Promise.all(
        record.subjectIds
          .filter((subjectId) => !completedSubjectIds.has(subjectId))
          .map((subjectId) => setProfileSubjectStatus(subjectId, COMPLETED))
      )
    }
  } catch (error) {
    nextLogs({
      message: 'Could not carry a guest study setup over to the account.',
      logLevel: 'warn',
      error,
    })
    return
  }

  clearStudySetups()
}
