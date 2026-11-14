import { groq } from 'next-sanity'
import { localizedProjection, localizedValue } from './localized.queries'

const onboardingSidebarSubjectQuery = /* groq */ `
  _id,
  dbId,
  "slug": slug.current,
  ${localizedProjection('name', 'localizedName')},
  ${localizedProjection('code', 'localizedCode')},
  credits,
  year,
  semester,
  elective,
  "faculty": study->faculty->{
    _id,
    "slug": slug.current,
    ${localizedProjection('name', 'localizedName')},
    dbId,
    university->{
      _id,
      "slug": slug.current,
      ${localizedProjection('name', 'localizedName')},
    },
  },
  study->{
    _id,
    "slug": slug.current,
    "siteSlug": siteSlug.current,
    ${localizedProjection('name', 'localizedName')},
    dbId,
    faculty->{
      _id,
      "slug": slug.current,
      ${localizedProjection('name', 'localizedName')},
      university->{
        _id,
        "slug": slug.current,
        ${localizedProjection('name', 'localizedName')},
      },
    },
  },
  professors[]->{
    _id,
    dbId,
    "slug": slug.current,
    ${localizedProjection('name', 'localizedName')},
    ${localizedProjection('title', 'localizedTitle')},
  },
`

export const onboardingCatalogQuery = groq`
{
  "universities": *[_type == "university" && dbId != null]{ _id, dbId, ${localizedProjection('name', 'localizedName')}, "slug": slug.current },
  "faculties": *[_type == "faculty" && university._ref != null && dbId != null]{ _id, dbId, ${localizedProjection('name', 'localizedName')}, "slug": slug.current, "universityId": university._ref },
  "studies": *[_type == "study" && faculty._ref != null && dbId != null]{
    _id,
    dbId,
    ${localizedProjection('name', 'localizedName')},
    "slug": slug.current,
    "siteSlug": siteSlug.current,
    "facultyId": faculty._ref,
    "subjectsByYear": *[_type == "subject" && study._ref == ^._id && dbId != null
        && _id == (*[_type == "subject" && study._ref == ^.study._ref && dbId != null && year == ^.year] | order(_id asc)[0]._id)
      ] | order(year asc){
      year,
      "subjects": *[_type == "subject" && study._ref == ^.study._ref && dbId != null && year == ^.year] | order(${localizedValue('localizedName')} asc){
        _id, dbId, ${localizedProjection('name', 'localizedName')}, year, elective, "studyId": study._ref
      }
    },
  },
  "subjects": *[_type == "subject" && study._ref != null && dbId != null] | order(year asc){
    ${onboardingSidebarSubjectQuery}
  }
}`
