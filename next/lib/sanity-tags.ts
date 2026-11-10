import { SANITY_CACHE_TAGS as T } from '@shared/config/cache-tags'

/**
 * The Sanity document types each academic page renders: the entity itself, the
 * ancestors whose names appear in its breadcrumb, and the people credited on it.
 * Declaring them is what lets the publish webhook invalidate one page family
 * instead of the whole dataset.
 */
export const ACADEMIC_PAGE_TAGS = {
  university: [T.university, T.person],
  faculty: [T.faculty, T.university, T.person],
  study: [T.study, T.faculty, T.university, T.subject, T.professor, T.person],
  subject: [T.subject, T.study, T.faculty, T.university, T.professor, T.person],
  professor: [T.professor, T.faculty, T.study, T.subject, T.person],
} satisfies Record<string, Array<string>>

/** Every academic type, for one list that has to cover the whole catalog. */
export const ACADEMIC_CATALOG_TAGS: Array<string> = [
  T.university,
  T.faculty,
  T.study,
  T.subject,
  T.professor,
  T.person,
]
