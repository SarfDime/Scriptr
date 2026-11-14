import { groq } from 'next-sanity'
import { sanityFunctionQueries } from '../functions.queries'
import {
  localizedBlocksProjection,
  localizedProjection,
  localizedValue,
} from '../localized.queries'
import { minimalProfessorQuery } from './professor.queries'
import { minimalStudyQuery } from './study.queries'

/** Minimal query for SEO metadata on a faculty. */
const facultySeoQuery = groq`
${sanityFunctionQueries}

*[_type == "faculty"
  && (slug.current == $facultySlug || _id == $facultySlug || _id == "drafts." + $facultySlug || dbId == $facultySlug)
  && university->slug.current == $universitySlug
][0] {
  _id,
  "slug": slug.current,
  ${localizedProjection('name', 'localizedName')},
  ${localizedBlocksProjection('description', 'localizedDescription')},
}
`

const minimalFacultyQuery = /* groq */ `
_id,
"slug": slug.current,
${localizedProjection('name', 'localizedName')},
studentCount,
"picture": sanityImage::full(picture),
"logo": sanityImage::full(logo),
dean->{
  _id,
  ${localizedProjection('name', 'localizedName')},
  ${localizedProjection('title', 'localizedTitle')},
  "picture": sanityImage::full(picture)
},
secretary->{
  _id,
  ${localizedProjection('name', 'localizedName')},
  ${localizedProjection('title', 'localizedTitle')},
  "picture": sanityImage::full(picture)
},
viceDeans[]->{
  _id,
  ${localizedProjection('name', 'localizedName')},
  ${localizedProjection('title', 'localizedTitle')},
  "picture": sanityImage::full(picture)
},
university->{
  _id,
  "slug": slug.current,
  ${localizedProjection('name', 'localizedName')}
},
"studyCount": count(*[_type == "study" && references(^._id) && dbId != null]),
"professorCount": count(*[_type == "professor" && references(^._id) && dbId != null]),
"professors": *[_type == "professor" && references(^._id) && dbId != null] | order(${localizedValue('localizedName')} asc) {
  ${minimalProfessorQuery}
},
"studies": *[_type == "study" && references(^._id) && dbId != null] | order(${localizedValue('localizedName')} asc) {
  ${minimalStudyQuery}
},
`

/** @private @description DO NOT USE !! Minimal query for typed GROQ result */
export const minimalFacultyTypedQuery = groq`
${sanityFunctionQueries}

*[_type == "faculty"
  && (slug.current == $facultySlug || _id == $facultySlug || _id == "drafts." + $facultySlug || dbId == $facultySlug)
  && university->slug.current == $universitySlug
][0]{
${minimalFacultyQuery}
}
`

/** Deep relational query for a faculty: own info, parent university, and child professors/subjects */
const facultyDetailQuery = groq`
${sanityFunctionQueries}

*[_type == "faculty"
  && (slug.current == $facultySlug || _id == $facultySlug || _id == "drafts." + $facultySlug || dbId == $facultySlug)
  && university->slug.current == $universitySlug
][0] {
  ${minimalFacultyQuery}
  _type,
  ${localizedBlocksProjection('description', 'localizedDescription')},
  streetAddress,
  telephone,
  email,
  website,
}
`

/** Static params query for pre-generating all faculty subroutes */
const facultyStaticParamsQuery = groq`
*[_type == "faculty" && !(_id in path("drafts.**")) && dbId != null] {
  "facultySlug": coalesce(slug.current, _id),
  "universitySlug": coalesce(university->slug.current, university->_id)
}
`

export {
  facultyDetailQuery,
  facultySeoQuery,
  facultyStaticParamsQuery,
  minimalFacultyQuery,
}
