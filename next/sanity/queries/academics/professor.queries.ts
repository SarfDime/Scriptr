import { groq } from 'next-sanity'
import { sanityFunctionQueries } from '../functions.queries'
import { minimalSubjectQuery } from './subject.queries'

/** Minimal query for SEO metadata on a professor. */
export const professorSeoQuery = groq`
*[_type == "professor" && (slug.current == $professorSlug || _id == $professorSlug || _id == "drafts." + $professorSlug || dbId == $professorSlug)][0] {
  _id,
  "slug": slug.current,
  name,
  bio
}
`

export const minimalProfessorQuery = /* groq */ `
_id,
"slug": slug.current,
dbId,
name,
title,
"picture": sanityImage::full(picture),
faculties[]->{
  _id,
  "slug": slug.current,
  name,
  university->{
    _id,
    "slug": slug.current,
    name,
  },
},
"universities": array::unique(faculties[]->university)[defined(@)]->{
  _id,
  "slug": slug.current,
  name,
},
"subjects": *[_type == "subject" && references(^._id) && dbId != null] | order(year asc, name asc) {
  _id,
  "slug": slug.current,
  name,
  code,
},
`

/** @private @description DO NOT USE !! Minimal query for typed GROQ result */
export const minimalProfessorTypedQuery = groq`
${sanityFunctionQueries}

*[_type == "professor" && (slug.current == $professorSlug || _id == $professorSlug || _id == "drafts." + $professorSlug || dbId == $professorSlug)][0] {
${minimalProfessorQuery}
}
`

/** Deep relational query for a professor: own info, faculties, and taught subjects */
export const professorDetailQuery = groq`
${sanityFunctionQueries}

*[_type == "professor" && (slug.current == $professorSlug || _id == $professorSlug || _id == "drafts." + $professorSlug || dbId == $professorSlug)][0] {
  ${minimalProfessorQuery}
  _type,
  bio,
  office,
  telephone,
  email,
  website,
  faculties[]->{
    _id,
    "slug": slug.current,
    name,
    university->{
      _id,
      "slug": slug.current,
      name,
    }
  },
  "subjects": *[_type == "subject" && references(^._id) && dbId != null] | order(year asc, name asc) {
    ${minimalSubjectQuery}
  }
}
`

/** Static params query for pre-generating all professor subroutes */
export const professorStaticParamsQuery = groq`
*[_type == "professor" && !(_id in path("drafts.**")) && dbId != null] {
  "professorSlug": coalesce(slug.current, _id)
}
`
