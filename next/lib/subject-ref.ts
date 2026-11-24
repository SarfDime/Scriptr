import { SANITY_CACHE_TAGS } from '@shared/config/cache-tags'
import { getAcademicPath } from '@/lib/academic-routes'
import { getServerLocale } from '@/lib/server-strings'
import { catalogUrl } from '@/lib/study-origin'
import { fetchSanityData } from '@/sanity/lib/utils'
import {
  subjectNamesByIdsQuery,
  subjectPathQuery,
} from '@/sanity/queries/academics/subject.queries'
import type { SubjectPath } from '@/types/academics/subject.types'

/** What a script row can show about its subject: where the page is, and the
 *  subject's and chosen professor's names in the reader's language. */
export type SubjectRef = {
  /** `null` when an ancestor has no slug yet; the subject then renders as
   *  plain text. */
  href: string | null
  /** `null` when the subject has no name in any language. */
  name: string | null
  /** `null` when the script has no professor, or the subject no longer lists
   *  the one the script chose. */
  professorName: string | null
  /** The professor's catalog page, absolute on a study host — a professor
   *  lives on the catalog, not the study's site. `null` when there is no
   *  professor slug to build it from. */
  professorHref: string | null
}

/**
 * Resolves a script's subject from its Sanity id alone (all the script row
 * carries — see `ScriptSubjectRef.sanity_id`): the page path from the real
 * subject / study / faculty / university slugs, and the name in the reader's
 * language. The chosen professor comes from the same read, matched by the
 * script's database id.
 *
 * The localized names live only in Sanity — the Postgres `subjects.name` and
 * `professors.name` the API returns are single strings frozen when the rows were
 * linked — so they are read here rather than taken from the script payload.
 *
 * Returns `null` instead of throwing when the id is missing, the subject isn't
 * in Sanity, or the read fails, so callers fall back to the name they already
 * have and a Sanity hiccup never takes a page down.
 */
export const getSubjectRef = async (
  subjectSanityId: string | null,
  professorDbId?: string | null
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
    const professor = professorDbId
      ? subject.professors?.find((row) => row.dbId === professorDbId)
      : null

    return {
      professorHref: professor?.slug
        ? catalogUrl(
            getAcademicPath(
              { type: 'professor', professorSlug: professor.slug },
              locale
            ),
            locale
          )
        : null,
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
      professorName: professor?.name || null,
    }
  } catch {
    return null
  }
}

/**
 * Localized subject names keyed by Sanity id, for the script cards in one list.
 * The card's subject line otherwise renders the single Postgres name, which is
 * frozen when the row is linked and never follows a language switch.
 *
 * One read for every distinct subject on the page. A failure returns an empty
 * map, so the cards fall back to that same Postgres name.
 */
export const getScriptSubjectNames = async (
  subjectSanityIds: ReadonlyArray<string | null | undefined>
): Promise<ReadonlyMap<string, string>> => {
  const ids = [
    ...new Set(subjectSanityIds.filter((id): id is string => Boolean(id))),
  ]
  if (ids.length === 0) return new Map()

  try {
    const subjects = await fetchSanityData<
      Array<{ _id: string; name: string }>
    >({
      query: subjectNamesByIdsQuery,
      params: { subjectIds: ids },
      locale: await getServerLocale(),
      fetchOrigin: 'script-subject-names',
      tags: [SANITY_CACHE_TAGS.subject],
    })

    return new Map(subjects.map(({ _id, name }) => [_id, name]))
  } catch {
    return new Map()
  }
}
