import type { GuestAcademicData } from '@/types/onboarding.types'

/**
 * Pushes a guest's local academic selections into `profiles`,
 * `profile_faculties`, `profile_studies`, and `profile_subjects` on
 * account creation. This is a stub — the client type and table/column
 * names need to match your actual schema. Call once right after sign-up
 * succeeds, then `clearGuestAcademicData()` so it isn't synced twice.
 */
export const syncGuestDataToProfile = async (
  userId: string,
  guestData: GuestAcademicData,
  // biome-ignore lint/suspicious/noExplicitAny: swap for your real DB client type
  db: any
) => {
  if (!guestData.universityId || !guestData.facultyId) return

  await db
    .from('profiles')
    .upsert({ id: userId, university_id: guestData.universityId })

  await db
    .from('profile_faculties')
    .upsert({ profile_id: userId, faculty_id: guestData.facultyId })

  if (guestData.studyId) {
    await db
      .from('profile_studies')
      .upsert({ profile_id: userId, study_id: guestData.studyId })
  }

  if (guestData.completedSubjectIds.length > 0) {
    await db.from('profile_subjects').upsert(
      guestData.completedSubjectIds.map((subjectId) => ({
        profile_id: userId,
        subject_id: subjectId,
      }))
    )
  }
}
