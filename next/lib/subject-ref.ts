import { SANITY_CACHE_TAGS } from '@shared/config/cache-tags'
import { getAcademicPath } from '@/lib/academic-routes'
import { getServerLocale } from '@/lib/server-strings'
import { fetchSanityData } from '@/sanity/lib/utils'
import { subjectPathQuery } from '@/sanity/queries/academics/subject.queries'
import type { SubjectPath } from '@/types/academics/subject.types'

/** What a script row can show about its subject: where the page is, and the
 *  subject's name in the reader's language. */
export type SubjectRef = {
  /** `null` when an ancestor has no slug yet; the subject then renders as
   *  plain text. */
  href: string | null
  /** `null` when the subject has no name in any language. */
  name: string | null
}

/**
 * Resolves a script's subject from its Sanity id alone (all the script row
 * carries — see `ScriptSubjectRef.sanity_id`): the page path from the real
 * subject / study / faculty / university slugs, and the name in the reader's
 * language. The localized name lives only in Sanity — the Postgres
 * `subjects.name` the API returns is a single string frozen when the row was
 * linked — so it is read here rather than taken from the script payload.
 *
 * Returns `null` instead of throwing when the id is missing, the subject isn't
 * in Sanity, or the read fails, so callers fall back to the name they already
 * have and a Sanity hiccup never takes a page down.
 */
export const getSubjectRef = async (
  subjectSanityId: string | null
): Promise<SubjectRef | null> => {
  if (!subjectSanityId) return null

  try {
    const locale = await getServerLocale()
    const subject = await fetchSanityData<SubjectPath | null>({
      query: subjectPathQuery,
      params: { subjectId: subjectSanityId },
      locale,
      fetchOrigin: `subject-ref-${subjectSanityId}`,
      tags: [
        SANITY_CACHE_TAGS.subject,
        SANITY_CACHE_TAGS.study,
        SANITY_CACHE_TAGS.faculty,
        SANITY_CACHE_TAGS.university,
      ],
    })
    if (!subject) return null

    const { subjectSlug, studySlug, facultySlug, universitySlug, siteSlug } =
      subject
    const hasPath = Boolean(
      subjectSlug && studySlug && facultySlug && universitySlug
    )

    return {
      href: hasPath
        ? getAcademicPath(
            {
              type: 'subject',
              siteSlug,
              universitySlug,
              facultySlug,
              studySlug,
              subjectSlug,
            },
            locale
          )
        : null,
      name: subject.name || null,
    }
  } catch {
    return null
  }
}
