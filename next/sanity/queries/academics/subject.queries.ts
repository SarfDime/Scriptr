import { groq } from 'next-sanity'

/** Minimal query for SEO metadata on a subject. */
export const subjectSeoQuery = groq`
*[_type == "subject" && (slug.current == $slug || _id == $slug || _id == "drafts." + $slug || dbId == $slug)][0] {
  _id,
  "slug": slug.current,
  name,
  description
}
`

export const minimalSubjectQuery = groq`
_id,
"slug": slug.current,
name,
code,
credits,
year,
semester,
description,
syllabus,
"faculty": study->faculty->{
  _id,
  name,
  dbId,
  university->{
    _id,
    name,
  }
},
study->{
  _id,
  "slug": slug.current,
  name,
  dbId,
  faculty->{
    _id,
    "slug": slug.current,
    name,
  }
},
professors[]->{
  _id,
  name,
  title,
}
`

/** Deep relational query for a subject: own info, parent faculty & university, and assigned professors */
export const subjectDetailQuery = groq`
*[_type == "subject" && (slug.current == $slug || _id == $slug || _id == "drafts." + $slug || dbId == $slug)][0] {
  _id,
  "slug": slug.current,
  _type,
  name,
  code,
  credits,
  year,
  semester,
  description,
  syllabus,
  study->{
    _id,
    name,
    dbId,
    faculty->{
      _id,
      "slug": slug.current,
      name,
      university->{
        _id,
        name,
      }
    }
  },
  professors[]->{
    _id,
    name,
    dbId,
    title,
    picture,
    email
  }
}
`

/** Static params query for pre-generating all subject subroutes */
export const subjectStaticParamsQuery = groq`
*[_type == "subject" && !(_id in path("drafts.**"))] {
  "slug": coalesce(slug.current, _id)
}
`
