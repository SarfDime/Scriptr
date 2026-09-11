import { groq } from 'next-sanity'

/** Minimal query for SEO metadata on a professor. */
export const professorSeoQuery = groq`
*[_type == "professor" && (slug.current == $slug || _id == $slug || _id == "drafts." + $slug || dbId == $slug)][0] {
  _id,
  "slug": slug.current,
  name,
  bio
}
`

export const minimalProfessorQuery = groq`
_id,
"slug": slug.current,
name,
title,
defined(picture)=>{ "picture": sanityImage::full(picture) },
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
  name,
  code,
},
`

/** Deep relational query for a professor: own info, faculties, and taught subjects */
export const professorDetailQuery = groq`
*[_type == "professor" && (slug.current == $slug || _id == $slug || _id == "drafts." + $slug || dbId == $slug)][0] {
  _id,
  "slug": slug.current,
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
    "slug": slug.current,
    name,
    university->{
      _id,
      "slug": slug.current,
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
  "slug": coalesce(slug.current, _id)
}
`
