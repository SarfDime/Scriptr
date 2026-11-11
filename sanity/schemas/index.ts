// Academic entities (linked to Postgres via dbId)
import { Faculty } from './academic/faculty'
import { Professor } from './academic/professor'
import { Study } from './academic/study'
import { Subject } from './academic/subject'
import { University } from './academic/university'
// Localized primitives
import {
  LocalizedRichText,
  LocalizedRichTextLite,
  LocalizedString,
  LocalizedStringArray,
} from './common/localeFields'
// Misc
import { Button } from './misc/button'
import { Calendar } from './misc/calendar'
import { CalendarEvent } from './misc/calendar-event'
import { ChristmasCanvas } from './misc/christmas-canvas'
import { Person } from './misc/person'
import { StarCanvas } from './misc/star-canvas'
import { StudyTip } from './misc/study-tip'
import { NavItem } from './navigation/nav-item'
import { NavMenu } from './navigation/nav-menu'
import { SubMenuItem } from './navigation/subMenuItem'
import { RichText, RichTextLite } from './portable-text/portableText'
// Website
import { Website } from './website'

export const schemaTypes = [
  NavMenu,
  NavItem,
  SubMenuItem,
  Person,
  Website,
  Button,
  RichText,
  RichTextLite,
  LocalizedString,
  LocalizedRichText,
  LocalizedRichTextLite,
  LocalizedStringArray,
  University,
  Faculty,
  Professor,
  Subject,
  Study,
  StarCanvas,
  ChristmasCanvas,
  StudyTip,
  CalendarEvent,
  Calendar,
]
