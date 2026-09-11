import { groq } from 'next-sanity'
import { sanityImageFunction } from '../functions.queries'
import { minimalProfessorQuery } from './professor.queries'
import { minimalStudyQuery } from './study.queries'

/** Minimal query for SEO metadata on a faculty. */
const facultySeoQuery = groq`
*[_type == "faculty" && (slug.current == $slug || _id == $slug || _id == "drafts." + $slug || dbId == $slug)][0] {
  _id,
  "slug": slug.current,
  name,
  description
}
`

const minimalFacultyQuery = groq`
_id,
"slug": slug.current,
name,
studentCount,
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
  "slug": slug.current,
  name,
  dbId
},
"studyCount": count(*[_type == "study" && references(^._id)]),
"professorCount": count(*[_type == "professor" && references(^._id)]),
"professors": *[_type == "professor" && references(^._id)] | order(name asc) {
  ${minimalProfessorQuery}
},
"studies": *[_type == "study" && references(^._id)] | order(name asc) {
  ${minimalStudyQuery}
},
`

/** Deep relational query for a faculty: own info, parent university, and child professors/subjects */
const facultyDetailQuery = groq`
${sanityImageFunction}

*[_type == "faculty" && (slug.current == $slug || _id == $slug || _id == "drafts." + $slug || dbId == $slug)][0] {
  _id,
  "slug": slug.current,
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
    "slug": slug.current,
    name,
    dbId
  },
  "professors": *[_type == "professor" && references(^._id)] | order(name asc) {
    ${minimalProfessorQuery}
  },
  "studies": *[_type == "study" && references(^._id)] | order(name asc) {
    ${minimalStudyQuery}
  }
}
`

/** Static params query for pre-generating all faculty subroutes */
const facultyStaticParamsQuery = groq`
*[_type == "faculty" && !(_id in path("drafts.**"))] {
  "slug": coalesce(slug.current, _id)
}
`

export {
  facultyDetailQuery,
  facultySeoQuery,
  facultyStaticParamsQuery,
  minimalFacultyQuery,
}
