export type AcademicDetailPageProps<
  TParams extends Record<string, string> = { slug: string },
> = {
  params: Promise<TParams>
}

export type UniversityRouteParams = { universitySlug: string }
export type FacultyRouteParams = UniversityRouteParams & { facultySlug: string }
export type StudyRouteParams = FacultyRouteParams & { studySlug: string }
export type SubjectRouteParams = StudyRouteParams & { subjectSlug: string }
export type ProfessorRouteParams = { professorSlug: string }

export type MinimalEntity = {
  _id: string
  name: string
  dbId?: string
  slug?: string
}

// Extracted shared contact properties
export type ContactInfo = {
  telephone?: string
  email?: string
  website?: string
}

// Extracted relation type used inside SubjectDetail and ProfessorDetail
export type RelatedFaculty = MinimalEntity & {
  university?: MinimalEntity
}

// Extracted relation type used inside SubjectDetail and ProfessorDetail
export type RelatedStudy = MinimalEntity & {
  faculty?: RelatedFaculty
}
