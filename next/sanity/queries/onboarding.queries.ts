import { groq } from 'next-sanity'

const onboardingSidebarSubjectQuery = /* groq */ `
  _id,
  dbId,
  "slug": slug.current,
  name,
  code,
  credits,
  year,
  semester,
  elective,
  "faculty": study->faculty->{
    _id,
    "slug": slug.current,
    name,
    dbId,
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
    dbId,
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

export const onboardingCatalogQuery = groq`
{
  "universities": *[_type == "university" && dbId != null]{ _id, dbId, name, "slug": slug.current },
  "faculties": *[_type == "faculty" && university._ref != null && dbId != null]{ _id, dbId, name, "slug": slug.current, "universityId": university._ref },
  "studies": *[_type == "study" && faculty._ref != null && dbId != null]{
    _id,
    dbId,
    name,
    "slug": slug.current,
    "facultyId": faculty._ref,
    "subjectsByYear": *[_type == "subject" && study._ref == ^._id && dbId != null
        && _id == (*[_type == "subject" && study._ref == ^.study._ref && dbId != null && year == ^.year] | order(_id asc)[0]._id)
      ] | order(year asc){
      year,
      "subjects": *[_type == "subject" && study._ref == ^.study._ref && dbId != null && year == ^.year] | order(name asc){
        _id, dbId, name, year, elective, "studyId": study._ref
      }
    },
  },
  "subjects": *[_type == "subject" && study._ref != null && dbId != null] | order(year asc){
    ${onboardingSidebarSubjectQuery}
  }
}`
