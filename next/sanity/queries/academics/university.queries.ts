import { groq } from 'next-sanity'
import { sanityFunctionQueries } from '../functions.queries'
import { minimalFacultyQuery } from './faculty.queries'

/** Minimal listing query for the unified hierarchical gallery page */
export const universityGalleryQuery = groq`
*[_type == "university" && dbId != null] | order(name asc) {
  _id,
  "slug": slug.current,
  name,
  "faculties": *[_type == "faculty" && references(^._id) && dbId != null] | order(name asc) {
    _id,
    "slug": slug.current,
    name,
  }
}
`

/** Minimal query for SEO metadata on a single university. */
export const universitySeoQuery = groq`
*[_type == "university" && (slug.current == $universitySlug || _id == $universitySlug || _id == "drafts." + $universitySlug || dbId == $universitySlug)][0] {
  _id,
  "slug": slug.current,
  name,
  description,
}
`

/** Deep relational query for a single university and its related entities */
export const universityDetailQuery = groq`
${sanityFunctionQueries}

*[_type == "university" && (slug.current == $universitySlug || _id == $universitySlug || _id == "drafts." + $universitySlug || dbId == $universitySlug)][0] {
  _id,
  "slug": slug.current,
  dbId,
  _type,
  name,
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
  "faculties": *[_type == "faculty" && references(^._id) && dbId != null] | order(name asc) {
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
