# Calendar

* **Sanity-only content.** A `calendarEvent` (`sanity/schemas/misc/calendar-event.ts`) has
  no `dbId`, no Create/Sync action and no database row. Fields:
  `stringTitle`, `date`, `type` (`exam | preliminary_exam | reminder | info | announcement`),
  `importance` (`low | normal | high`), optional `stringSubtitle`, optional `subject` and
  `professors`. Exams and preliminary exams require the subject, and the professor picker
  offers only that subject's assigned professors.
* **Calendars are half-years.** A `calendar` carries one `period` (1 Jan–30 Jun or 1
  Jul–31 Dec, from the six-month periods offered from 2026 on) and one `events` array. The
  picker offers only events inside that period that are not already listed, and validation
  rejects anything outside it — so nothing drifts with time. Several calendars may share a
  period, but `website.calendars` refuses two with the same one.
* **One source for the lists.** `shared/config/calendar.ts` holds the type and importance
  lists, `WEEK_STARTS_ON` (Monday), `CALENDAR_TIME_ZONE` (`Europe/Skopje`) and the per-type
  `cp-*` palettes; labels come from `shared/strings/calendar-strings.ts`. Importance never
  changes a hue — it adds a ring (`high`) or a dot (above `low`).
* **Time zone.** Days are bucketed in `CALENDAR_TIME_ZONE`, never the server's:
  `calendarDayKey` reads `formatToParts` of an `Intl.DateTimeFormat` pinned to that zone.
  Grid days use date-only UTC arithmetic (`dayKeyToUtc`/`shiftDayKey`), so a DST change
  cannot drop or repeat a day. The page states the zone under the grid.
* **`/calendar`** is a thin Server Component over `loadCalendarPage`
  (`next/lib/calendar-page.ts`). The view is in the URL — `?view=month|week&date=YYYY-MM-DD`
  — so prev/next/today, the view switch and opening a day are plain `Link`s. In week view
  `date` sits on the **third** of seven days (`WEEK_VIEW_ANCHOR_OFFSET`), so a day opened
  from the grid never lands on an edge. Bad or repeated parameters fall back to the current
  month. It reads `searchParams`, so it must never carry `force-static`.
* **One read per build.** `calendarEventsQuery` collects the ids every attached calendar
  references and returns those events narrowed to six months either side of the build
  (`calendarMarginWindow`) — one cached Sanity read (`loadCalendarEvents`) shared by
  `/calendar` and the header alert. The page filters in memory, so navigating costs no
  Sanity traffic. Each event projects its subject (name, `dbId`, path slugs) and professors,
  using the same `coalesce(slug.current, _id)` fallback as `subjectPathQuery`.
* **Outside the year, the page says so.** `CalendarDataNotice` names the covered range when
  the visible period reaches past the events, and an empty calendar document gets its own
  message. No extra read, no error.
* **Routable links only.** A subject or professor is linked when it has a `dbId` (the same
  filter the static-params queries apply) and plain text otherwise; paths use
  `getAcademicPath`.
* **Layout.** Month view is a grid of week rows from `md` up and an agenda list below it. A
  cell shows up to three plain-label chips plus a count; a cell **with events** is a link to
  that day's week view (an overlay, so chips stay labels), where events are read in full. An
  empty cell is not a link. Week view lists the week's days, each with its events as `Card`s
  in a wrapping `ui-card-grid`; an empty day collapses to one line. `Today` is disabled when
  the visible period already contains it. Empty, loading and error states are the page's own
  (`app/calendar/loading.tsx`, `app/calendar/error.tsx`, `CalendarEmptyState`).
* **Notes are local-first, and belong to a study.** A note carries the `studies.id` of the
  calendar it was written on, because the calendar is per study: the same day holds
  different notes in two studies, and the three-per-day cap (`CALENDAR_NOTES_PER_DAY`) is
  per study-day. The page's study comes from `CalendarStudyProvider`; a study with no
  database row (`dbId` null) shows no note controls, since there is no key to store one
  under. Typed `note | exam | preliminary_exam | exam_result` on the palettes the event
  types leave free (yellow, rose, blue, green), so a note is never mistaken for an event.
  Notes live in `localStorage` (`next/lib/calendar-notes-storage.ts`, one list per profile,
  snapshotted for `useSyncExternalStore`) and reach the profile through the two syncs
  below, which stay profile-wide; the editor dialog and Preferences both say so. A note is
  a chip in its day, the editor is a dialog reached from the day's control, and a deletion
  is a tombstone.
* **Automatic push, once a week per profile.** `CalendarNotesProvider` sends the notes changed
  since the last sync (`notesChangedSince`) on login and after an edit, but only when the
  browser copy's `calendarNotesDigest` differs from the digest stored for the copy the profile
  held last (`readCalendarNotesDigest`) — so a pull, or a reload after one, leaves nothing to
  send. It also skips while `localStorage` holds an instant the API said was still in the
  future. Both copies only spare requests; the API is the rule. The week is a row in
  `profile_calendar_notes_syncs`, claimed by `claim_calendar_notes_auto_sync` **after** the
  write, so another browser or serverless instance cannot spend it twice and a failed write
  does not burn it. Silent: Preferences shows the result as "last synced".
* **The on-demand sync stays.** Preferences offers "sync to" (push of notes changed since the
  last sync) and "sync from" (pull), both behind a confirmation; a pull warns first when the
  local copy holds notes the profile lacks or a different version (`notesDifferFrom`,
  `countNotesLostByPull`), because it replaces the local copy. The API keeps the last-edited
  copy, so a stale push cannot roll an edit back. Allowance: 3 syncs per half hour and 12 per
  day per profile, both directions and automatic pushes alike; a restricted account cannot
  push.
* **Two islands, one store.** `CalendarNotesProvider` mounts inside `SessionProvider`: it
  adopts signed-out notes into the profile namespace on sign-in, pulls the profile's copy
  **once per login per browser** (`hasFetchedCalendarNotes`), and runs the weekly automatic
  push. The client leaves are `CalendarMonthDayCell`, `CalendarNoteDayControl`,
  `CalendarNotesTimeline` and the Preferences section.
* **Every day is reachable.** Month view renders its grid even with no events, because an
  empty day is where a note gets written: the add button appears on hover on an **empty**
  day, and a day with events links to its week, where its notes are edited. Week view lists
  all seven days with add buttons, and the small-screen agenda falls back to the period's own
  days when nothing is scheduled.
* **Header alert, build-time data.** `Header` renders the `CalendarAlert` island beside its
  date label. Events come from `getCalendarAlertEvents`, which reads
  `calendarAlertEventsQuery` with no upper bound and a lower bound of "UTC midnight of the
  build day minus 24 hours", projecting neither description nor professors. Cached like
  every Sanity read, and a failure renders no alert.
* **Header alert, client matching.** `CalendarAlert` keeps events whose day key is today or
  within `CALENDAR_ALERT_WINDOW_DAYS`, then keeps an event with no subject and `high`
  importance, or whose `subjectDbId` is one of the reader's uncompleted subjects. The study
  layout passes its own subject list (a small Sanity read) and the client drops the ones the
  session marks `completed`. While the session loads, and for a guest, only the global branch
  applies. The badge and preview stay hidden until mounted, so server and first client render
  match.
* **Preview and dismissal.** The desktop preview shows the soonest matching event plus a
  count, as "Exam in 2 days: Subject" or the event's own title for a global one. Dismissals
  live only in `localStorage` (`scriptr:calendar-dismissed`,
  `{ [eventId]: eventDateISO }`, `next/lib/calendar-dismissals.ts`): dismissing records every
  currently matching event with its own date, so a new event shows again while the badge
  keeps its count. Dismissals need no study key: an event document belongs to one study and
  the alert only receives the study whose frame renders it. Expired entries are pruned on first subscribe and on every dismiss;
  unreadable storage reads as "nothing dismissed".
* **Freshness.** A new or edited event appears on the next rebuild, in `/calendar` and the
  header alert alike, because every Sanity read is cached until then. The planned Studio
  rebuild action ([`PROGRESS.md`](PROGRESS.md)) makes a publish trigger one sooner; expiring
  the tag instead is deliberately not planned. Dismissals are per browser, with no table and
  no route.
