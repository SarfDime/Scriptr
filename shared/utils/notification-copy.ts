import { getAchievementCopy, hasAchievementCopy } from '../config/achievements'
import type { LocaleId } from '../config/localization-constants'
import { NOTIFICATIONS_STRINGS_PACK } from '../strings/notifications-strings'
import { getStrings } from './localized-strings'

/**
 * The stored half of a `notifications` row: what the API wrote at the moment
 * the event happened, plus the `type` and `data` the row carries anyway.
 *
 * `data` is untyped on purpose. It comes back from the database as `Json`, and
 * a row written by an older build — or by hand — may hold something other than
 * the shape this module expects, so every field is checked before it is used.
 */
export type StoredNotificationRow = {
  type: string
  title: string
  body: string | null
  data: unknown
}

/** A notification's text, ready to render. */
export type StoredNotificationCopy = {
  title: string
  body?: string
}

const readRecord = (data: unknown): Record<string, unknown> =>
  typeof data === 'object' && data !== null && !Array.isArray(data)
    ? (data as Record<string, unknown>)
    : {}

const readString = (data: Record<string, unknown>, key: string) => {
  const value = data[key]
  return typeof value === 'string' ? value : null
}

const readCount = (data: Record<string, unknown>) => {
  const value = data.count
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

const isContentKind = (value: string | null): value is 'script' | 'comment' =>
  value === 'script' || value === 'comment'

/** What the API stored, for a row this module cannot rebuild. */
const storedCopy = (row: StoredNotificationRow): StoredNotificationCopy => ({
  title: row.title,
  ...(row.body === null ? {} : { body: row.body }),
})

/**
 * A stored notification's title and body in `locale`.
 *
 * The API freezes the sentence into the row in the default language, because at
 * that moment there is no reader. By the time the tray shows it there is one, and
 * the row already carries everything the sentence is made of: `type` names the
 * sentence and `data` holds its arguments. Rebuilding it here is what makes an
 * old notification follow the reader's language instead of the language it
 * happened to be written in.
 *
 * A row this module cannot rebuild keeps its stored text: an announcement (an
 * admin's own words, with nothing to rebuild from), an achievement the catalogue
 * has no wording for, and any row missing an argument. That also covers every
 * row written before the copy was localized.
 */
export const resolveStoredNotificationCopy = (
  row: StoredNotificationRow,
  locale: LocaleId
): StoredNotificationCopy => {
  const stored = storedCopy(row)
  const strings = getStrings(NOTIFICATIONS_STRINGS_PACK.row, locale)
  const data = readRecord(row.data)

  switch (row.type) {
    case 'achievement_earned': {
      const id = readString(data, 'achievement_id')
      // The badge title and its description are code copy, so both languages
      // exist; an achievement created through the admin screen only has the
      // wording saved on its row, which is not on this notification.
      if (id === null || !hasAchievementCopy(id)) return stored
      const copy = getAchievementCopy(id, null, locale)
      return {
        title: strings.achievementTitle(copy.title),
        ...(copy.description === null ? {} : { body: copy.description }),
      }
    }
    case 'restriction_applied': {
      const reason = readString(data, 'reason')
      if (reason === null) return stored
      return {
        title: strings.restrictionAppliedTitle,
        body: strings.restrictionAppliedBody(
          reason,
          readString(data, 'expires_at')
        ),
      }
    }
    case 'restriction_lifted':
      return {
        title: strings.restrictionLiftedTitle,
        body: strings.restrictionLiftedBody,
      }
    case 'content_removed': {
      const kind = readString(data, 'target_kind')
      const title = readString(data, 'title')
      // The quoted title is the user's own text, so it reads the same in every
      // language; only the sentence around it is translated.
      if (!isContentKind(kind) || title === null) return stored
      return {
        title: strings.contentRemovedTitle(title),
        body: strings.contentRemovedBody(kind),
      }
    }
    case 'flag_threshold': {
      const count = readCount(data)
      const target = readString(data, 'target_type')
      if (count === null || target === null) return stored
      return {
        title: strings.flagThresholdTitle,
        body: strings.flagThresholdBody(count, target),
      }
    }
    default:
      return stored
  }
}
