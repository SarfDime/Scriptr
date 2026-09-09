import type { PersonSummary } from '../components/Person.types'
import type { PortableTextType } from '../components/PortableText.types'
import type { AddressableContactInfo, MinimalEntity } from './academics.types'
import type { MinimalFaculty } from './faculty.types'

export type MinimalUniversity = MinimalEntity & {
  rector?: PersonSummary
  viceRectors?: Array<PersonSummary>
  faculties?: Array<MinimalFaculty>
}

export type UniversityGalleryData = Array<MinimalUniversity>

export type UniversityDetail = MinimalUniversity &
  AddressableContactInfo & {
    _type: 'university'
    description?: PortableTextType
  }
