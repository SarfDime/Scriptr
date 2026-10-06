import { groq } from 'next-sanity'
import { sanityFunctionQueries } from '../functions.queries'
import { minimalProfessorQuery } from './professor.queries'
import { minimalSubjectQuery } from './subject.queries'

/** Minimal query for SEO metadata on a study. */
export const studySeoQuery = groq`
*[_type == "study"
  && (slug.current == $studySlug || _id == $studySlug || _id == "drafts." + $studySlug || dbId == $studySlug)
  && faculty->slug.current == $facultySlug
  && faculty->university->slug.current == $universitySlug
][0] {
  _id,
  "slug": slug.current,
  name,
  description,
}
`

export const minimalStudyQuery = /* groq */ `
_id,
dbId,
"slug": slug.current,
name,
studentCount,
"picture": sanityImage::full(picture),
assistant->{
  _id,
  name,
  title,
  "picture": sanityImage::full(picture)
},
faculty->{
  _id,
  "slug": slug.current,
  name,
  university->{
    _id,
    "slug": slug.current,
    name,
  }
},
"subjectCount": count(*[_type == "subject" && references(^._id) && dbId != null]),
"professorCount": count(*[_type == "professor" && references(^._id) && dbId != null]),
"professors": *[_type == "professor" && references(^._id) && dbId != null] | order(name asc) {
  ${minimalProfessorQuery}
},
"subjects": *[_type == "subject" && references(^._id) && dbId != null] | order(year asc, name asc) {
  ${minimalSubjectQuery}
},
`

/** @private @description DO NOT USE !! Minimal query for typed GROQ result */
export const minimalStudyTypedQuery = groq`
${sanityFunctionQueries}

*[_type == "study"
  && (slug.current == $studySlug || _id == $studySlug || _id == "drafts." + $studySlug || dbId == $studySlug)
  && faculty->slug.current == $facultySlug
  && faculty->university->slug.current == $universitySlug
][0] {
${minimalStudyQuery}
}
`

/** Deep relational query for a study: own info, parent university, parent faculty, and child professors/subjects */
export const studyDetailQuery = groq`
${sanityFunctionQueries}

*[_type == "study"
  && (slug.current == $studySlug || _id == $studySlug || _id == "drafts." + $studySlug || dbId == $studySlug)
  && faculty->slug.current == $facultySlug
  && faculty->university->slug.current == $universitySlug
][0] {
  ${minimalStudyQuery}
  _type,
  description,
  streetAddress,
  telephone,
  email,
  website,
}
`

/** Static params query for pre-generating all study subroutes */
export const studyStaticParamsQuery = groq`
*[_type == "study" && !(_id in path("drafts.**")) && dbId != null] {
  "studySlug": coalesce(slug.current, _id),
  "facultySlug": coalesce(faculty->slug.current, faculty->_id),
  "universitySlug": coalesce(faculty->university->slug.current, faculty->university->_id)
}
`
