import { groq } from 'next-sanity'

/** Minimal query for SEO metadata on a professor. */
export const professorSeoQuery = groq`
*[_type == "professor" && (_id == $slug || _id == "drafts." + $slug || dbId == $slug)][0] {
  _id,
  name,
  bio
}
`

export const minimalProfessorQuery = groq`
_id,
name,
title,
defined(picture)=>{ "picture": sanityImage::full(picture) },
faculties[]->{
  _id,
  name,
  university->{
    _id,
    name,
  },
},
"universities": array::unique(faculties[]->university)[defined(@)]->{
  _id,
  name,
},
"subjects": *[_type == "subject" && references(^._id)] | order(year asc, name asc) {
  _id,
  name,
  code,
},
`

/** Deep relational query for a professor: own info, faculties, and taught subjects */
export const professorDetailQuery = groq`
*[_type == "professor" && (_id == $slug || _id == "drafts." + $slug || dbId == $slug)][0] {
  _id,
  _type,
  name,
  title,
  bio,
  defined(picture)=>{ "picture": sanityImage::full(picture) },
  office,
  telephone,
  email,
  website,
  faculties[]->{
    _id,
    name,
    university->{
      _id,
      name,
    }
  },
  "universities": array::unique(faculties[]->university)[defined(@)]->{
    _id,
    name,
  },
  "subjects": *[_type == "subject" && references(^._id)] | order(year asc, name asc) {
    _id,
    name,
    year,
    code,
    credits,
    study->faculty->{
      _id,
      name,
    }
  }
}
`

/** Static params query for pre-generating all professor subroutes */
export const professorStaticParamsQuery = groq`
*[_type == "professor" && !(_id in path("drafts.**"))] {
  "slug": _id
}
`
