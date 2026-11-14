import { groq } from 'next-sanity'
import { sanityFunctionQueries } from '../functions.queries'
import {
  localizedBlocksProjection,
  localizedProjection,
  localizedValue,
} from '../localized.queries'
import { minimalFacultyQuery } from './faculty.queries'

/** Minimal listing query for the unified hierarchical gallery page */
export const universityGalleryQuery = groq`
*[_type == "university" && dbId != null] | order(${localizedValue('localizedName')} asc) {
  _id,
  "slug": slug.current,
  ${localizedProjection('name', 'localizedName')},
  "faculties": *[_type == "faculty" && references(^._id) && dbId != null] | order(${localizedValue('localizedName')} asc) {
    _id,
    "slug": slug.current,
    ${localizedProjection('name', 'localizedName')},
  }
}
`

/** Minimal query for SEO metadata on a single university. */
export const universitySeoQuery = groq`
*[_type == "university" && (slug.current == $universitySlug || _id == $universitySlug || _id == "drafts." + $universitySlug || dbId == $universitySlug)][0] {
  _id,
  "slug": slug.current,
  ${localizedProjection('name', 'localizedName')},
  ${localizedBlocksProjection('description', 'localizedDescription')},
}
`

/** Deep relational query for a single university and its related entities */
export const universityDetailQuery = groq`
${sanityFunctionQueries}

*[_type == "university" && (slug.current == $universitySlug || _id == $universitySlug || _id == "drafts." + $universitySlug || dbId == $universitySlug)][0] {
  _id,
  "slug": slug.current,
  _type,
  ${localizedProjection('name', 'localizedName')},
  ${localizedBlocksProjection('description', 'localizedDescription')},
  "picture": sanityImage::full(picture),
  "logo": sanityImage::full(logo),
  streetAddress,
  telephone,
  email,
  website,
  rector->{
    _id,
    ${localizedProjection('name', 'localizedName')},
    ${localizedProjection('title', 'localizedTitle')},
    "picture": sanityImage::full(picture)
  },
  viceRectors[]->{
    _id,
    ${localizedProjection('name', 'localizedName')},
    ${localizedProjection('title', 'localizedTitle')},
    "picture": sanityImage::full(picture)
  },
  "faculties": *[_type == "faculty" && references(^._id) && dbId != null] | order(${localizedValue('localizedName')} asc) {
    ${minimalFacultyQuery}
  }
}
`

/** Static params query for pre-generating all university subroutes */
export const universityStaticParamsQuery = groq`
*[_type == "university" && !(_id in path("drafts.**")) && dbId != null] {
  "universitySlug": coalesce(slug.current, _id)
}
`
