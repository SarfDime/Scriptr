# Calendar

* **Sanity-only content.** A `calendarEvent` document (`sanity/schemas/misc/calendar-event.ts`)
  is a study-tip sibling: no `dbId`, no Create/Sync action, no database row. It
  carries `stringTitle`, `date` (datetime), `type`
  (`exam | preliminary_exam | reminder | info | announcement`), `importance`
  (`low | normal | high`, default `normal`), an optional `stringSubtitle`
  description, an optional `subject` reference and an optional `professors`
  array, grouped into Event / Schedule / Subject & professors fieldsets. Exams
  and preliminary exams require the subject; the professor picker is read-only
  until one is chosen and then offers only that subject's assigned professors.
* **Calendars are half-years.** A `calendar`
  (`sanity/schemas/misc/calendar.ts`) carries one `period` — always 1 January to
  30 June or 1 July to 31 December, chosen from the six-month periods the picker
  offers from 2026 onwards — and one `events` array. The picker only offers
  events dated inside that period and never one already listed; the field is
  read-only until a period is chosen, and the validation rejects anything outside
  the period. Because the period is fixed on the document, nothing drifts with
  time. Several calendars may share a period, but `website.calendars` refuses
  two with the same period. The Studio's calendar section lists the calendars
  (by period) and the events by date (all / upcoming / past / upcoming exams) and
  by type, newest first.
* **One source for the lists.** `shared/config/calendar.ts` holds the type and
  importance lists, `WEEK_STARTS_ON` (Monday), `CALENDAR_TIME_ZONE`
  (`Europe/Skopje`) and the per-type `cp-*` palettes. The Studio's pickers and
  the UI both read it; labels come from `shared/strings/calendar-strings.ts`.
  Every type has its own palette, and importance never changes a hue — it only
  adds a ring (`high`) or a dot (above `low`).
* **Time zone.** Days are bucketed in `CALENDAR_TIME_ZONE`, never in the
  server's zone: `calendarDayKey` reads `formatToParts` of a
  `Intl.DateTimeFormat` pinned to that zone. Grid days are produced with
  date-only UTC arithmetic (`dayKeyToUtc` / `shiftDayKey`), so a DST change
  cannot drop or repeat a day. The page states the zone under the grid.
* **`/calendar`** is a thin Server Component (`app/calendar/page.tsx`) over
  `loadCalendarPage` (`next/lib/calendar-page.ts`). The view is in the URL —
  `?view=month|week&date=YYYY-MM-DD` — so prev/next/today, the view switch and
  opening a day are plain `Link`s and nothing is client state. In week view
  `date` sits on the **third** of the seven days (`WEEK_VIEW_ANCHOR_OFFSET`), so
  a day opened from the month grid never lands on an edge. Bad or repeated
  parameters fall back to the current month. The page reads `searchParams` and
  therefore must never carry `force-static`.
* **One read per build, no per-date queries.** `calendarEventsQuery` collects the
  event ids every attached calendar references (`website.calendars[]->events[]`)
  and returns those events, narrowed to the six months either side of the build
  (`calendarMarginWindow`) — one cached Sanity read (`loadCalendarEvents`,
  `next/lib/calendar-data.ts`) that `/calendar` and the header alert share. The
  page then filters that list in memory for whatever period the URL asks for, so
  navigating to any date costs no Sanity traffic.
  Each event is projected with its subject (name, `dbId`, path slugs) and
  professors (name, `dbId`, slug), using the same `coalesce(slug.current, _id)`
  fallback as `subjectPathQuery`.
* **Outside the year, the page says so.** The document covers twelve months, so
  the URL can still point anywhere; when the visible period reaches past the
  events the calendar actually holds, `CalendarDataNotice` names the covered
  range instead of showing a silently empty grid, and an empty calendar document
  gets its own message. That notice is the only thing that changes — no extra
  read, no error.
* **Routable links only.** A subject or professor page exists only for a synced
  document, so an entity is linked when it has a `dbId` — the same filter
  `subjectStaticParamsQuery`/`professorStaticParamsQuery` apply — and rendered as
  plain text otherwise. Paths are built with `getAcademicPath`.
* **Layout.** Month view is a grid of week rows from `md` up and an agenda list
  of the period's days below it. A cell shows up to three chips as plain labels
  (a chip does not navigate) and a count for the rest; a cell **with events** is
  a link to the week view for that day — an overlay, so the chips stay labels —
  and that is where the events are read in full, with their subject and
  professor links. A day with nothing on it is not a link. Week view is the
  week's days in order, each with its events as `Card`s in a wrapping
  `ui-card-grid`; a day with nothing on it collapses to one line rather than an
  empty card. `Today` is a disabled button when the period on screen already
  contains today. The empty, loading and error states are the page's
  own: `app/calendar/loading.tsx`, `app/calendar/error.tsx` and
  `CalendarEmptyState`.
* **Personal notes are local-first.** A reader can write up to three notes on a
  day (`CALENDAR_NOTES_PER_DAY`), typed `note | exam | preliminary_exam |
  exam_result`. The types take the palettes the event types leave free (yellow,
  rose, blue, green), so a note is never mistaken for an event. Notes live in
  `localStorage` (`next/lib/calendar-notes-storage.ts`, namespaced per profile,
  snapshotted for `useSyncExternalStore`), and the page says so under the grid.
  A note is a chip in its day; the editor is a dialog, reached from the day's
  control, and a deletion is a tombstone so it can travel.
* **Two islands, one store.** `CalendarNotesProvider`
  (`next/providers/calendar-notes/`) is mounted inside `SessionProvider`; it
  adopts signed-out notes into the profile's namespace on sign-in and pulls the
  profile's copy **once per login per browser** (`hasFetchedCalendarNotes`) —
  never per page load, matching how restrictions are read. `CalendarMonthDayCell`,
  `CalendarNoteDayControl`, `CalendarNotesTimeline` and the Preferences section
  are the client leaves.
* **Syncing is explicit and rare.** Preferences offers "sync to" (a push of the
  notes changed since the last sync, `notesChangedSince`) and "sync from" (a
  pull), both behind a confirmation; a pull warns first when the local copy
  holds notes the profile does not, or a different version of them
  (`notesDifferFrom`, `countNotesLostByPull`), because pulling replaces it. The
  API keeps whichever copy was edited last, so a stale push cannot roll an edit
  back. The allowance is 3 syncs per half hour and 12 per day per profile,
  counted for both directions, and a restricted account cannot push — the same
  rules the table's policies apply. A weekly automatic push — only when the
  local copy changed, and rate limited per profile — is planned
  (`PROGRESS.md`).
* **Every day is reachable.** Month view renders its grid even when the period
  has no events (the empty state becomes a line above it), because an empty day
  is where a note gets written. In the grid, the add button appears on hover on
  an **empty** day; a day with events links to its week, which is where its
  notes are edited. Week view lists all seven days with their add buttons, and
  the small-screen month agenda falls back to the period's own days when nothing
  is scheduled, so mobile can still write one.
* **Header alert, build-time data.** `Header` is async and renders the
  `CalendarAlert` client island beside its own date/week label (not in the
  account actions). The island's events come from `getCalendarAlertEvents`
  (`next/lib/calendar-alert.ts`),
  which reads `calendarAlertEventsQuery` with no upper bound and only a lower
  bound of "UTC midnight of the build day minus 24 hours", projecting neither
  the description nor professors. The read is cached like every Sanity read, so
  this is build-time data; a Sanity failure is contained and renders no alert,
  exactly as `getDailyStudyTip` does.
* **Header alert, client matching.** `CalendarAlert` keeps events whose day key
  is today or within `CALENDAR_ALERT_WINDOW_DAYS`, then keeps an event when it
  has no subject and is `high` importance, or when its `subjectDbId` is one of
  the reader's uncompleted subjects. Those are derived, not stored: every
  subject of the reader's selected studies that isn't `completed`, computed by
  `deriveIncompleteSubjectDbIds` (`next/lib/study-subjects.ts`) — the pure half
  of the server-only `getIncompleteSubjectIdsForStudies` — from the session and
  the onboarding catalog the client already holds. While the session loads (and
  for a signed-out visitor) only the global branch applies. The badge and the
  preview are hidden until mounted, so the server render and the first client
  render are identical.
* **Preview and dismissal.** The desktop preview shows the soonest matching
  event plus a count of the others, in one of two shapes: "Exam in 2 days:
  Subject" or the event's own title for a global one. Dismissals live in
  `localStorage` only (`scriptr:calendar-dismissed`, `{ [eventId]: eventDateISO }`,
  `next/lib/calendar-dismissals.ts`): dismissing records every currently
  matching event with its own date, so a new event shows the preview again,
  while the badge keeps its count. Expired entries are pruned on first subscribe
  and on every dismiss; corrupt or unavailable storage reads as "nothing
  dismissed".
* **Freshness.** A new or edited event appears on the next rebuild — both on
  `/calendar` and in the header alert — because every Sanity read is cached
  until then. That is the intended mechanism; the planned Studio rebuild action
  (`PROGRESS.md`) exists to make a publish trigger one sooner, and expiring the
  cache tag instead is deliberately not planned. Dismissals are deliberately
  per browser and never leave it: no table and no route exist for them.
