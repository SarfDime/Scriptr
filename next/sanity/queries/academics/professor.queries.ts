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
  dbId,
  university->{
    _id,
    name,
    dbId,
  },
},
"universities": array::unique(faculties[]->university)[defined(@)]->{
  _id,
  name,
  dbId,
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
  dbId,
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
    dbId,
    university->{
      _id,
      name,
      dbId
    }
  },
  "universities": array::unique(faculties[]->university)[defined(@)]->{
    _id,
    name,
    dbId,
  },
  "subjects": *[_type == "subject" && references(^._id)] | order(year asc, name asc) {
    _id,
    name,
    dbId,
    year,
    code,
    credits,
    faculty->{
      _id,
      name,
      dbId
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
