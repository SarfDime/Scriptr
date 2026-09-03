import { Button, Flex } from '@sanity/ui'
import { ToolLink, type ToolMenuProps } from 'sanity'
import { CompactModeToggle } from './CompactModeToggle'

/**
 * Component that displays the custom tool menu in the navbar
 */
export function CustomToolMenu(props: ToolMenuProps) {
  const { activeToolName, context, tools } = props
  const isSidebar = context === 'sidebar'

  // Change flex direction depending on context
  const direction = isSidebar ? 'column' : 'row'

  return (
    <Flex gap={1} direction={direction} align='center'>
      <CompactModeToggle />
      {tools.map((tool) => (
        <Button
          as={ToolLink}
          key={tool.name}
          name={tool.name}
          padding={3}
          selected={tool.name === activeToolName}
          text={tool.title || tool.name}
          className={`custom-button ${tool.name === activeToolName && 'custom-button_active'}`}
        >
          {/* It asks for children but no need> */}
          {null}
        </Button>
      ))}
    </Flex>
  )
}
