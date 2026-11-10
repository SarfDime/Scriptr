import { SANITY_CACHE_TAGS } from '@shared/config/cache-tags'
import { getAcademicPath } from '@/lib/academic-routes'
import { fetchSanityData } from '@/sanity/lib/utils'
import { subjectPathQuery } from '@/sanity/queries/academics/subject.queries'
import type { SubjectPath } from '@/types/academics/subject.types'

/**
 * Resolves a subject's page path from its Sanity id alone (all a script row
 * carries — see `ScriptSubjectRef.sanity_id`). Pulls the real subject / study /
 * faculty / university slugs with `subjectPathQuery`.
 *
 * Returns `null` instead of throwing when the id is missing, the subject isn't
 * in Sanity, or an ancestor has no slug, so callers can render the subject as
 * plain text and a Sanity hiccup never takes a page down.
 */
export const getSubjectPath = async (
  subjectSanityId: string | null
): Promise<string | null> => {
  if (!subjectSanityId) return null

  try {
    const slugs = await fetchSanityData<SubjectPath | null>({
      query: subjectPathQuery,
      params: { subjectId: subjectSanityId },
      fetchOrigin: `subject-path-${subjectSanityId}`,
      tags: [
        SANITY_CACHE_TAGS.subject,
        SANITY_CACHE_TAGS.study,
        SANITY_CACHE_TAGS.faculty,
        SANITY_CACHE_TAGS.university,
      ],
    })
    if (!slugs) return null

    const { subjectSlug, studySlug, facultySlug, universitySlug, siteSlug } =
      slugs
    if (!subjectSlug || !studySlug || !facultySlug || !universitySlug) {
      return null
    }

    return getAcademicPath({
      type: 'subject',
      siteSlug,
      universitySlug,
      facultySlug,
      studySlug,
      subjectSlug,
    })
  } catch {
    return null
  }
}
