import type {
  FacultyWithUniversity,
  StudyWithFacultyAndUniversity,
} from '@shared/types/profile.types'
import { getAcademicPath } from '@/lib/academic-routes'
import { findByDbId } from '@/lib/catalog-lookup'
import type {
  ProfileAcademicEntry,
  ProfileAcademics,
} from '@/types/components/ProfileCard.types'
import type { OnboardingCatalog } from '@/types/onboarding.types'

/**
 * The profile card's affiliations as a view model, with each one's page
 * path. Profiles hold Postgres rows (whose ids are not what the academic
 * pages are routed by); the routes use Sanity slugs, so each row is matched
 * to its catalog entry by `dbId` and the path is built from the university,
 * faculty and study slugs found there. An entry the catalog can't resolve
 * (not synced, or missing a slug) gets `href: null` rather than a link
 * that would 404.
 */
export const buildProfileAcademics = (
  catalog: OnboardingCatalog,
  selectedFaculties: Array<{ faculty: FacultyWithUniversity | null }>,
  selectedStudies: Array<{ study: StudyWithFacultyAndUniversity | null }>
): ProfileAcademics => {
  const faculties = selectedFaculties.flatMap(({ faculty }) =>
    faculty ? [faculty] : []
  )
  const studies = selectedStudies.flatMap(({ study }) => (study ? [study] : []))

  const universityHref = (dbId: string): string | null => {
    const university = findByDbId(catalog.universities, dbId)
    if (!university?.slug) return null
    return getAcademicPath({
      type: 'university',
      universitySlug: university.slug,
    })
  }

  const facultyHref = (dbId: string): string | null => {
    const faculty = findByDbId(catalog.faculties, dbId)
    const university = catalog.universities.find(
      (item) => item._id === faculty?.universityId
    )
    if (!faculty?.slug || !university?.slug) return null
    return getAcademicPath({
      type: 'faculty',
      universitySlug: university.slug,
      facultySlug: faculty.slug,
    })
  }

  const studyHref = (dbId: string): string | null => {
    const study = findByDbId(catalog.studies, dbId)
    const faculty = catalog.faculties.find(
      (item) => item._id === study?.facultyId
    )
    const university = catalog.universities.find(
      (item) => item._id === faculty?.universityId
    )
    if (!study?.slug || !faculty?.slug || !university?.slug) return null
    return getAcademicPath({
      type: 'study',
      universitySlug: university.slug,
      facultySlug: faculty.slug,
      studySlug: study.slug,
    })
  }

  const toEntry = (
    item: { id: string; name: string },
    href: string | null
  ): ProfileAcademicEntry => ({ id: item.id, name: item.name, href })

  const universities = [
    ...new Map(
      [
        ...faculties.map((faculty) => faculty.university),
        ...studies.map((study) => study.faculty?.university ?? null),
      ]
        .filter((university) => university !== null)
        .map((university) => [university.id, university] as const)
    ).values(),
  ]

  return {
    universities: universities.map((university) =>
      toEntry(university, universityHref(university.id))
    ),
    faculties: faculties.map((faculty) =>
      toEntry(faculty, facultyHref(faculty.id))
    ),
    studies: studies.map((study) => toEntry(study, studyHref(study.id))),
  }
}
