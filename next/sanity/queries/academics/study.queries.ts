import { groq } from 'next-sanity'
import { sanityFunctionQueries } from '../functions.queries'
import {
  localizedBlocksProjection,
  localizedProjection,
  localizedValue,
} from '../localized.queries'
import { minimalProfessorQuery } from './professor.queries'
import { minimalSubjectQuery } from './subject.queries'

/** Minimal query for SEO metadata on a study. */
export const studySeoQuery = groq`
*[_type == "study"
  && (slug.current == $studySlug || _id == $studySlug || _id == "drafts." + $studySlug || dbId == $studySlug)
  && faculty->slug.current == $facultySlug
  && faculty->university->slug.current == $universitySlug
][0] {
  _id,
  "slug": slug.current,
  ${localizedProjection('name', 'localizedName')},
  ${localizedBlocksProjection('description', 'localizedDescription')},
}
`

export const minimalStudyQuery = /* groq */ `
_id,
dbId,
"slug": slug.current,
"siteSlug": siteSlug.current,
${localizedProjection('name', 'localizedName')},
studentCount,
"picture": sanityImage::full(picture),
"logo": sanityImage::full(logo),
assistant->{
  _id,
  ${localizedProjection('name', 'localizedName')},
  ${localizedProjection('title', 'localizedTitle')},
  "picture": sanityImage::full(picture)
},
faculty->{
  _id,
  "slug": slug.current,
  ${localizedProjection('name', 'localizedName')},
  university->{
    _id,
    "slug": slug.current,
    ${localizedProjection('name', 'localizedName')},
  }
},
"subjectCount": count(*[_type == "subject" && references(^._id) && dbId != null]),
"professorCount": count(*[_type == "professor" && references(^._id) && dbId != null]),
"professors": *[_type == "professor" && references(^._id) && dbId != null] | order(${localizedValue('localizedName')} asc) {
  ${minimalProfessorQuery}
},
"subjects": *[_type == "subject" && references(^._id) && dbId != null] | order(year asc, ${localizedValue('localizedName')} asc) {
  ${minimalSubjectQuery}
},
`

/** @private @description DO NOT USE !! Minimal query for typed GROQ result */
export const minimalStudyTypedQuery = groq`
${sanityFunctionQueries}

*[_type == "study"
  && (slug.current == $studySlug || _id == $studySlug || _id == "drafts." + $studySlug || dbId == $studySlug)
  && faculty->slug.current == $facultySlug
  && faculty->university->slug.current == $universitySlug
][0] {
${minimalStudyQuery}
}
`

/** Deep relational query for a study: own info, parent university, parent faculty, and child professors/subjects */
export const studyDetailQuery = groq`
${sanityFunctionQueries}

*[_type == "study"
  && (slug.current == $studySlug || _id == $studySlug || _id == "drafts." + $studySlug || dbId == $studySlug)
  && faculty->slug.current == $facultySlug
  && faculty->university->slug.current == $universitySlug
][0] {
  ${minimalStudyQuery}
  _type,
  ${localizedBlocksProjection('description', 'localizedDescription')},
  streetAddress,
  telephone,
  email,
  website,
}
`

/** Static params query for pre-generating all study subroutes */
export const studyStaticParamsQuery = groq`
*[_type == "study" && !(_id in path("drafts.**")) && dbId != null] {
  "studySlug": coalesce(slug.current, _id),
  "facultySlug": coalesce(faculty->slug.current, faculty->_id),
  "universitySlug": coalesce(faculty->university->slug.current, faculty->university->_id),
  "siteSlug": siteSlug.current
}
`

/**
 * The catalog tree the study picker offers: names and slugs only, no subjects.
 * A study is offered once it has a site handle and a database row, since that
 * is what enrolling into it writes.
 */
export const studyPickerQuery = groq`
{
  "universities": *[_type == "university" && dbId != null] | order(${localizedValue('localizedName')} asc) {
    _id,
    ${localizedProjection('name', 'localizedName')},
    "slug": slug.current
  },
  "faculties": *[_type == "faculty" && dbId != null && university._ref != null] | order(${localizedValue('localizedName')} asc) {
    _id,
    ${localizedProjection('name', 'localizedName')},
    "slug": slug.current,
    "universityId": university._ref
  },
  "studies": *[_type == "study" && dbId != null && faculty._ref != null && siteSlug.current != null] | order(${localizedValue('localizedName')} asc) {
    _id,
    ${localizedProjection('name', 'localizedName')},
    "slug": slug.current,
    "siteSlug": siteSlug.current,
    "facultyId": faculty._ref,
    dbId
  }
}
`

/** The catalog identity behind one site handle. Study pages are addressed by
 * `siteSlug` alone; this turns it into the slug tuple the shared detail queries
 * (and `getAcademicPath`) already take. */
export const studySiteQuery = groq`
*[_type == "study" && siteSlug.current == $siteSlug]{
  _id,
  "studySlug": coalesce(slug.current, _id),
  "facultySlug": coalesce(faculty->slug.current, faculty->_id),
  "universitySlug": coalesce(faculty->university->slug.current, faculty->university->_id),
  "siteSlug": siteSlug.current,
  "name": ${localizedValue('localizedName')},
  "facultyName": ${localizedValue('faculty->localizedName')},
  "universityName": ${localizedValue('faculty->university->localizedName')},
  dbId
}[0]
`

/** The subjects of one study, for the site header's calendar alert: a database
 * id to match an event against and a name to label the preview. Deliberately
 * its own small read — the alert needs nothing else about them. */
export const studyAlertSubjectsQuery = groq`
*[_type == "subject"
  && dbId != null
  && study._ref == *[_type == "study" && siteSlug.current == $siteSlug][0]._id
] | order(${localizedValue('localizedName')} asc){
  dbId,
  ${localizedProjection('name', 'localizedName')}
}
`
