import type { SanityDocument } from '@sanity/client'
import { at, create, defineMigration, patch, set } from 'sanity/migrate'
import type {
  SeedFaculty,
  SeedPerson,
  SeedProfessor,
  SeedSubject,
  SeedUniversity,
} from './data'
import {
  electiveSubjects,
  faculties,
  persons,
  professors,
  regularSubjects,
  universities,
} from './data'
import {
  type AssetUploadClient,
  localizedPortableText,
  localizedString,
  localizedStringList,
  ref,
  toPortableText,
  uploadImage,
} from './helpers'

const STUDY_ID = '4be2eed0-f739-43f8-9182-ef7c1ab346fe'

const seedSubjects: Array<SeedSubject> = [
  ...regularSubjects,
  ...electiveSubjects.map((subject) => ({ ...subject, elective: true })),
]

export default defineMigration({
  title:
    'Seed academic documents (universities, faculties, persons, professors, subjects)',

  async *migrate(documents, context) {
    const client = context.client.withConfig({ apiVersion: '2026-08-08' })

    for (const person of persons) {
      yield create(await personToDoc(person, client))
    }

    for (const university of universities) {
      yield create(universityToDoc(university))
    }

    for (const faculty of faculties) {
      yield create(facultyToDoc(faculty))
    }

    for (const professor of professors) {
      yield create(professorToDoc(professor))
    }

    const { draftCodesById, publishedIdByCode } =
      await collectSubjectIds(documents)

    for (const subject of seedSubjects) {
      const code = subjectCodeKey(subject)
      const publishedId = code ? publishedIdByCode.get(code) : undefined

      if (!code || !publishedId) {
        yield create(subjectToDoc(subject))
        continue
      }

      // Patch only the fields the seed owns. Everything else on the document
      // (professors, slug, dbId, classes, …) is left untouched.
      const fields = subjectFields(subject)

      yield patch(publishedId, toFieldPatches(fields))

      // A draft shadows its published document in the Studio, so it has to
      // carry the same values — otherwise the editor keeps showing the old
      // content and publishing the draft would revert the seed. Drafts whose
      // code no longer matches the published document are left alone: they
      // belong to someone else's edit, not to this seed entry.
      const draftId = `drafts.${publishedId}`
      if (draftCodesById.get(draftId)?.has(code)) {
        yield patch(draftId, toFieldPatches(fields))
      }
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

function professorToDoc(seed: SeedProfessor) {
  return {
    _type: 'professor' as const,
    name: seed.name,
    title: seed.title,
    bio: toPortableText(seed.bio),
    office: seed.office,
    telephone: seed.telephone,
    email: seed.email,
    website: seed.website,
  }
}

function subjectFields(seed: SeedSubject) {
  return {
    name: seed.title?.en ?? seed.code?.en ?? '',
    code: seed.code?.en,
    localizedCode: localizedString(seed.code),
    localizedName: localizedString(seed.title),
    description: toPortableText(seed.description?.en),
    localizedDescription: localizedPortableText(seed.description),
    keywords: seed.keywords?.en,
    localizedKeywords: localizedStringList(seed.keywords),
    credits: seed.credits,
    syllabus: seed.syllabus,
    year: seed.year,
    semester: seed.semester,
    elective: seed.elective ?? false,
    study: ref(STUDY_ID),
  }
}

function subjectToDoc(seed: SeedSubject) {
  return {
    _type: 'subject' as const,
    ...subjectFields(seed),
  }
}

function toFieldPatches(fields: ReturnType<typeof subjectFields>) {
  return Object.entries(fields)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => at(key, set(value)))
}

type DocumentsIterator = () => AsyncIterableIterator<SanityDocument>

/** Maps every existing subject's codes to its document id, skipping drafts. */
async function collectSubjectIds(documents: DocumentsIterator) {
  const publishedIdByCode = new Map<string, string>()
  const draftCodesById = new Map<string, Set<string>>()

  for await (const document of documents()) {
    if (document._type !== 'subject') {
      continue
    }

    const codes = subjectCodes(document as Record<string, unknown>).map(
      normalizeCode
    )

    if (document._id.startsWith('drafts.')) {
      draftCodesById.set(document._id, new Set(codes))
      continue
    }

    if (document._id.startsWith('versions.') || document._id.startsWith('_.')) {
      continue
    }

    for (const code of codes) {
      publishedIdByCode.set(code, document._id)
    }
  }

  return { draftCodesById, publishedIdByCode }
}

/** Reads a legacy string code or every value of a localizedCode object. */
function subjectCodes(record: Record<string, unknown>) {
  return [...codeValues(record.code), ...codeValues(record.localizedCode)]
}

function codeValues(value: unknown): Array<string> {
  if (typeof value === 'string') return value ? [value] : []
  if (typeof value !== 'object' || value === null) return []

  return Object.values(value).filter(
    (entry): entry is string => typeof entry === 'string' && entry.length > 0
  )
}

const normalizeCode = (code: string) => code.trim().toUpperCase()

const subjectCodeKey = (seed: SeedSubject) => {
  const code = seed.code?.en ?? seed.code?.mk
  return code ? normalizeCode(code) : undefined
}
