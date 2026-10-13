'use client'

import { PT_STRINGS } from '@shared/config/pt-strings'
import {
  COLOR_DECORATORS,
  DEFAULT_DECORATOR_NAMES,
  WEIGHT_DECORATORS,
} from '@shared/config/shared-pt-config'
import { Box } from '@/components/common/Box'
import { PTAlignmentDropdown } from './PTAlignmentDropdown'
import { ClearFormattingButton } from './PTClearFormattingButton'
import { DecoratorDropdown } from './PTDecoratorDropdown'
import { COLOR_ICON, FORMAT_ICON, WEIGHT_ICON } from './PTicons'
import { PTListDropdown } from './PTListDropdown'
import { PTStyleDropdown } from './PTStyleDropdown'
import type { PortableTextEditorOptions } from './schema'

/** Toolbar for PT Editor
 * @see https://www.portabletext.org/editor/guides/customize-toolbar/
 */
export const Toolbar = ({
  excludedStyles = [],
  excludedColors = [],
  showStyles = true,
  showLists = true,
  showAlignment = true,
}: PortableTextEditorOptions) => (
  <Box className='ui-cluster gap-1'>
    <ClearFormattingButton />

    {showStyles && <PTStyleDropdown excludedStyles={excludedStyles} />}
    {showLists && <PTListDropdown />}

    <DecoratorDropdown
      label={PT_STRINGS.toolbar.format.label}
      title={PT_STRINGS.toolbar.format.title}
      names={DEFAULT_DECORATOR_NAMES}
      fallbackIcon={FORMAT_ICON}
    />
    <DecoratorDropdown
      label={PT_STRINGS.toolbar.color.label}
      title={PT_STRINGS.toolbar.color.title}
      names={COLOR_DECORATORS.filter(
        (color) => !excludedColors.includes(color.name)
      ).map((color) => color.name)}
      fallbackIcon={COLOR_ICON}
    />
    <DecoratorDropdown
      label={PT_STRINGS.toolbar.weight.label}
      title={PT_STRINGS.toolbar.weight.title}
      names={WEIGHT_DECORATORS.map((d) => d.name)}
      fallbackIcon={WEIGHT_ICON}
    />
    {showAlignment && <PTAlignmentDropdown />}
  </Box>
)
