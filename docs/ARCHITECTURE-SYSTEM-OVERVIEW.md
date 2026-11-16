# System Overview

* **Hierarchy:** `University → Faculty → Study → Subject`, read-only for users. A study is
  the tenant: its own site at `/study/[siteSlug]`, its own media bucket, its own admin and
  moderator roles. Identities, usernames, restrictions and platform announcements stay
  org-wide.
* **Sanity** owns academic metadata: bios, descriptions, syllabus, `year`, `semester`,
  and `elective` (subjects only — no fixed semester, badged in the UI).
* **Supabase** owns identities, relationships, user content (scripts, comments, votes,
  ratings, flags), notifications and achievements (platform-wide or per study), and
  runtime script data (`exam_session`, `exam_year`, `additional_reading`, files). A
  script carries its study; its files live in that study's bucket.
* **Junctions:** `profile_faculties`, `profile_studies`, `profile_subjects`,
  `professor_faculties`, `professor_studies`, `subject_professors`.
* **Reads merge** DB identities and relationships with Sanity metadata.
* **Workspaces:** pnpm 12 with an isolated linker and one root lockfile; each app declares
  its own dependencies plus `@scriptr/shared`. Vercel installs only the target app, its
  workspace dependencies and root tooling.
* **Types:** Sanity TypeGen writes into `shared/types/`, so all three consumers read one
  copy. Academic entity types derive from a query's result through
  `WithResolvedSanityData<…>` (`shared/types/sanity-transform.types.ts`), which resolves
  `defined()`-guarded pictures, non-nullable Portable Text fields and the
  `media: unknown` block. `hono/src/sanity-stub.d.ts` lets `hono/` import them without
  `@sanity/client`.
* **Access control** is Postgres RLS; which client each route uses is in
  [`API_DOCUMENTATION.md`](../hono/src/routes/API_DOCUMENTATION.md#client-access-patterns).
* **API surface** under `/api`: `auth`, `universities`, `faculties`, `studies`,
  `professors`, `subjects`, `file-ops`, `scripts`, `votes`, `comments`, `flags`,
  `favorites`, `profiles`, `profile-subjects`, `profile-studies`, `profile-faculties`,
  `notifications`, `ratings`, `restrictions`, `internal`.
