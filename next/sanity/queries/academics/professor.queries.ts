import { groq } from 'next-sanity'
import { sanityFunctionQueries } from '../functions.queries'
import {
  localizedBlocksProjection,
  localizedProjection,
  localizedValue,
} from '../localized.queries'
import { minimalSubjectQuery } from './subject.queries'

/** Minimal query for SEO metadata on a professor. */
export const professorSeoQuery = groq`
*[_type == "professor" && (slug.current == $professorSlug || _id == $professorSlug || _id == "drafts." + $professorSlug || dbId == $professorSlug)][0] {
  _id,
  "slug": slug.current,
  ${localizedProjection('name', 'localizedName')},
  ${localizedBlocksProjection('bio', 'localizedBio')}
}
`

export const minimalProfessorQuery = /* groq */ `
_id,
"slug": slug.current,
dbId,
${localizedProjection('name', 'localizedName')},
${localizedProjection('title', 'localizedTitle')},
"picture": sanityImage::full(picture),
faculties[]->{
  _id,
  "slug": slug.current,
  ${localizedProjection('name', 'localizedName')},
  university->{
    _id,
    "slug": slug.current,
    ${localizedProjection('name', 'localizedName')},
  },
},
"universities": array::unique(faculties[]->university)[defined(@)]->{
  _id,
  "slug": slug.current,
  ${localizedProjection('name', 'localizedName')},
},
"subjects": *[_type == "subject" && references(^._id) && dbId != null] | order(year asc, ${localizedValue('localizedName')} asc) {
  _id,
  "slug": slug.current,
  ${localizedProjection('name', 'localizedName')},
  ${localizedProjection('code', 'localizedCode')},
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
  ${localizedBlocksProjection('bio', 'localizedBio')},
  office,
  telephone,
  email,
  website,
  faculties[]->{
    _id,
    "slug": slug.current,
    ${localizedProjection('name', 'localizedName')},
    university->{
      _id,
      "slug": slug.current,
      ${localizedProjection('name', 'localizedName')},
    }
  },
  "subjects": *[_type == "subject" && references(^._id) && dbId != null] | order(year asc, ${localizedValue('localizedName')} asc) {
    ${minimalSubjectQuery}
  }
}
`

/** Static params query for pre-generating all professor subroutes */
export const professorStaticParamsQuery = groq`
*[_type == "professor" && !(_id in path("drafts.**")) && dbId != null] {
  "professorSlug": coalesce(slug.current, _id)
}
`
