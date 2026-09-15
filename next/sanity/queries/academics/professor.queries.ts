import { groq } from 'next-sanity'
import { sanityFunctionQueries } from '../functions.queries'

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
"subjects": *[_type == "subject" && references(^._id)] | order(year asc, name asc) {
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
  "subjects": *[_type == "subject" && references(^._id)] | order(year asc, name asc) {
    _id,
    "slug": slug.current,
    name,
    year,
    code,
    credits,
    study->{
      _id,
      "slug": slug.current,
      faculty->{
        _id,
        "slug": slug.current,
        name,
        university->{
          _id,
          "slug": slug.current,
          name,
        }
      }
    }
  }
}
`

/** Static params query for pre-generating all professor subroutes */
export const professorStaticParamsQuery = groq`
*[_type == "professor" && !(_id in path("drafts.**"))] {
  "professorSlug": coalesce(slug.current, _id)
}
`
