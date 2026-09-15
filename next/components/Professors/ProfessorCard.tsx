import { EntityCard } from '@/components/common/EntityCard'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { ClickableCard } from '@/components/ui/Card'
import { getAcademicPath } from '@/lib/academic-routes'
import { getColorPalette } from '@/lib/color-pallette-gen'
import type { MinimalProfessor } from '@/types/academics/professor.types'

export const ProfessorCard = ({
  _id,
  slug,
  name,
  title,
  subjects,
  faculties,
  picture,
  universities,
}: MinimalProfessor) => {
  const color = getColorPalette({ type: 'seed', value: _id })

  return (
    <EntityCard
      href={getAcademicPath({ type: 'professor', professorSlug: slug ?? _id })}
      title={name}
      media={<Avatar picture={picture} name={name} color={color} />}
      subtitle={title}
      caption={faculties?.map((faculty) => faculty.name).join(', ')}
      secondaryCaption={universities?.map((univ) => univ.name).join(', ')}
      className='group p-4 h-full flex flex-col justify-between gap-3 transition hover:border-brand-500 hover:shadow-sm'
      footer={
        subjects &&
        subjects.length > 0 && (
          <ClickableCard.Footer className='ui-cluster gap-1.5 pt-2 border-t border-grey-100/60'>
            {subjects.map((subject) => (
              <Badge
                key={subject._id}
                className='cp-unstyled border border-grey-200 ui-caption'
              >
                {subject.name}
              </Badge>
            ))}
          </ClickableCard.Footer>
        )
      }
    />
  )
}
