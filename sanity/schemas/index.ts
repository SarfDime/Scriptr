// Academic entities (linked to Postgres via dbId)
import { Faculty } from './academic/faculty'
import { Professor } from './academic/professor'
import { Study } from './academic/study'
import { Subject } from './academic/subject'
import { University } from './academic/university'
import { Button } from './misc/button'
import { Person } from './misc/person'
// Misc
import { StarCanvas } from './misc/star-canvas'
import { NavItem } from './navigation/nav-item'
import { NavMenu } from './navigation/nav-menu'
import { SubMenuItem } from './navigation/subMenuItem'
import { Page } from './pages/page'
import { RichText, RichTextLite } from './portable-text/portableText'
// Sections
import { FooterSection } from './section/footer-section'
import { InfoBlockSection } from './section/info-hub/info-block-section'
import { InfoHubSection } from './section/info-hub/info-hub-section'
import { InfoBlock } from './section/info-hub/infoBlock'
import { MarkdownSection } from './section/markdown-section'
// Website
import { Website } from './website'

export const schemaTypes = [
  NavMenu,
  NavItem,
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
  Study,
  StarCanvas,
]
