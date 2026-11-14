import { groq } from 'next-sanity'
import { localizedProjection, localizedValue } from './localized.queries'

/**
 * The catalog search: universities, faculties, studies and professors. Scripts
 * and subjects are not here — they belong to a study, and a study site searches
 * its own content.
 *
 * `… match $term` is GROQ's word matching, run against the name in the
 * reader's language, with the caller passing a trailing `*` so a partial word
 * still matches. Each list is capped: this is a "where does this exist in the
 * catalog" jump list, not a full search engine.
 */
export const catalogSearchQuery = groq`
{
  "universities": *[_type == "university" && dbId != null && (${localizedValue('localizedName')}) match $term] | order(${localizedValue('localizedName')} asc)[0...20] {
    _id,
    ${localizedProjection('name', 'localizedName')},
    "slug": slug.current
  },
  "faculties": *[_type == "faculty" && dbId != null && (${localizedValue('localizedName')}) match $term] | order(${localizedValue('localizedName')} asc)[0...20] {
    _id,
    ${localizedProjection('name', 'localizedName')},
    "slug": slug.current,
    university->{
      _id,
      ${localizedProjection('name', 'localizedName')},
      "slug": slug.current
    }
  },
  "studies": *[_type == "study" && dbId != null && (${localizedValue('localizedName')}) match $term] | order(${localizedValue('localizedName')} asc)[0...20] {
    _id,
    ${localizedProjection('name', 'localizedName')},
    "slug": slug.current,
    "siteSlug": siteSlug.current,
    faculty->{
      _id,
      ${localizedProjection('name', 'localizedName')},
      "slug": slug.current,
      university->{
        _id,
        ${localizedProjection('name', 'localizedName')},
        "slug": slug.current
      }
    }
  },
  "professors": *[_type == "professor" && dbId != null && (${localizedValue('localizedName')}) match $term] | order(${localizedValue('localizedName')} asc)[0...20] {
    _id,
    ${localizedProjection('name', 'localizedName')},
    "slug": slug.current
  }
}
`
