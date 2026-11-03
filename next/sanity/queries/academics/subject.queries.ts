import { groq } from 'next-sanity'
import { sanityFunctionQueries } from '../functions.queries'

/** Minimal query for SEO metadata on a subject. */
export const subjectSeoQuery = groq`
*[_type == "subject"
  && (slug.current == $subjectSlug || _id == $subjectSlug || _id == "drafts." + $subjectSlug || dbId == $subjectSlug)
  && study->slug.current == $studySlug
  && study->faculty->slug.current == $facultySlug
  && study->faculty->university->slug.current == $universitySlug
][0] {
  _id,
  "slug": slug.current,
  name,
  description,
}
`

export const minimalSubjectQuery = /* groq */ `
_id,
dbId,
"slug": slug.current,
name,
code,
credits,
year,
semester,
elective,
description,
syllabus,
"faculty": study->faculty->{
  _id,
  "slug": slug.current,
  name,
  university->{
    _id,
    "slug": slug.current,
    name,
  },
},
study->{
  _id,
  "slug": slug.current,
  name,
  faculty->{
    _id,
    "slug": slug.current,
    name,
    university->{
      _id,
      "slug": slug.current,
      name,
    },
  },
},
professors[]->{
  _id,
  dbId,
  "slug": slug.current,
  name,
  title,
},
`

export const minimalSubjectQueryTyped = groq`
${sanityFunctionQueries}

*[_type == "subject"
  && (slug.current == $subjectSlug || _id == $subjectSlug || _id == "drafts." + $subjectSlug || dbId == $subjectSlug)
  && study->slug.current == $studySlug
  && study->faculty->slug.current == $facultySlug
  && study->faculty->university->slug.current == $universitySlug
][0]{
  ${minimalSubjectQuery}
}
`

/** Deep relational query for a subject: own info, parent faculty & university, and assigned professors */
export const subjectDetailQuery = groq`
${sanityFunctionQueries}

*[_type == "subject"
  && (slug.current == $subjectSlug || _id == $subjectSlug || _id == "drafts." + $subjectSlug || dbId == $subjectSlug)
  && study->slug.current == $studySlug
  && study->faculty->slug.current == $facultySlug
  && study->faculty->university->slug.current == $universitySlug
][0] {
  ${minimalSubjectQuery}
  _type,
  professors[]->{
    _id,
    "slug": slug.current,
    name,
    dbId,
    title,
    picture,
    email
  }
}
`

/** Fetches a subject by its Sanity or database id directly — no ancestor-slug
 * scoping, unlike subjectDetailQuery above. */
export const subjectByIdQuery = groq`
${sanityFunctionQueries}

*[_type == "subject" && (_id == $subjectId || _id == "drafts." + $subjectId || dbId == $subjectId)][0] {
  ${minimalSubjectQuery}
  _type,
  professors[]->{
    _id,
    "slug": slug.current,
    name,
    dbId,
    title,
    picture,
    email
  }
}
`

/** Just the slugs needed to build a subject's page path (see
 * `getAcademicPath({ type: 'subject' })`), looked up from the subject's Sanity
 * or database id alone. Same `coalesce(slug.current, _id)` fallback as
 * `subjectStaticParamsQuery`, so the result is exactly the shape the subject
 * route resolves. */
export const subjectPathQuery = groq`
*[_type == "subject" && (_id == $subjectId || _id == "drafts." + $subjectId || dbId == $subjectId)][0] {
  "subjectSlug": coalesce(slug.current, _id),
  "studySlug": coalesce(study->slug.current, study->_id),
  "facultySlug": coalesce(study->faculty->slug.current, study->faculty->_id),
  "universitySlug": coalesce(study->faculty->university->slug.current, study->faculty->university->_id)
}
`

/** Static params query for pre-generating all subject subroutes */
export const subjectStaticParamsQuery = groq`
*[_type == "subject" && !(_id in path("drafts.**")) && dbId != null] {
  "subjectSlug": coalesce(slug.current, _id),
  "studySlug": coalesce(study->slug.current, study->_id),
  "facultySlug": coalesce(study->faculty->slug.current, study->faculty->_id),
  "universitySlug": coalesce(study->faculty->university->slug.current, study->faculty->university->_id)
}
`
