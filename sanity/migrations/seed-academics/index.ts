import { create, createIfNotExists, defineMigration } from 'sanity/migrate'
import type {
  SeedFaculty,
  SeedPerson,
  SeedProfessor,
  SeedSubject,
  SeedUniversity,
} from './data'
import { faculties, persons, professors, subjects, universities } from './data'
import {
  type AssetUploadClient,
  ref,
  toPortableText,
  uploadImage,
} from './helpers'

export default defineMigration({
  title:
    'Seed academic documents (universities, faculties, persons, professors, subjects)',

  async *migrate(_documents, context) {
    const client = context.client.withConfig({ apiVersion: '2026-08-08' })

    for (const person of persons) {
      yield createIfNotExists(await personToDoc(person, client))
    }

    for (const university of universities) {
      yield createIfNotExists(universityToDoc(university))
    }

    for (const faculty of faculties) {
      yield createIfNotExists(facultyToDoc(faculty))
    }

    for (const professor of professors) {
      yield createIfNotExists(await professorToDoc(professor, client))
    }

    for (const subject of subjects) {
      yield create(subjectToDoc(subject))
    }
  },
})

async function personToDoc(seed: SeedPerson, client: AssetUploadClient) {
  return {
    _type: 'person' as const,
    name: seed.name,
    title: seed.title,
    description: toPortableText(seed.description),
    image: await uploadImage(client, seed.imageUrl),
  }
}

function universityToDoc(seed: SeedUniversity) {
  return {
    _type: 'university' as const,
    name: seed.name,
    description: toPortableText(seed.description),
    streetAddress: seed.streetAddress,
    telephone: seed.telephone,
    email: seed.email,
    website: seed.website,
  }
}

function facultyToDoc(seed: SeedFaculty) {
  return {
    _type: 'faculty' as const,
    name: seed.name,
    description: toPortableText(seed.description),
    streetAddress: seed.streetAddress,
    telephone: seed.telephone,
    email: seed.email,
    website: seed.website,
  }
}

async function professorToDoc(seed: SeedProfessor, client: AssetUploadClient) {
  return {
    _type: 'professor' as const,
    name: seed.name,
    title: seed.title,
    bio: toPortableText(seed.bio),
    office: seed.office,
    telephone: seed.telephone,
    email: seed.email,
    website: seed.website,
    picture: await uploadImage(client, seed.imageUrl),
  }
}

function subjectToDoc(seed: SeedSubject) {
  return {
    _id: undefined,
    _type: 'subject' as const,
    name: seed.name,
    code: seed.code,
    description: toPortableText(seed.description),
    keywords: seed.keywords,
    credits: seed.credits,
    syllabus: seed.syllabus,
    year: seed.year,
    semester: seed.semester,
    elective: seed.elective ?? false,
    study: ref('4be2eed0-f739-43f8-9182-ef7c1ab346fe'),
  }
}
