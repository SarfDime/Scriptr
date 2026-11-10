import { groq } from 'next-sanity'

/**
 * The catalog search: universities, faculties, studies and professors. Scripts
 * and subjects are not here — they belong to a study, and a study site searches
 * its own content.
 *
 * `name match $term` is GROQ's word matching, with the caller passing a
 * trailing `*` so a partial word still matches. Each list is capped: this is a
 * "where does this exist in the catalog" jump list, not a full search engine.
 */
export const catalogSearchQuery = groq`
{
  "universities": *[_type == "university" && dbId != null && name match $term] | order(name asc)[0...20] {
    _id,
    name,
    "slug": slug.current
  },
  "faculties": *[_type == "faculty" && dbId != null && name match $term] | order(name asc)[0...20] {
    _id,
    name,
    "slug": slug.current,
    university->{
      _id,
      name,
      "slug": slug.current
    }
  },
  "studies": *[_type == "study" && dbId != null && name match $term] | order(name asc)[0...20] {
    _id,
    name,
    "slug": slug.current,
    "siteSlug": siteSlug.current,
    faculty->{
      _id,
      name,
      "slug": slug.current,
      university->{
        _id,
        name,
        "slug": slug.current
      }
    }
  },
  "professors": *[_type == "professor" && dbId != null && name match $term] | order(name asc)[0...20] {
    _id,
    name,
    "slug": slug.current
  }
}
`
