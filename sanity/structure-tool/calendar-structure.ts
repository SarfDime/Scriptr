import CalendarIcon from '@sanity/icons/Calendar'
import { CALENDAR_EVENT_TYPES } from '@shared/config/calendar'
import { CALENDAR_STRINGS } from '@shared/strings/calendar-strings'
import type { StructureToolTypes } from '../types/common.types'
import { createColoredIcon } from './icon-helpers'

const EVENT_TYPE = 'calendarEvent'
/** Events are listed newest first everywhere. */
const LATEST_FIRST = [{ field: 'date', direction: 'desc' as const }]

/**
 * Calendar section: the single calendar document, then the event lists sliced by
 * date and by type, so an editor never has to scroll a year of events to find
 * the ones that matter.
 */
export const buildCalendarStructure = (build: StructureToolTypes['Build']) =>
  build
    .list()
    .title('Calendar')
    .items([
      build
        .listItem()
        .icon(createColoredIcon(CalendarIcon, 'content'))
        .title('Calendars')
        .child(
          build
            .documentTypeList('calendar')
            .title('Calendars')
            // Period ids sort chronologically (`2026-h1`, `2026-h2`, …).
            .defaultOrdering([{ field: 'period', direction: 'desc' }])
        ),

      build.divider().title('Events by date'),

      build
        .listItem()
        .title('All events')
        .child(
          build
            .documentTypeList(EVENT_TYPE)
            .title('All calendar events')
            .defaultOrdering(LATEST_FIRST)
        ),
      build
        .listItem()
        .title('Upcoming')
        .child(
          build
            .documentTypeList(EVENT_TYPE)
            .title('Upcoming events')
            .filter(`_type == "${EVENT_TYPE}" && date >= now()`)
            .defaultOrdering(LATEST_FIRST)
        ),
      build
        .listItem()
        .title('Past')
        .child(
          build
            .documentTypeList(EVENT_TYPE)
            .title('Past events')
            .filter(`_type == "${EVENT_TYPE}" && date < now()`)
            .defaultOrdering(LATEST_FIRST)
        ),
      build
        .listItem()
        .title('Upcoming exams')
        .child(
          build
            .documentTypeList(EVENT_TYPE)
            .title('Upcoming exams')
            .filter(
              `_type == "${EVENT_TYPE}" && date >= now() && type in ["exam", "preliminary_exam"]`
            )
            .defaultOrdering(LATEST_FIRST)
        ),

      build.divider().title('Events by type'),

      ...CALENDAR_EVENT_TYPES.map((eventType) =>
        build
          .listItem()
          .title(CALENDAR_STRINGS.eventType[eventType])
          .child(
            build
              .documentTypeList(EVENT_TYPE)
              .title(`${CALENDAR_STRINGS.eventType[eventType]} events`)
              .filter(`_type == "${EVENT_TYPE}" && type == $eventType`)
              .params({ eventType })
              .defaultOrdering(LATEST_FIRST)
          )
      ),
    ])
