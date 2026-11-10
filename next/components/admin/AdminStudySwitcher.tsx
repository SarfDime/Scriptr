'use client'

import { ADMIN_STRINGS } from '@shared/strings/admin-strings'
import type { AdminStudyOption } from '@shared/types/admin.types'
import { useRouter } from 'next/navigation'
import { selectAdminStudy } from '@/app/(app)/admin/_actions/select-study'
import { Box } from '@/components/common/Box'
import { Text } from '@/components/typography/Text'
import { Select } from '@/components/ui/select/Select'
import { ADMIN_STUDY_ALL } from '@/lib/admin-study'

/**
 * The master switch for the admin surface: every admin page acts on the study
 * chosen here. It is a cookie rather than a route segment so the choice follows
 * the operator between sections without rewriting every link.
 *
 * Owners also get "All studies"; everyone else only sees the studies they hold
 * a role on, and the API refuses the rest regardless of what this sends.
 */
export const AdminStudySwitcher = ({
  studies,
  selected,
}: {
  studies: Array<AdminStudyOption>
  selected: string | null
}) => {
  const router = useRouter()

  const isOwner = studies.some((study) => study.role === 'owner')
  const currentId =
    selected ??
    (studies.length === 1
      ? (studies[0]?.id ?? ADMIN_STUDY_ALL)
      : ADMIN_STUDY_ALL)

  const options = [
    ...(isOwner
      ? [
          {
            id: ADMIN_STUDY_ALL,
            value: ADMIN_STUDY_ALL,
            label: ADMIN_STRINGS.studySwitcherAll,
          },
        ]
      : []),
    ...studies.map((study) => ({
      id: study.id,
      value: study.id,
      label: `${study.name} · ${study.facultyName}`,
    })),
  ]

  const select = async (value: string) => {
    await selectAdminStudy(value)
    router.refresh()
  }

  return (
    <Box className='ui-cluster items-center gap-2'>
      <Text className='ui-caption'>{ADMIN_STRINGS.studySwitcherLabel}</Text>
      <Select
        options={options}
        defaultOption={options.find((option) => option.value === currentId)}
        setSelectedValue={select}
        triggerProps={{ 'aria-label': ADMIN_STRINGS.studySwitcherAria }}
      />
    </Box>
  )
}
