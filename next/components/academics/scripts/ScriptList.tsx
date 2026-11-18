import { Box } from '@/components/common/Box'
import { Text } from '@/components/typography/Text'
import type { ScriptDetail } from '@/types/components/Scripts.types'
import { ScriptCard } from './ScriptCard'

type ScriptListProps = {
  scripts: Array<ScriptDetail>
  emptyMessage: string
}

/** Renders script cards in an auto-fit grid, or `emptyMessage` when there are none. */
export const ScriptList = ({ scripts, emptyMessage }: ScriptListProps) =>
  scripts.length > 0 ? (
    <Box className='ui-card-grid [--grid-min:22rem] max-h-135 overflow-y-auto'>
      {scripts.map((script) => (
        <ScriptCard
          key={script.id}
          script={script}
          className='content-auto [--content-auto-size:11rem]'
        />
      ))}
    </Box>
  ) : (
    <Text className='ui-above-inside ui-subtitle border-dashed px-6 py-14 text-center'>
      {emptyMessage}
    </Text>
  )
