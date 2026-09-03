import type { PortableTextPluginsProps } from 'sanity'
import { ClearFormattingPlugin } from './clear-formatting'
import { ClearOtherDecorators } from './clear-other-decorators'

/**
 * Custom plugins for Portable Text.
 */
export const PortableTextPlugins = {
  plugins: (props: PortableTextPluginsProps) => (
    <>
      {props.renderDefault(props)}
      <ClearFormattingPlugin />
      <ClearOtherDecorators />
    </>
  ),
}
