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
    <Box className='grid-auto-fit gap-3 [--grid-min:22rem]'>
      {scripts.map((script) => (
        <ScriptCard
          key={script.id}
          script={script}
          className='ui-above-inside'
        />
      ))}
    </Box>
  ) : (
    <Text className='ui-above-inside ui-subtitle rounded-xl border border-dashed border-grey-300 px-6 py-14 text-center'>
      {emptyMessage}
    </Text>
  )
