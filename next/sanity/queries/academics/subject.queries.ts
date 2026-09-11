import { groq } from 'next-sanity'

/** Minimal query for SEO metadata on a subject. */
export const subjectSeoQuery = groq`
*[_type == "subject" && (_id == $slug || _id == "drafts." + $slug || dbId == $slug)][0] {
  _id,
  name,
  description
}
`

export const minimalSubjectQuery = groq`
_id,
name,
code,
credits,
year,
semester,
description,
syllabus,
"faculty": studyProgram->faculty->{
  _id,
  name,
  dbId,
  university->{
    _id,
    name,
  }
},
studyProgram->{
  _id,
  name,
  dbId,
  faculty->{
    _id,
    name,
    dbId,
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
*[_type == "subject" && (_id == $slug || _id == "drafts." + $slug || dbId == $slug)][0] {
  _id,
  _type,
  name,
  dbId,
  code,
  credits,
  year,
  semester,
  description,
  syllabus,
  "faculty": studyProgram->faculty->{
    _id,
    name,
    dbId,
    faculty->{
      _id,
      name,
      dbId
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
  "slug": _id
}
`
