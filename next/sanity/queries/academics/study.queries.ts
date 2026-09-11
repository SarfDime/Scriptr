import { groq } from 'next-sanity'
import { sanityImageFunction } from '../functions.queries'
import { minimalFacultyQuery } from './faculty.queries'
import { minimalProfessorQuery } from './professor.queries'
import { minimalSubjectQuery } from './subject.queries'

/** Minimal query for SEO metadata on a study. */
export const studySeoQuery = groq`
*[_type == "study" && (slug.current == $slug || _id == $slug || _id == "drafts." + $slug || dbId == $slug)][0] {
  _id,
  "slug": slug.current,
  name,
  description
}
`

export const minimalStudyQuery = groq`
_id,
"slug": slug.current,
name,
studentCount,
defined(picture)=>{ "picture": sanityImage::full(picture) },
assistant->{
  _id,
  name,
  title,
  defined(picture)=>{ "picture": sanityImage::full(picture) }
},
faculty->{
  _id,
  name,
  university->{
    _id,
    name,
  }
},
"subjectCount": count(*[_type == "subject" && references(^._id)]),
"professorCount": count(*[_type == "professor" && references(^._id)]),
"professors": *[_type == "professor" && references(^._id)] | order(name asc) {
  ${minimalProfessorQuery}
},
"subjects": *[_type == "subject" && references(^._id)] | order(year asc, name asc) {
  ${minimalSubjectQuery}
},
`

/** Deep relational query for a study: own info, parent university, parent faculty, and child professors/subjects */
export const studyDetailQuery = groq`
${sanityImageFunction}

*[_type == "study" && (slug.current == $slug || _id == $slug || _id == "drafts." + $slug || dbId == $slug)][0] {
  _id,
  "slug": slug.current,
  _type,
  name,
  description,
  streetAddress,
  telephone,
  email,
  defined(picture)=>{ "picture": sanityImage::full(picture) },
  website,
  studentCount,
  faculty->{
    ${minimalFacultyQuery},
  },
  "professors": *[_type == "professor" && references(^._id)] | order(name asc) {
    ${minimalProfessorQuery}
  },
  "subjects": *[_type == "subject" && references(^._id)] | order(year asc, name asc) {
    ${minimalSubjectQuery}
  }
}
`

/** Static params query for pre-generating all study subroutes */
export const studyStaticParamsQuery = groq`
*[_type == "study" && !(_id in path("drafts.**"))] {
  "slug": coalesce(slug.current, _id)
}
`
