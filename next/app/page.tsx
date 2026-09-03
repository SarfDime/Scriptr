import { Box } from '../components/common/Box'
import { Button } from '../components/common/Button'
import { PortableTextContent } from '../components/typography/PortableTextContent'
import { Text } from '../components/typography/Text'
import { Title } from '../components/typography/Title'
import { Badge } from '../components/ui/Badge'
import { Card } from '../components/ui/Card'
import { Divider } from '../components/ui/Divider'
import { ThemeToggle } from '../components/ui/ThemeToggle'
import type { PortableTextType } from '../types/components/PortableText.types'

const portableExample = [
  {
    _key: 'intro',
    _type: 'block',
    children: [
      {
        _key: 'intro-span',
        _type: 'span',
        marks: [],
        text: 'Portable Text gets the same rhythm, links, lists, and readable color tokens as the rest of the app.',
      },
    ],
    markDefs: [],
    style: 'normal',
  },
  {
    _key: 'list',
    _type: 'block',
    children: [
      {
        _key: 'list-span',
        _type: 'span',
        marks: [],
        text: 'Sanity content can arrive here without page-specific styling.',
      },
    ],
    level: 1,
    listItem: 'bullet',
    markDefs: [],
    style: 'normal',
  },
] as PortableTextType

export default function Home() {
  return (
    <Box as='main' className='ui-section min-h-screen'>
      <Box className='ui-container ui-stack gap-12'>
        <Box className='ui-cluster justify-between'>
          <Box className='ui-stack gap-3'>
            <Badge colorPalette='brand'>UI foundations</Badge>
            <Title
              as='h1'
              title='Components that stay out of the way.'
              className='font-semibold text-4xl text-fg-700 tracking-tight md:text-6xl'
            />
            <Text className='max-w-2xl text-fg text-lg leading-8'>
              A small, composable surface for Scriptr pages, with sensible
              defaults and theme-aware content from Sanity.
            </Text>
          </Box>
          <ThemeToggle />
        </Box>

        <Divider />

        <Box as='section' className='ui-stack' aria-labelledby='surfaces-title'>
          <Box className='ui-stack gap-2'>
            <Badge colorPalette='gray' variant='outline'>
              Surfaces
            </Badge>
            <Title
              className='text-fg-700 text-2xl font-semibold'
              as='h2'
              title='Cards compose from familiar parts.'
              id='surfaces-title'
            />
          </Box>
          <Box className='grid gap-6 md:grid-cols-3'>
            <Card>
              <Card.Header>
                <Badge colorPalette='brand'>Default</Badge>
              </Card.Header>
              <Card.Body>
                <Text>Neutral surfaces are the everyday starting point.</Text>
              </Card.Body>
              <Card.Footer>Card.Footer</Card.Footer>
            </Card>
            <Card className='ui-palette-success'>
              <Card.Header>
                <Badge colorPalette='green'>Success</Badge>
              </Card.Header>
              <Card.Body>
                <Text>
                  Palette classes change the surface, border, and text.
                </Text>
              </Card.Body>
              <Card.Footer>ui-palette-success</Card.Footer>
            </Card>
            <Card className='ui-palette-warning'>
              <Card.Header>
                <Badge colorPalette='yellow'>Attention</Badge>
              </Card.Header>
              <Card.Body>
                <Text>
                  Children inherit the same radius language as the card.
                </Text>
              </Card.Body>
              <Card.Footer>ui-palette-warning</Card.Footer>
            </Card>
          </Box>
        </Box>

        <Card className='ui-stack' aria-labelledby='content-title'>
          <Box className='ui-cluster justify-between'>
            <Box className='ui-stack gap-2'>
              <Badge colorPalette='brand' variant='outline'>
                Content
              </Badge>
              <Title
                className='text-fg-700 text-2xl font-semibold'
                as='h2'
                title='Portable Text, already styled.'
                id='content-title'
              />
            </Box>
            <Button className='solid' type='button'>
              Continue
            </Button>
          </Box>
          <Divider />
          <PortableTextContent
            portableText={portableExample}
            renderWrapper
            className='ui-prose'
          />
        </Card>

        <Card className='ui-palette-brand' aria-labelledby='actions-title'>
          <Card.Header>
            <Title
              className='text-fg-700 text-2xl font-semibold'
              as='h2'
              title='Use the defaults, then tune locally.'
              id='actions-title'
            />
          </Card.Header>
          <Card.Body className='ui-stack gap-4'>
            <Text>
              Add a component class first. Add Tailwind utilities only for
              layout decisions that are specific to this page.
            </Text>
            <code className='rounded-lg bg-background-100/70 px-3 py-2 text-fg-700 text-sm'>
              {'<Card className="ui-palette-brand">'}
            </code>
          </Card.Body>
        </Card>
      </Box>
    </Box>
  )
}
