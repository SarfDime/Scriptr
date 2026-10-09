# API Endpoints Documentation

REST API reference for Scriptr. All paths are relative to `/api`
(`http://localhost:8787/api` in local dev). Response shapes are typed in
`shared/types/` (see [Notes](#notes)).

## Table of Contents
- [Catalog](#catalog)
- [Universities](#universities)
- [Faculties](#faculties)
- [Professors](#professors)
- [Studies](#studies)
- [Subjects](#subjects)
- [Internal Lookups](#internal-lookups)
- [File Uploads](#file-uploads)
- [Scripts](#scripts)
  - [Public](#public)
  - [Authenticated](#authenticated)
- [Comments](#comments)
  - [Public](#public-1)
  - [Authenticated](#authenticated-1)
- [Flags](#flags)
- [Restrictions](#restrictions)
- [Profiles](#profiles)
  - [Public](#public-2)
  - [Authenticated](#authenticated-2)
  - [Admin](#admin)
  - [Internal](#internal)
- [Profile Selections](#profile-selections)
- [Favorites](#favorites)
- [Votes](#votes)
- [Ratings](#ratings)
- [Notifications](#notifications)
  - [Achievements](#achievements)
- [Client Access Patterns](#client-access-patterns)
- [Authentication](#authentication)
- [Role-Based Access Control](#role-based-access-control)
- [Error Responses](#error-responses)
- [Notes](#notes)
- [Planned Endpoints (Not Yet Implemented)](#planned-endpoints-not-yet-implemented)

---

## Catalog

Academic catalog data (universities, faculties, studies, professors, subjects)
is admin-managed and closed to end users. **Every route below, reads
included, requires the `x-internal-secret` header** matching
`INTERNAL_API_SECRET` — this is independent of Supabase Auth roles, since RLS
on these tables (and their junctions: `subject_professors`,
`professor_faculties`, `professor_studies`) is read-only for every role,
admin included. See [Client Access Patterns](#client-access-patterns).

| Route                   | Response                                                                                          |
| ----------------------- | ------------------------------------------------------------------------------------------------- |
| `GET /universities`     | Universities with faculties (includes `r2_bucket_id`)                                             |
| `GET /universities/:id` | One university with faculties (includes `r2_bucket_id`)                                           |
| `GET /faculties`        | Faculties, each with `university`, `studies` (nested `subjects` for the count), `professor_count` |
| `GET /faculties/:id`    | One faculty with `studies` (each with its `subjects`) and assigned `professors`                   |
| `GET /professors`       | Professors with subjects, studies, faculties                                                      |
| `GET /professors/:id`   | One professor with subjects, studies, faculties                                                   |
| `GET /subjects`         | Subjects with study, faculty, professors, script counts                                           |
| `GET /subjects/:id`     | One subject with study, faculty, professors, scripts                                              |

Note on shape: subjects relate to faculties only *through* studies
(`subjects.study_id → studies.faculty_id`) — there is no direct
`subjects.faculty_id`. Faculty responses nest subjects under `studies`
accordingly; don't expect a flat `faculty.subjects` array.

Catalog **mutations** live under `/api/internal` (below), same header — see
[Universities](#universities) for university-specific mutations, and the
sections below for the rest. These are the endpoints the Sanity Studio
"Create in Database" / "Sync with Database" / checked-delete actions call
(tested end to end).
`profile_subjects`/`profile_faculties`/`profile_studies` are not catalog data
— they're a user's own selections and stay on the normal authenticated API.

---

## Universities

Internal-only, `x-internal-secret` required for all routes (reads and writes).

**Reads**: `GET /universities`, `GET /universities/:id` (see [Catalog](#catalog)).

**Mutations** (`/api/internal`):

| Route                                  | Body                                                 |
| -------------------------------------- | ---------------------------------------------------- |
| `POST /internal/universities`          | `{ name, sanity_id?, r2_bucket_id? }` — returns the existing row (`existing: true`) if the Sanity document is already linked |
| `PATCH /internal/universities/:id`     | `{ name?, r2_bucket_id? }`             |
| `DELETE /internal/universities/:id`    | — (blocked if any faculties still reference it)      |
| `POST /internal/universities/:id/sync` | `{ name, r2_bucket_id? }` — full re-sync from Sanity (`404` if the database row doesn't exist) |

`r2_bucket_id` is the Cloudflare R2 bucket used for this university's file
storage — must match `^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$` (S3/R2 bucket naming
rules), enforced at both the API and a Postgres `CHECK` constraint, and
unique across universities. Nullable — a university without one falls back
to the default `R2_BUCKET` env var at upload time (see
[File Uploads](#file-uploads) below). Delete is blocked at the application
level by an explicit dependents check against `faculties` (`409`),
independent of the underlying FK's `ON DELETE CASCADE` — the FK itself would
not stop a raw SQL delete from cascading through the whole hierarchy; only
this route does.

---

## Faculties

Internal-only, `x-internal-secret` required for all routes (reads and writes).

**Reads**: `GET /faculties`, `GET /faculties/:id` (see [Catalog](#catalog)).

**Mutations** (`/api/internal`):

| Route                               | Body                                                                                                                           |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `POST /internal/faculties`          | `{ name, university_id, sanity_id? }` — returns the existing row (`existing: true`) if the Sanity document is already linked |
| `PATCH /internal/faculties/:id`     | `{ name?, university_id? }`                                                                                                    |
| `DELETE /internal/faculties/:id`    | — (`409` if referenced by studies, professor assignments, or user faculty selections)                                        |
| `POST /internal/faculties/:id/sync` | `{ name, university_id }` — `404` if the database row doesn't exist                                                           |

---

## Professors

Internal-only, `x-internal-secret` required for all routes (reads and writes).

**Reads**: `GET /professors`, `GET /professors/:id` (see [Catalog](#catalog)).

**Mutations** (`/api/internal`):

| Route                                                         | Body                                                                            |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `POST /internal/professors`                                   | `{ name, faculty_ids?, study_ids?, sanity_id? }`                                |
| `PATCH /internal/professors/:id`                              | `{ name? }`                                                                     |
| `DELETE /internal/professors/:id`                             | — (blocked if referenced by subjects, faculties, studies, scripts, or comments) |
| `POST`/`DELETE /internal/professors/:id/faculties/:facultyId` | —                                                                               |
| `POST`/`DELETE /internal/professors/:id/studies/:studyId`     | —                                                                               |
| `GET /internal/professors/by-sanity/:sanityId`                | Looks up the DB row linked to a Sanity document                                 |
| `POST /internal/professors/:id/sync`                          | `{ name, faculty_ids?, study_ids? }` — full re-sync from Sanity                 |

`professors` only has `id`, `name`, `sanity_id`, `created_at` in Postgres —
bio/picture and other rich metadata live in Sanity, not here.

---

## Studies

Internal-only, `x-internal-secret` required for all routes. Reads live at
plain `/studies` (matching every other catalog entity); only mutations live
under `/internal`.

**Reads**: `GET /studies`, `GET /studies/:id` (see [Catalog](#catalog) pattern
— faculty/university metadata, subjects, professor assignments).

**Mutations** (`/api/internal`):

| Route                             | Body                                                                              |
| --------------------------------- | --------------------------------------------------------------------------------- |
| `POST /internal/studies`          | `{ name, faculty_id, sanity_id? }`                                                |
| `PATCH /internal/studies/:id`     | `{ name?, faculty_id? }`                                                          |
| `DELETE /internal/studies/:id`    | — (blocked if referenced by subjects, professor assignments, or user enrollments) |
| `POST /internal/studies/:id/sync` | `{ name, faculty_id }`                                                            |

---

## Subjects

Internal-only, `x-internal-secret` required for all routes. Does not apply to
`/api/profile-subjects`, which is a user's own progress, not catalog data.

**Reads**: `GET /subjects`, `GET /subjects/:id` (see [Catalog](#catalog)).

**Mutations** (`/api/internal`):

| Route                                                          | Body                                                                                  |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `POST /internal/subjects`                                      | `{ name, study_id, professor_ids?, sanity_id? }`                                      |
| `PATCH /internal/subjects/:id`                                 | `{ name?, study_id? }`                                                                |
| `DELETE /internal/subjects/:id`                                | — (blocked if referenced by professor assignments, user subject statuses, or scripts) |
| `POST`/`DELETE /internal/subjects/:id/professors/:professorId` | —                                                                                     |
| `POST /internal/subjects/:id/sync`                             | `{ name, study_id, professor_ids? }`                                                  |

---

## Internal Lookups

Read-only helpers under `/api/internal` (`x-internal-secret`, service-role client).

| Route                                                                            | Response                                                                              |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `GET /internal/{universities,faculties,studies,professors,subjects}`             | Plain rows, no embeds                                                                 |
| `GET /internal/{universities,faculties,professors,subjects}/by-sanity/:sanityId` | The row linked to a Sanity document, or `404` ("Not linked to a database record yet") |
| `GET /internal/comments`                                                         | All comments with author (`username`, `full_name`) and professor name, newest first   |

---

## File Uploads

| Route                      | Notes                                                                                                                                                                                                                                                                                                     |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST /file-ops/upload`    | Authenticated. Multipart form: one or more `files` entries (a single file is accepted too — normalized to an array server-side) plus optional `subjectId`. Returns `{ success: true, files: [{ fileKey, fileType, fileSizeBytes, bucket }] }` — one entry per uploaded file, in the same order submitted. |
| `GET /file-ops/get-file/*` | Public. Returns `{ url, key }`: a pre-signed download URL (valid for 1 hour) for a key recorded in `script_files`; the endpoint resolves its bucket from that row and ignores any `?bucket=` query param. |

**Storage scoping**: if `subjectId` is provided and resolves to a real
subject → study → faculty → university chain, the file is stored in that
university's `r2_bucket_id` bucket (falling back to the default `R2_BUCKET`
if the university has none set), under a key prefixed
`{facultyId}/{studyId}/{subjectId}/{userId}/` — all Postgres dbIds, not
slugs. If `subjectId` is omitted or doesn't resolve, the file falls back to
the default bucket under a plain `{userId}/` prefix. Per-file size limit
(~1MB) and the allowed-extension list are enforced via a `zValidator` form
schema, not a Postgres constraint.

`script_files.bucket` persists which bucket each file actually landed in —
required at download time, since a bare file key no longer implies a single
global bucket once buckets are university-scoped. It's included in every
public script response's `files` array (see [Scripts](#scripts)).

`GET /file-ops/get-file/*` has no auth so guests can preview and download
scripts, but it signs only keys recorded in `script_files` and derives their
bucket server-side. Deleted scripts remove their associated R2 objects.

---

## Scripts

### Public

| Route                             | Notes                                                                                                                                                                                                       |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /scripts`                    | All scripts; scoped to the session's selected faculties if a cookie is present                                                                                                                              |
| `GET /scripts/:id`                | One script; 404 if outside the session's selected faculties                                                                                                                                                 |
| `GET /scripts/subject/:subjectId` | Scripts for a subject, sorted by vote score                                                                                                                                                                 |
| `GET /scripts/top?limit=10`       | By vote score                                                                                                                                                                                               |
| `GET /scripts/popular?limit=10`   | By download count                                                                                                                                                                                           |
| `GET /scripts/search?q=`          | Fuzzy match on title/description (Portable Text → plain text)                                                                                                                                               |
| `POST /scripts/:id/download`      | Records a download, deduped by account → IP → `x-device-id` header. Runs on service-role — `download_events` has no client-facing INSERT policy for any role. Returns `{ success: true, counted: boolean }` |

Response excludes `is_flagged` (internal moderation state). Each file in
`files` includes `bucket` (see [File Uploads](#file-uploads)).
Script summary responses include `comments: [{ count }]`, counting all
comments and replies. Comment-list responses include `totalCount` for
top-level threads (used for root pagination) and `totalCommentCount` for all
comments, including replies.

### Authenticated

| Route                      | Notes                                                                                                                                                                                                                                                                                                                                                                                                                               |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST /scripts`            | Body: `{ title, description?, subjectId, professorId, examSession?, additionalReading?, files?: [{ fileKey, fileType, fileSizeBytes, bucket }] }` — `files`, when present, is exactly what `POST /file-ops/upload` returns, passed straight through; omit it or send an empty array to create a script without files. `title`/`description` are Portable Text, restricted to supported text blocks, spans, styles, decorators, lists, and alignments; title must contain text and fit within 2 KiB, description within 50 KiB. Validated via a `zValidator` JSON schema (accepts both `subjectId`/`subject_id` etc. key styles). Rejected if restricted. Returns `403` for RLS authorization failures, `409` for missing subject/professor references, and `400` for invalid Portable Text or database constraint violations. |
| `GET /scripts/my-scripts`  | Current user's scripts                                                                                                                                                                                                                                                                                                                                                                                                              |
| `PATCH /scripts/:id`       | Author or admin. Body: `{ title?, description?, additional_reading? }`. Updated Portable Text uses the same allow-list and byte limits as `POST /scripts`; files are immutable — not part of this body. Invalid Portable Text returns `400`.                                                                                                                                                                                                |
| `DELETE /scripts/:id`      | Author or admin. Removes the script's database records and attempts to delete all associated R2 objects.                                                                                                                                                                                                                                                                                                                            |
| `DELETE /scripts/:scriptId/files/:fileId` | Author or admin. Removes a single `script_files` row and attempts to delete that R2 object while leaving the script intact. `404` if the file doesn't belong to that script. |
| `GET /scripts/flagged/all` | Admin only                                                                                                                                                                                                                                                                                                                                                                                                                          |

---

## Comments

### Public
`GET /comments/script/:scriptId`, `/comments/professor/:professorId`,
`/comments/user/:userId`, `/comments/:commentId/reactions`,
`/comments/:commentId/replies` — no auth
required; list routes include `reactions_count`, `reactions_by_type`,
`likes_count`, `my_reactions`, `liked_by_me` when a session is present.
The three comment-list routes return only top-level comments and accept
`limit` (1–2, default 2), `offset` (default 0), and `sort` (`newest` by
default, or `top`). `top` ranks root comments by combined heart likes and
emoji reactions. Responses are `{ items, hasMore, totalCount, totalCommentCount }`; each root
includes up to five chronological immediate replies and `replies_has_more`.
`totalCount` counts top-level threads for pagination; `totalCommentCount`
counts every comment matching the target, including replies.
`GET /comments/:commentId/replies` returns `{ items, hasMore, totalCount }`
for one chronological reply page (`limit` 1–10, default 10, and `offset`
default 0). Replies with nested replies expose `has_replies`, allowing the UI
to fetch each deeper level on demand. Reaction and like counts in comment
responses include all users' engagement; the API aggregates those rows
server-side and only returns counts and the current viewer's own status.
The frontend retains fetched root and reply pages while the comment section
is mounted, and requests additional pages only when a user expands them.
Rate-limit buckets are currently process-local; deployments with multiple API
instances enforce the limits independently on each instance.

### Authenticated

| Route                                 | Notes                                                                                                       |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `POST /comments`                      | `{ content: PortableTextValue, professor_id? \| script_id? }` — exactly one target. Supports allow-listed inline decorators on normal text blocks only; rejects custom blocks, annotations, headings, lists, and text alignment. Requires at least 3 non-whitespace characters and is limited to 10 KiB serialized JSON. Max 10 comments per 15 minutes per account. Rejected if restricted. |
| `POST /comments/:commentId/replies`   | `{ content }`; target is copied from the parent and enforced by a database trigger. Same content validation and 10-per-15-minute per-account limit as top-level comments. |
| `POST /comments/:commentId/reactions` | `{ reaction_type: 'like'\|'hate'\|'funny'\|'sad'\|'confused' }` — toggles that type independently, so one user may add multiple reaction types. Authors cannot like or react to their own comments. Combined with likes, max 15 toggles per minute per account. Rejected if restricted. |
| `POST /comments/:commentId/like`      | Toggle. Authors cannot like or react to their own comments. Shares the 15-per-minute engagement limit with reactions. Rejected if restricted. |
| `PATCH /comments/:id`                 | Author or admin. `{ content }`; same allow-list, 3-character minimum, and 10 KiB limit as comment creation. `404` if missing. |
| `DELETE /comments/:id`                | Author or admin. `404` if missing. Returns the updated `totalCommentCount` for the script/professor target, including replies deleted by cascade. |
| `GET /comments/flagged/all`           | Admin only; internal service-role query after the route verifies the admin session, because `is_flagged` is not selectable by public roles. |

Comment and reply list responses are bounded to one page. Database
errors map unique/FK conflicts to `409`, permission errors to `403`, custom
Postgres exceptions to `400`, and other failures to a generic `500` response;
raw Postgres details are logged server-side only.

---

## Flags

Single `flags` table for scripts, users, and comments
(`target_script_id`/`target_user_id`/`target_comment_id`, exactly one set).

| Route                                                   | Access                                                                                                                                         |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST /flags`                                           | Any authenticated, non-restricted user. `{ target_type: 'user'\|'script'\|'comment', target_id, reason (≥10 chars) }`. Authors cannot report their own scripts or comments (`403`); each reporter can have only one pending flag per target (`400` for a duplicate). |
| `GET /flags/my-flags`                                   | Reporter, own flags only                                                                                                                       |
| `DELETE /flags/:id`                                     | Reporter (own flag) **or** admin (any flag). Not restriction-checked.                                                                          |
| `GET /flags`, `/flags/pending`, `/flags/status/:status` | Admin only — RLS grants admins direct `SELECT`                                                                                                 |
| `PATCH /flags/:id`                                      | Admin only. `{ status: 'pending'\|'reviewed'\|'dismissed' }`. Dismissing clears `is_flagged` on the target once no other pending flag remains. |

Reporters can create, view their own, and delete their own flag — that's the
complete self-service surface. They cannot change a flag's `status`; only an
admin can resolve one. Moderators have no flag access at all (see
[Role-Based Access Control](#role-based-access-control)).

---

## Restrictions

Admin-managed. `profile_restrictions` has `profile_id` as its primary key —
one row per restricted user; its presence *is* the restriction. Enforced
elsewhere via `is_restricted()` in RLS (blocks creating/updating scripts,
comments, flags, comment reactions, votes, ratings — see
[Role-Based Access Control](#role-based-access-control)); this section is
just the admin CRUD surface.

| Route                             | Access                                                                                                                                              |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /restrictions`               | Admin only. All active restrictions.                                                                                                                |
| `GET /restrictions/me`            | Any authenticated user. Own restriction status, or `null`.                                                                                          |
| `GET /restrictions/:profileId`    | Owner or admin (RLS-enforced) — a non-admin querying someone else's status silently gets `null`, indistinguishable from unrestricted.               |
| `PUT /restrictions/:profileId`    | Admin only. `{ reason (3–500 chars) }` — upsert; restricting an already-restricted user updates the reason and `restricted_by` instead of erroring. |
| `DELETE /restrictions/:profileId` | Admin only. Lifts the restriction. `404` if the user wasn't restricted.                                                                             |

---

## Profiles

### Public
`GET /profiles`, `/profiles/username/:username`, `/profiles/:id`,
`/profiles/:id/stats` — no auth required. The Next frontend caches public
profile and stats responses; profile, selection, favorite, script, vote, and
download mutations revalidate those tags. A public profile response includes
both authored scripts and favorite scripts; direct `/favorites` endpoints
remain authenticated and owner-scoped.
Each script's `comments` field is an array containing one `{ count }` item;
the count includes root comments and replies and is read through the
`get_script_comment_counts` RPC rather than a direct comments-table embed.
Missing profiles return `404`; profile database failures return a generic
`500` response rather than exposing database details.

### Authenticated
`GET /profiles/me`, `PATCH /profiles/me` (`{ username?, full_name?,
selected_faculty_ids?, selected_study_ids? }`), `DELETE /profiles/me`.

### Admin
`PATCH /profiles/:id`, `DELETE /profiles/:id` — same shape as the `/me`
equivalents, session-client-eligible (`is_admin()` is baked into the
`profiles` RLS policy directly).

### Internal
`PATCH /internal/profiles/:id/role` — `{ role: 'student'|'moderator'|'admin' }`,
`x-internal-secret` required. Kept off the session-client path as extra
hardening for a sensitive column, even though `is_admin()` RLS would
technically allow it too.

---

## Profile Selections

Three structurally identical resources for a user's own faculty, study, and
subject data. All require authentication and operate on the caller only.
These are what first-visit onboarding persists to once the user has an account.

| Resource  | List                     | Get one                             | Add                                             | Remove                                 |
| --------- | ------------------------ | ----------------------------------- | ----------------------------------------------- | -------------------------------------- |
| Faculties | `GET /profile-faculties` | `GET /profile-faculties/:facultyId` | `POST /profile-faculties/:facultyId`            | `DELETE /profile-faculties/:facultyId` |
| Studies   | `GET /profile-studies`   | `GET /profile-studies/:studyId`     | `POST /profile-studies/:studyId`                | `DELETE /profile-studies/:studyId`     |
| Subjects  | `GET /profile-subjects`  | `GET /profile-subjects/:subjectId`  | `PUT /profile-subjects/:subjectId` `{ status }` | `DELETE /profile-subjects/:subjectId`  |

Faculties/studies adds are plain idempotent selections (no body). Subjects
use `PUT` with a `status` body (`completed` or `currently_taking`) since it's
a value, not just a membership toggle. All three are `profile_id = auth.uid()`
RLS, session-client-eligible.

---

## Favorites

Authenticated, own resource. `GET /favorites`, `GET /favorites/:scriptId`,
`POST /favorites/:scriptId` (idempotent), `DELETE /favorites/:scriptId`.
**Not** restriction-checked — favoriting is always available. Creating or
removing a favorite revalidates the affected public-profile cache tags.

---

## Votes

| Route                                                          | Auth     | Notes                                                                                                                                                                                                                                                                                                                                                                              |
| -------------------------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /votes`, `/votes/script/:scriptId`, `/votes/user/:userId` | Public   | —                                                                                                                                                                                                                                                                                                                                                                                  |
| `GET /votes/script/:scriptId/stats`                            | Public   | `{ upvotes, score }`                                                                                                                                                                                                                                                                                                                                                               |
| `GET /votes/my-votes`, `/votes/script/:scriptId/my-vote`       | Required | —                                                                                                                                                                                                                                                                                                                                                                                  |
| `POST /votes/:scriptId`                                        | Required | Toggle. First call adds a vote, second removes it. Script authors cannot vote for their own scripts, but may remove an existing vote. `vote_score` is clamped at zero. Runs through a single atomic `toggle_vote` RPC (`security definer`, keyed off `auth.uid()` internally) rather than a read-then-write, so it can't race and can't be called with an arbitrary score delta. Casting is rejected if restricted; removing is not. Returns `{ voted, vote_score }`. |

---

## Ratings

Professors and subjects each take multiple, independently extensible rating
types via a shared `rating_types` lookup (`target_type: 'professor'|'subject'`).
One rating per user per type per entity — posting again updates the score.

**Rating types** — public read, admin-only write (`is_admin()` RLS, no
internal secret involved):
`GET /ratings/types` (optional `?target_type=`), `GET /ratings/types/:id`,
`POST /ratings/types` (`{ id, target_type, label }`, `id` matches
`^[a-z0-9_]{2,40}$`), `PATCH /ratings/types/:id` (`{ label }`),
`DELETE /ratings/types/:id` (409 if any rating still references it).

**Professor/subject ratings** — identical shape, scoped by path:

| Route                                                   | Auth                                                                                                           |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `GET /ratings/{professor,subject}/:id`                  | Public                                                                                                         |
| `GET /ratings/{professor,subject}/:id/stats`            | Public — `{ rating_type_id, average, count }[]`                                                                |
| `GET /ratings/{professor,subject}/:id/my-ratings`       | Required                                                                                                       |
| `POST /ratings/{professor,subject}/:id`                 | Required — `{ rating_type_id, score (1–5) }`. Rejected if restricted, or if the type doesn't match the target. |
| `DELETE /ratings/{professor,subject}/:id/:ratingTypeId` | Required — not restriction-checked                                                                             |

---

## Notifications

Own-resource, authenticated. System-generated — there is no user-facing
create endpoint, matching `notifications` RLS (`INSERT` is admin/service-role
only). Emitted today for: achievements (`type: 'achievement_earned'`),
onboarding, and account creation. The `type` column is open-ended, so new
kinds need no migration; type-specific payload lives in `data`.

| Route                             | Notes                                                                                                 |
| --------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `GET /notifications`              | List own notifications. Query: `is_read` (`true`/`false`)                                             |
| `GET /notifications/unread-count` | `{ count }`                                                                                           |
| `PATCH /notifications/read-all`   | Marks all unread as read                                                                              |
| `PATCH /notifications/:id`        | `{ is_read }` (boolean, else `400`) — update one notification's read state; `404` if not the caller's |
| `DELETE /notifications/:id`       | Delete one notification                                                                               |

### Achievements

`achievement_definitions` (public read) define a `metric` + `threshold` on the
`profile` entity type. After a relevant mutation, the backend recomputes that
profile's current value for the metric and awards (`profile_achievements`) +
notifies (`type: 'achievement_earned'`) for any newly-crossed threshold —
idempotent, service-role, never fails the triggering request.

| Metric                   | Recomputed after                               | Credited to                                               |
| ------------------------ | ---------------------------------------------- | --------------------------------------------------------- |
| `scripts_uploaded`       | `POST /scripts`                                | The uploader                                              |
| `comments_posted`        | `POST /comments`, `POST /comments/:id/replies` | The comment/reply author                                  |
| `total_script_votes`     | `POST /votes/:scriptId` (either direction)     | The **voted-on script's author**, not the voter           |
| `total_script_downloads` | `POST /scripts/:id/download`                   | The script's author (no seeded achievement uses this yet) |

---

## Client Access Patterns

Every route uses either the caller's session client or the service-role
client. Getting it backwards either silently fails a legitimate request
(session client hits a table RLS doesn't grant it) or bypasses an intended
check (service role used where RLS was supposed to be the actual gate).

**Use the session client** when RLS already grants the caller access: their
own resource (`author_id`/`user_id`/`profile_id` = `auth.uid()`), or an
`is_admin()`-gated policy for an admin action. This is nearly everything —
scripts/comments/profiles admin actions, all "own resource" endpoints, flags
(list/resolve/delete, now that admin has direct SELECT/DELETE RLS), rating
types, professor/subject ratings, profile faculties/studies/subjects,
notifications, restrictions.

**Use the service role** only where no RLS path exists for the caller:
- All catalog + catalog-junction tables (`universities` → `professor_studies`)
  — read-only via RLS for every role, admin included; `/api/internal` is the
  only write path.
- `POST /scripts/:id/download` — `download_events` has zero client-facing
  `INSERT` policy for any role.
- Creating notifications and awarding achievements (`INSERT` is not granted
  to clients).
- `PATCH /internal/profiles/:id/role` — deliberately hardened past what RLS
  alone would require, given how sensitive the column is.

---

## Authentication

Authenticated endpoints require the Supabase session cookie set by
`/api/auth/login` or `/api/auth/callback`. There is no Bearer-token path.
`authMiddleware` verifies the cookie and returns `401` on failure.

| Route                 | Auth     | Notes                                                                                                                                                                                                                                                                                                                    |
| --------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `POST /auth/register` | Public   | `{ email, password, username, full_name, academicProfile? }` — the first four are required, else `400`. `academicProfile` may contain `{ facultyId, studyId, completedSubjectIds }`; its catalog IDs are validated and saved before success. Duplicate usernames return `409`, disposable email domains are rejected with `400`, and repeated attempts are `429`-limited per IP. The profile row is ensured server-side because registration must not depend on the database trigger alone. Sets `emailRedirectTo` to `{origin}/auth/callback`. |
| `POST /auth/login`    | Public   | `{ email, password }`. `401` on bad credentials and `429` after repeated failed attempts from the same IP. Returns `{ success, user: SessionUser, session }`.                                                                                                                                                              |
| `POST /auth/callback` | Public   | `{ access_token, refresh_token }` — establishes the session from an email-confirmation (or similar) redirect. The frontend (`useAuthCallback`) reads the tokens from the URL fragment and posts them here. Implicit flow, not PKCE. `400` if either token is missing, `401` if invalid. Returns the same shape as login. |
| `POST /auth/logout`   | Required | Signs out and clears the cookie.                                                                                                                                                                                                                                                                                         |
| `GET /auth/session`   | Public   | `{ user: SessionUser \| null, session: null }`-shaped; refreshes sessions only when they expire within 60 seconds, and clears invalid/expired sessions when refresh fails. Access tokens are configured for one week to minimize refreshes.                                                                                                                                                                                                                                                                                              |

`SessionUser` (see `shared/types/auth.types.ts`) is the app-shaped user, not
Supabase's raw auth user: `{ id, email, username, role, subjects: [{ subject_id,
status }], selected_faculty_ids, selected_study_ids }`. `login`, `callback`,
and `session` all return it, so the client never has to refetch `/session`
after signing in. Responses are typed `RegisterResponse`, `LoginResponse`,
`CallbackResponse`, `LogoutResponse`, `SessionResponse`.

## Role-Based Access Control

`profiles.role` is `student` / `moderator` / `admin` — **only `admin` carries
any elevated database privilege today.**

1. Catalog routes require `x-internal-secret` for every request, independent
   of Supabase role — RLS closes these tables to everyone regardless.
2. Authenticated routes generally operate on the caller's own resources.
3. Admin-only actions: full CRUD on any `scripts`/`comments`/`profiles` row,
   flag resolution, flag listing, rating-type management, user restrictions —
   all `is_admin()`-gated in RLS, all usable via the admin's own session.
4. **Moderators have zero elevated access anywhere in this API.** The role is
   reserved for a planned notification-trigger feature (see
   [Planned Endpoints](#planned-endpoints-not-yet-implemented)), not direct
   write access. Any code still branching on `role === 'moderator'` for
   elevated behavior is stale and should check `admin`.
5. Internal catalog writes and role changes require `x-internal-secret`.
6. **Restricted users** (`profile_restrictions`, admin-managed, enforced via
   `is_restricted()` in RLS) are blocked from *creating or updating* scripts,
   comments, comment reactions/likes, flags, votes, and ratings — but can
   still remove their own existing content or interactions. Only favoriting
   is exempt entirely (`script_favorites` has no restriction check in RLS).

Violations return `403` with an error payload.

## Error Responses

```json
{ "error": "Error message description" }
```
`400` validation · `401` unauthenticated · `403` forbidden/restricted ·
`404` not found · `409` conflict (unique/FK constraint, or a catalog delete
blocked by dependents) · `429` too many requests · `500` server error.

## Notes

**Response types**: route response shapes are defined in `shared/types/` and
applied at the route with `c.json<T>(...)` (e.g. the auth routes above), so
`next/` and `sanity/` import the same types the API returns.

**Vote system**: one `+1` per user per script, toggle behavior, `vote_score`
clamped at zero. No downvotes exist anywhere in the schema or API.

**Flag system**: `is_flagged` is set on the target when a flag lands, cleared
once no pending flags remain. Flagged content stays publicly visible —
flagging surfaces content for review, it never hides it.

**File types**: `pdf`, `jpg`, `jpeg`, `png`, `webp`, `md`, `doc`, `docx`,
`xls`, `xlsx`. A script has one or more immutable `script_files` rows
(`file_url`, `file_type`, `file_size_bytes`, `bucket`, ordered by
`position`). Per-file size limit (~1MB) and type/extension checks are
enforced at the API via `zValidator`, not Postgres — the database never sees
raw bytes.

**Portable Text**: `scripts.title`, `scripts.description`, and `comments.content`
are Portable Text (`jsonb` block arrays). The API enforces the editor allow-list:
script content accepts text blocks with spans, known styles/decorators, configured
lists, and alignments; comments accept normal text blocks with inline decorators
only. Unsupported block/child types, marks, annotations, and extra fields are
rejected with `400`. Script titles must contain text and fit within 2 KiB;
descriptions are limited to 50 KiB. Comments require at least 3
non-whitespace characters and 10 KiB of serialized JSON. Postgres also
enforces its JSON size caps.

## Planned Endpoints (Not Yet Implemented)

- **Achievement definitions CRUD** — admin create/update/delete for
  `achievement_definitions`; only the public read exists today.
- **Moderator notification pipeline** — repeated flags notifying moderators,
  a moderator's flag escalating to admins. No schema or backend work started;
  moderators have no elevated access today.