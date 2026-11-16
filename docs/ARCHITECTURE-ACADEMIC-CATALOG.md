# Academic Catalog

* **Entities:** University, Faculty, Study, Subject, Professor, each with a Sanity
  mini-schema for its shared fields. Subjects reach faculties only through studies
  (`subjects.study_id → studies.faculty_id`).
* **Routing:** the catalog tree ends at the faculty; everything below belongs to a study's
  own site.
  - `/university/[universitySlug]`, `.../faculty/[facultySlug]`
  - `/study/[siteSlug]` — a study's home, using its handle rather than a catalog slug
  - `…/scripts` (the feed, parent of `…/scripts/[scriptSlug]`), `…/calendar`,
    `…/academic-setup`, `…/user/[username]`, `/study/[siteSlug]/subject/[subjectSlug]`
  - `/professor/[professorSlug]` stays flat: professors belong to many faculties, studies
    and subjects.

  A study is **its own site** at `<siteSlug>.<NEXT_PUBLIC_SITE_URL host>` (`lbe.scriptr.uk`);
  `/study/[siteSlug]/…` is the rewrite target the host maps onto and the catalog path
  `308`s to the study's host. Links, canonicals and each study's sitemap use the host; the
  catalog lists only the levels above it. One deployment serves both
  ([`ARCHITECTURE-STUDY-DOMAINS.md`](ARCHITECTURE-STUDY-DOMAINS.md)).
* **Slugs** are unique among siblings; the path disambiguates. A study's `siteSlug` is
  globally unique because it starts its own site. Every synced study has a handle, the
  Studio requires one, and the old nested study URLs are gone. Each level's GROQ query
  filters on its ancestor chain.
* **Sanity ↔ DB sync:** author in Sanity (edits allowed before a DB row exists) →
  **Create in Database** creates the row and writes its id back as `dbId`, **Sync with
  Database** pushes later edits → publishing is blocked until `dbId` exists, and deletion
  is blocked by the admin API's dependency check (`409`). `parentFieldFor`/`parentColumnFor`
  and `getDatabaseAcademicEndpoints` are exhaustive over entity types, with no silent
  defaults.
* **Access:** every catalog route, reads and junctions included, needs a twenty-minute admin
  token in `x-admin-token`. RLS is read-only for every role, admin included, so
  `/api/sanity/*` (service-role client) is the only write path. `POST /api/sanity/access`
  issues the token after verifying a TOTP code against `ADMIN_TOTP_SECRET`; codes are
  single-use and accepted ±30 s, and a token cannot be revoked before it expires. The
  Studio carries no secret — its bundle is public — only `SANITY_STUDIO_API_URL`.
