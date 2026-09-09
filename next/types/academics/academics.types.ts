// academics.types.ts
export type AcademicDetailPageProps = {
  params: Promise<{ slug: string }>
}

export type MinimalEntity = {
  _id: string
  name: string
  dbId?: string
}

// Extracted shared contact properties
export type ContactInfo = {
  telephone?: string
  email?: string
  website?: string
}

// Shared property for entities that also have a street address
export type AddressableContactInfo = ContactInfo & {
  streetAddress?: string
}

// Extracted relation type used inside SubjectDetail and ProfessorDetail
export type RelatedFaculty = MinimalEntity & {
  university?: MinimalEntity
}
