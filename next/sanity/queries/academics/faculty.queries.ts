import { groq } from 'next-sanity'

/** Minimal query for SEO metadata on a faculty. */
export const facultySeoQuery = groq`
*[_type == "faculty" && (_id == $slug || _id == "drafts." + $slug || dbId == $slug)][0] {
  _id,
  name,
  description
}
`

/** Deep relational query for a faculty: own info, parent university, and child professors/subjects */
export const facultyDetailQuery = groq`
*[_type == "faculty" && (_id == $slug || _id == "drafts." + $slug || dbId == $slug)][0] {
  _id,
  _type,
  name,
  dbId,
  description,
  secretary,
  streetAddress,
  telephone,
  email,
  website,
  dean->{
    _id,
    name,
    title,
    image
  },
  viceDeans[]->{
    _id,
    name,
    title,
    image
  },
  university->{
    _id,
    name,
    dbId
  },
  "professors": *[_type == "professor" && references(^._id)] | order(name asc) {
    _id,
    name,
    dbId,
    title,
    picture,
    email,
    office
  },
  "subjects": *[_type == "subject" && references(^._id)] | order(year asc, name asc) {
    _id,
    name,
    dbId,
    year,
    examSession,
    code,
    credits,
    semester
  }
}
`

/** Static params query for pre-generating all faculty subroutes */
export const facultyStaticParamsQuery = groq`
*[_type == "faculty" && !(_id in path("drafts.**"))] {
  "slug": _id
}
`
