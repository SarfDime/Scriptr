import type { FC } from 'react'

interface SubjectDynamicIconProps {
  dbId?: string
  year?: number
  semester?: number
  elective?: boolean
}

const YEAR_COLORS: Record<number, string> = {
  1: '#0284C7', // Sky Blue
  2: '#0D9488', // Teal
  3: '#D97706', // Amber
  4: '#7C3AED', // Purple
  5: '#DB2777', // Pink
  6: '#DC2626', // Red
  7: '#2563EB', // Royal Blue
  8: '#059669', // Emerald
}

const SEMESTER_COLORS: Record<number, string> = {
  1: '#2563EB', // Blue
  2: '#059669', // Emerald
  3: '#7C3AED', // Violet
  4: '#EA580C', // Orange
  5: '#0891B2', // Cyan
  6: '#E11D48', // Rose
  7: '#4F46E5', // Indigo
  8: '#D97706', // Amber
  9: '#9333EA', // Purple
  10: '#0D9488', // Teal
}

export const SubjectDynamicIcon: FC<SubjectDynamicIconProps> = ({
  dbId,
  year,
  semester,
  elective,
}) => {
  const isLinked = Boolean(dbId)
  const yearColor = year ? (YEAR_COLORS[year] ?? '#6B7280') : '#4B5563'
  const semesterColor = semester
    ? (SEMESTER_COLORS[semester] ?? '#374151')
    : '#374151'
  const dbBorderColor = isLinked ? '#10B981' : '#EF4444'

  return (
    <svg
      width='33'
      height='33'
      viewBox='0 0 33 33'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      style={{
        display: 'block',
        borderRadius: '4px',
        width: '100%',
        height: '100%',
      }}
      data-sanity-icon
    >
      <title>{`Subject Icon - ${dbId ? `DB: ${dbId}` : 'Not Linked'}${elective ? ' (Elective)' : ''}`}</title>

      {/* Background Container */}
      <rect
        x='1'
        y='1'
        width='31'
        height='31'
        rx='3'
        fill='#111827'
        stroke={dbBorderColor}
        strokeWidth='2'
        strokeDasharray={isLinked ? 'none' : '3 2'}
      />
      {/* Year Tag (Left Side - Vertical Stack) */}
      <rect x='3.5' y='3.5' width='12' height='26' rx='2' fill={yearColor} />
      <text
        x='9.5'
        y='23.5'
        fill='#FFFFFF'
        fontSize='9.5'
        fontWeight='800'
        textAnchor='middle'
        fontFamily='sans-serif'
      >
        {year ?? '-'}
      </text>

      {/* Semester Tag (Right Side - Vertical Stack with Dynamic Color) */}
      {semester !== undefined && (
        <>
          <rect
            x='17.5'
            y='14.5'
            width='12'
            height='15'
            rx='2'
            fill={semesterColor}
          />
          <text
            x='23.5'
            y='27'
            fill='#FFFFFF'
            fontSize='7'
            fontWeight='800'
            textAnchor='middle'
            fontFamily='sans-serif'
          >
            {semester}
          </text>
        </>
      )}

      {/* Elective Badge (Top Right Indicator) */}
      {elective && (
        <rect x='20.5' y='3.5' width='9' height='9' rx='2' fill='#F59E0B' />
      )}
    </svg>
  )
}
