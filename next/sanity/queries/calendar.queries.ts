import { groq } from 'next-sanity'

/** Shared projection for a calendar event. `title`/`description` are aliases of
 * the schema's `stringTitle`/`stringSubtitle` (see `headerSchemaFields`), and
 * the subject/professor slugs use the same `coalesce(slug.current, _id)`
 * fallback as `subjectPathQuery`, so a projected path is exactly the one the
 * route resolves. */
const calendarEventProjection = /* groq */ `
  _id,
  "title": stringTitle,
  "description": stringSubtitle,
  date,
  type,
  importance,
  "subject": subject->{
    _id,
    dbId,
    name,
    "slug": coalesce(slug.current, _id),
    "studySlug": coalesce(study->slug.current, study->_id),
    "facultySlug": coalesce(study->faculty->slug.current, study->faculty->_id),
    "universitySlug": coalesce(study->faculty->university->slug.current, study->faculty->university->_id)
  },
  "professors": professors[]->{
    _id,
    dbId,
    name,
    "slug": coalesce(slug.current, _id)
  }
`

/**
 * Every event of every calendar attached to the website, in one read: the ids
 * the attached calendars reference, narrowed to the year around the build
 * (`$from`/`$to` are six months either side). Both `/calendar` and the header
 * alert work from this, so neither queries per date.
 *
 * The membership test is `_id in …calendars[]->events[]._ref` rather than
 * dereferencing each calendar's array inline — a dereference of an array of
 * arrays resolves to `null` in GROQ.
 */
export const calendarEventsQuery = groq`
*[_type == "calendarEvent"
  && _id in *[_id == $WEBSITE][0].calendars[]->events[]._ref
  && dateTime(date) >= dateTime($from)
  && dateTime(date) <= dateTime($to)
] | order(date asc, _id asc) {
  ${calendarEventProjection}
}
`
