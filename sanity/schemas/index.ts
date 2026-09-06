// Academic entities (linked to Postgres via dbId)
import { Faculty } from './academic/faculty'
import { Professor } from './academic/professor'
import { Subject } from './academic/subject'
import { University } from './academic/university'
import { Button } from './misc/button'
import { Person } from './misc/person'
import { NavigationItem } from './navigation/navigationItem'
import { SubMenuItem } from './navigation/subMenuItem'
import { Page } from './pages/page'
import { RichText, RichTextLite } from './portable-text/portableText'
// Sections
import { FooterSection } from './section/footer-section'
import { InfoBlockSection } from './section/info-hub/info-block-section'
import { InfoHubSection } from './section/info-hub/info-hub-section'
import { InfoBlock } from './section/info-hub/infoBlock'
import { MarkdownSection } from './section/markdown-section'
import { NavigationMenu } from './section/nav-menu-section'
// Website
import { Website } from './website'

export const schemaTypes = [
  NavigationMenu,
  NavigationItem,
  SubMenuItem,
  FooterSection,
  Person,
  Page,
  MarkdownSection,
  Website,
  InfoBlock,
  InfoBlockSection,
  Button,
  InfoHubSection,
  RichText,
  RichTextLite,
  University,
  Faculty,
  Professor,
  Subject,
]
