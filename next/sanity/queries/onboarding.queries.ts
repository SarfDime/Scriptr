import { groq } from 'next-sanity'

export const onboardingCatalogQuery = groq`{ 
  "universities": *[_type == "university"]{ _id, dbId, name },
  "faculties": *[_type == "faculty"]{ _id, dbId, name, "universityId": university._ref },
  "studies": *[_type == "study"]{
    _id,
    dbId,
    name,
    "facultyId": faculty._ref,
    "subjectsByYear": array::unique(*[_type == "subject" && study._ref == ^._id].year) | order(@ asc) {
      "year": @,
      "subjects": *[_type == "subject" && study._ref == ^.^._id && year == ^]{
        _id, dbId, name, year, "studyId": study._ref
      }
    }
  },
  "subjects": *[_type == "subject"] | order(year asc){ _id, dbId, name, year, "studyId": study._ref }
}`
