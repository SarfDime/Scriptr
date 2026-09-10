import { createIfNotExists, defineMigration } from 'sanity/migrate'
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
  refs,
  toPortableText,
  uploadImage,
} from './helpers'

export default defineMigration({
  title:
    'Seed academic documents (universities, faculties, persons, professors, subjects)',

  async *migrate(_documents, context) {
    const client = context.client.withConfig({ apiVersion: '2024-01-01' })

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
      yield createIfNotExists(subjectToDoc(subject))
    }
  },
})

async function personToDoc(seed: SeedPerson, client: AssetUploadClient) {
  return {
    _id: seed.id,
    _type: 'person' as const,
    name: seed.name,
    title: seed.title,
    description: toPortableText(seed.description),
    image: await uploadImage(client, seed.imageUrl),
  }
}

function universityToDoc(seed: SeedUniversity) {
  return {
    _id: seed.id,
    _type: 'university' as const,
    name: seed.name,
    description: toPortableText(seed.description),
    streetAddress: seed.streetAddress,
    telephone: seed.telephone,
    email: seed.email,
    website: seed.website,
    rector: seed.rectorId ? ref(seed.rectorId) : undefined,
    viceRectors: seed.viceRectorIds ? refs(seed.viceRectorIds) : undefined,
  }
}

function facultyToDoc(seed: SeedFaculty) {
  return {
    _id: seed.id,
    _type: 'faculty' as const,
    name: seed.name,
    description: toPortableText(seed.description),
    dean: ref(seed.deanId),
    secretary: ref(seed.secretaryId),
    viceDeans: seed.viceDeanIds ? refs(seed.viceDeanIds) : undefined,
    streetAddress: seed.streetAddress,
    telephone: seed.telephone,
    email: seed.email,
    website: seed.website,
    university: ref(seed.universityId),
  }
}

async function professorToDoc(seed: SeedProfessor, client: AssetUploadClient) {
  return {
    _id: seed.id,
    _type: 'professor' as const,
    name: seed.name,
    title: seed.title,
    bio: toPortableText(seed.bio),
    office: seed.office,
    telephone: seed.telephone,
    email: seed.email,
    website: seed.website,
    faculties: refs(seed.facultyIds),
    picture: await uploadImage(client, seed.imageUrl),
  }
}

function subjectToDoc(seed: SeedSubject) {
  return {
    _id: seed.id,
    _type: 'subject' as const,
    name: seed.name,
    code: seed.code,
    description: toPortableText(seed.description),
    credits: seed.credits,
    syllabus: seed.syllabus,
    year: seed.year,
    semester: seed.semester,
    examSession: seed.examSession,
    professors: refs(seed.professorIds),
    faculty: ref(seed.facultyId),
  }
}
