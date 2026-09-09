import { groq } from 'next-sanity'
import { sanityImageFunction } from '../functions.queries'
import { minimalProfessorQuery } from './professor.queries'
import { minimalSubjectQuery } from './subject.queries'

/** Minimal query for SEO metadata on a faculty. */
export const facultySeoQuery = groq`
*[_type == "faculty" && (_id == $slug || _id == "drafts." + $slug || dbId == $slug)][0] {
  _id,
  name,
  description
}
`

export const minimalFacultyQuery = groq`
_id,
name,
defined(picture)=>{ "picture": sanityImage::full(picture) },
dean->{
  _id,
  name,
  title,
  defined(picture)=>{ "picture": sanityImage::full(picture) }
},
secretary->{
  _id,
  name,
  title,
  defined(picture)=>{ "picture": sanityImage::full(picture) }
},
viceDeans[]->{
  _id,
  name,
  title,
  defined(picture)=>{ "picture": sanityImage::full(picture) }
},
university->{
  _id,
  name,
  dbId
},
studentCount,
"subjectCount": count(*[_type == "subject" && references(^._id)]),
"professorCount": count(*[_type == "professor" && references(^._id)])
"professors": *[_type == "professor" && references(^._id)] | order(name asc) {
  ${minimalProfessorQuery}
},
"subjects": *[_type == "subject" && references(^._id)] | order(year asc, name asc) {
  ${minimalSubjectQuery}
}
`

/** Deep relational query for a faculty: own info, parent university, and child professors/subjects */
export const facultyDetailQuery = groq`
${sanityImageFunction}

*[_type == "faculty" && (_id == $slug || _id == "drafts." + $slug || dbId == $slug)][0] {
  _id,
  _type,
  name,
  dbId,
  description,
  streetAddress,
  telephone,
  email,
  defined(picture)=>{ "picture": sanityImage::full(picture) },
  website,
  studentCount,
  dean->{
    _id,
    name,
    title,
    defined(picture)=>{ "picture": sanityImage::full(picture) }
  },
  secretary->{
    _id,
    name,
    title,
    defined(picture)=>{ "picture": sanityImage::full(picture) }
  },
  viceDeans[]->{
    _id,
    name,
    title,
    defined(picture)=>{ "picture": sanityImage::full(picture) }
  },
  university->{
    _id,
    name,
    dbId
  },
  "professors": *[_type == "professor" && references(^._id)] | order(name asc) {
    ${minimalProfessorQuery}
  },
  "subjects": *[_type == "subject" && references(^._id)] | order(year asc, name asc) {
    ${minimalSubjectQuery}
  }
}
`

/** Static params query for pre-generating all faculty subroutes */
export const facultyStaticParamsQuery = groq`
*[_type == "faculty" && !(_id in path("drafts.**"))] {
  "slug": _id
}
`
