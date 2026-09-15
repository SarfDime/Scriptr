import type {
  MinimalProfessorTypedQueryResult,
  ProfessorDetailQueryResult,
} from '@shared/types/sanity.types'
import type { WithResolvedSanityData } from '@shared/types/sanity-transform.types'

type MinimalProfessor = NonNullable<
  WithResolvedSanityData<MinimalProfessorTypedQueryResult>
>

type ProfessorDetail = NonNullable<
  WithResolvedSanityData<ProfessorDetailQueryResult>
>

type ProfessorsSectionProps = {
  professors: Array<MinimalProfessor>
}

export type { MinimalProfessor, ProfessorDetail, ProfessorsSectionProps }
