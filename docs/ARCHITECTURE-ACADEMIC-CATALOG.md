# Academic Catalog

* **Entities:** University, Faculty, Study, Subject, Professor, each with a Sanity mini-schema for shared fields.
* **Routing:** the catalog tree ends at the faculty, and everything below it belongs to the study's own site:
  - `/university/[universitySlug]`
  - `.../faculty/[facultySlug]`
  - `/study/[siteSlug]` — a study's home (its own handle, not its slug inside the catalog): the academic overview
  - `…/scripts` — the same study's content surface (the feed), the parent of `…/scripts/[scriptSlug]`
  - `…/calendar`, `…/academic-setup`, `…/user/[username]`
  - `/study/[siteSlug]/subject/[subjectSlug]`

  Slugs only need to be unique among siblings; the path disambiguates. A study's `siteSlug` is globally unique because it is the first segment of its own site. The old nested `/university/…/faculty/…/study/[studySlug]` and its subject sibling are gone: every synced study has a handle, the Studio requires one, and the redirectors were removed once nothing minted those URLs. **Professors stay flat at `/professor/[professorSlug]`** since they belong to many faculties, studies, and subjects. Each level's GROQ query filters on its ancestor chain.
* **Sanity ↔ DB sync (tested, working):**
  1. Author the entity in Sanity (edits allowed before a DB row exists).
  2. **"Create in Database"** creates the Supabase row and writes the DB id back to the Sanity document. **"Sync with Database"** pushes later edits.
  3. Publishing is blocked until the DB id exists. Deletion is blocked by the admin API's dependency check (`409`).
  4. `parentFieldFor`/`parentColumnFor` and the academic endpoint map (`getDatabaseAcademicEndpoints`) are exhaustive over entity types, with no silent defaults.
* **Access model:** every catalog route (reads and writes, junctions included) requires a twenty-minute admin token in `x-admin-token`. RLS on these tables is read-only for every role including admin; `/api/sanity/*` (service-role client) is the only write path. The token is issued by `POST /api/sanity/access`, which verifies a TOTP code against `ADMIN_TOTP_SECRET` — the Studio carries no secret of its own, because its bundle is public, and needs only `SANITY_STUDIO_API_URL`. Codes are single-use and accepted for ±30 seconds; tokens cannot be revoked before they expire.
* **Shape note:** subjects relate to faculties only through studies (`subjects.study_id → studies.faculty_id`).
