import { groq } from 'next-sanity'

/** Minimal listing query for the unified hierarchical gallery page */
export const universityGalleryQuery = groq`
*[_type == "university"] | order(name asc) {
  _id,
  name,
  dbId,
  "faculties": *[_type == "faculty" && references(^._id)] | order(name asc) {
    _id,
    name,
    dbId
  }
}
`

/** Minimal query for SEO metadata on a single university. */
export const universitySeoQuery = groq`
*[_type == "university" && (_id == $slug || _id == "drafts." + $slug || dbId == $slug)][0] {
  _id,
  name,
  description
}
`

/** Deep relational query for a single university and its related entities */
export const universityDetailQuery = groq`
*[_type == "university" && (_id == $slug || _id == "drafts." + $slug || dbId == $slug)][0] {
  _id,
  _type,
  name,
  dbId,
  description,
  streetAddress,
  telephone,
  email,
  website,
  rector->{
    _id,
    name,
    title,
    image
  },
  viceRectors[]->{
    _id,
    name,
    title,
    image
  },
  "faculties": *[_type == "faculty" && references(^._id)] | order(name asc) {
    _id,
    name,
    dbId,
    email,
    telephone,
    website,
    "subjectCount": count(*[_type == "subject" && references(^._id)]),
    "professorCount": count(*[_type == "professor" && references(^._id)])
  }
}
`

/** Static params query for pre-generating all university subroutes */
export const universityStaticParamsQuery = groq`
*[_type == "university" && !(_id in path("drafts.**"))] {
  "slug": _id
}
`
