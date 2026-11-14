import { CALENDAR_STRINGS_PACK } from '../strings/calendar-strings'
import { COMMENT_STRINGS_PACK } from '../strings/comments-strings'
import { NOTIFICATIONS_STRINGS_PACK } from '../strings/notifications-strings'
import { PREFERENCES_STRINGS_PACK } from '../strings/preferences-strings'
import { SCRIPT_STRINGS_PACK } from '../strings/scripts-strings'
import { TIME_AGO_STRINGS_PACK } from '../strings/time-strings'
import type { StringPath } from '../types/localization.types'
import { UI_STRINGS_PACK } from './strings'

/**
 * Every string collection by name, for the places that address one by name
 * rather than importing it — `useCopy(path, { pack })` takes an id, and the
 * path types below are derived from this index.
 *
 * Each collection stays in its own file; this is only the index. Add a domain
 * here when it gets a `_PACK` export.
 */
export const STRING_PACKS = {
  ui: UI_STRINGS_PACK,
  calendar: CALENDAR_STRINGS_PACK,
  comments: COMMENT_STRINGS_PACK,
  notifications: NOTIFICATIONS_STRINGS_PACK,
  preferences: PREFERENCES_STRINGS_PACK,
  scripts: SCRIPT_STRINGS_PACK,
  timeAgo: TIME_AGO_STRINGS_PACK,
} as const

export type StringPackId = keyof typeof STRING_PACKS

/** Every dot path into one collection — the type of `useCopy`'s `path` and of a
 * key→path table. Names a path a module-level constant can be annotated with,
 * which a bare string could not be. */
export type StringPackPath<P extends StringPackId> = StringPath<
  (typeof STRING_PACKS)[P]
>

export type UIPath = StringPackPath<'ui'>
export type CalendarPath = StringPackPath<'calendar'>
export type CommentPath = StringPackPath<'comments'>
export type TimeAgoPath = StringPackPath<'timeAgo'>
