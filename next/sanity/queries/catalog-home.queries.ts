import { groq } from 'next-sanity'
import { sanityFunctionQueries } from './functions.queries'

/**
 * The catalog home: the levels above a study. Universities lead to their
 * faculties, studies lead to their own sites — the root page is a directory, not
 * a study's content surface. Subjects, professors and scripts belong to a study
 * and are only reachable from its site.
 *
 * Pictures and logos use `sanityImage::full` like the detail queries, so the
 * cards can render the same media the entity pages do.
 */
export const catalogHomeQuery = groq`
${sanityFunctionQueries}

{
  "universities": *[_type == "university" && dbId != null] | order(name asc) {
    _id,
    name,
    "slug": slug.current,
    "logo": sanityImage::full(logo),
    "picture": sanityImage::full(picture),
    "facultyCount": count(*[_type == "faculty" && references(^._id) && dbId != null])
  },
  "faculties": *[_type == "faculty" && university._ref != null && dbId != null] | order(name asc) {
    _id,
    name,
    "slug": slug.current,
    "logo": sanityImage::full(logo),
    "picture": sanityImage::full(picture),
    "studyCount": count(*[_type == "study" && references(^._id) && dbId != null]),
    "professorCount": count(*[_type == "professor" && references(^._id) && dbId != null]),
    university->{
      _id,
      name,
      "slug": slug.current
    }
  },
  "studies": *[_type == "study" && faculty._ref != null && dbId != null] | order(name asc) {
    _id,
    name,
    "slug": slug.current,
    "siteSlug": siteSlug.current,
    "logo": sanityImage::full(logo),
    "picture": sanityImage::full(picture),
    "subjectCount": count(*[_type == "subject" && references(^._id) && dbId != null]),
    "professorCount": count(*[_type == "professor" && references(^._id) && dbId != null]),
    faculty->{
      _id,
      name,
      "slug": slug.current,
      university->{
        _id,
        name,
        "slug": slug.current
      }
    }
  }
}
`
