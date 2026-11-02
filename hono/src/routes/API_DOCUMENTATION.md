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
- [Achievement definitions](#achievement-definitions)

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
| `POST /file-ops/upload-urls` | Authenticated. Step 1 of 3. Body: `{ subjectId?, files: [{ name, size }] }` (1–10 files). Validates each extension and size, then returns `{ success: true, uploads: [{ stagingKey, url, contentType }] }` in request order: presigned PUT URLs (valid 10 minutes) into `staging/{userId}/` in the default bucket. `400` for an unsupported extension, an oversized file, or too many files; `429` when rate limited (30 requests per 10 minutes per user). |
| `POST /file-ops/finalize` | Authenticated. Step 3 of 3. Body: `{ subjectId?, files: [{ stagingKey, name }] }`, where `name` is the file's original name. Runs each staged file through the optimizer and returns `{ success: true, files: [{ fileKey, fileType, fileSizeBytes, bucket, fileName }] }` (`UploadResponse`), which is what `POST /scripts` and `POST /scripts/:id/files` take as `files`. `fileName` is derived from the original `name`: lowercased, stripped of accents, kebab-cased and without its extension (`Predavanje 3.PDF` → `predavanje-3`), or `null` when nothing usable is left (e.g. a name in Cyrillic only). It stays that whatever the optimizer does to the stored object, so a download is named after what was uploaded with the stored extension (an image uploaded as `.png` is stored, and downloaded, as `.webp`); the R2 key itself is `<prefix>/<uuid>.<ext>`. All-or-nothing: `400` for a key that isn't the caller's, doesn't exist (never uploaded, or expired), or whose contents don't match its extension; `413` if a file is still over the stored cap after optimizing (the body also has `stagingKey`, naming the file, and `sizeBytes`, its size after optimizing); `429` when rate limited (15 requests per 10 minutes per user); `503` if the optimizer service is configured but unavailable (nothing is stored unoptimized); `500` otherwise. A rejected request leaves nothing behind. |
| `GET /file-ops/get-file/*` | Public. Returns `{ url, key }`: a pre-signed download URL (valid for 1 hour) for a key recorded in `script_files`; the endpoint resolves its bucket from that row and ignores any `?bucket=` query param. With `?download=1` the URL answers with `Content-Disposition: attachment; filename="<file_name>.<file_type>"` so the browser saves the file under its stored name (a row without a valid stored name gets a plain `attachment`); without it the URL renders inline, which previews rely on. |

**Upload flow**: file bytes never pass through the API (Vercel caps request
bodies at 4.5 MB). The browser (1) calls `/upload-urls`, (2) `PUT`s each file
straight to its presigned URL, sending the returned `contentType` as
`Content-Type` and the declared size as the body length (both are signed),
then (3) calls `/finalize`. The content type is derived from the extension
server-side, never taken from the client. Limits live in
`shared/config/shared-constants.ts`: a file stored in R2 is at most 3.5 MB
(`MAX_STORED_FILE_BYTES`; the optimizer aims for 3 MB,
`TARGET_STORED_FILE_BYTES`), and `MAX_UPLOAD_FILE_BYTES` is the largest
*uploaded* file for types the optimizer can shrink (PDF, images): 20 MB. Anything
above the stored cap relies on the optimizer; without the optimizer service it
is rejected at finalize. Accepted extensions: `pdf`, `jpg`, `jpeg`, `png`,
`webp`, `md`, `docx`, `xlsx`. Legacy `.doc` and `.xls` are rejected.

**Optimizer**: `finalize` calls `optimizeStagedFile`
(`hono/src/lib/file-optimizer.ts`). When both `OPTIMIZER_URL` and
`OPTIMIZER_SECRET` are set it calls the optimizer service (`POST /optimize`,
90 s timeout); the request is signed with an HMAC over a timestamp and the body
(`shared/utils/optimizer-signature.ts`), so the secret never travels and a
captured request expires after 5 minutes. With neither set it uses an
in-process stand-in that enforces the stored cap, checks the real file signature
(so a renamed file is rejected), and stores the file as uploaded, with no
compression or WebP conversion. It fails closed: if the service is configured
but unreachable or errors (or only one variable is set), `finalize` returns
`503` and stores nothing unoptimized. The contract
(`OptimizeFileRequest` / `OptimizeFileResult` in
`shared/types/file-upload.types.ts`): the service answers `200` with an
`OptimizeFileResult` for everything it decides about a file, rejections included.

**Bucket setup (required)**: the default bucket needs a CORS rule allowing
`PUT` from the site origin with the `Content-Type` header, and a lifecycle
rule expiring the `staging/` prefix after one day (for abandoned uploads). R2
enforces the signed `Content-Length`: a PUT whose body doesn't match the
declared size is rejected with `403`.

The CORS rule's `AllowedOrigins` must list every origin that uploads, and R2
takes exact strings plus a single `*` — no `https://*.vercel.app` wildcard. The
current list covers `https://scriptr.uk`, `http://localhost:3000`, and one
preview alias; other `scriptr-web-git-*` previews will fail the browser `PUT`
(CORS), though they fail earlier anyway because the auth cookie isn't sent
cross-site. Only `PUT` is needed: the browser never reads script files through
`fetch`, and avatars are fetched from a public URL, not from this rule.

**Storage scoping**: if `subjectId` is provided and resolves to a real
subject → study → faculty → university chain, the file is stored in that
university's `r2_bucket_id` bucket (falling back to the default `R2_BUCKET`
if the university has none set), under a key prefixed
`{facultyId}/{studyId}/{subjectId}/{userId}/` — all Postgres dbIds, not
slugs. If `subjectId` is omitted or doesn't resolve, the file falls back to
the default bucket under a plain `{userId}/` prefix. The file type is also
constrained in Postgres (`script_files_file_type_check`), so adding or
removing a type needs a migration as well as a code change.

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
| `GET /scripts`                    | All scripts, newest first. Public and unscoped: a cookie does not change the result                                                                                                                          |
| `GET /scripts/:id`                | One script by id. Public and unscoped; `404` only when the script does not exist                                                                                                                             |
| `GET /scripts/subject/:subjectId` | Scripts for a subject, sorted by vote score                                                                                                                                                                 |
| `GET /scripts/top?limit=10`       | By vote score                                                                                                                                                                                               |
| `GET /scripts/popular?limit=10`   | By download count                                                                                                                                                                                           |
| `GET /scripts/search?q=`          | Fuzzy match on title/description (Portable Text → plain text)                                                                                                                                               |
| `POST /scripts/:id/download`      | Records a download, deduped by account → IP → `x-device-id` header. Runs on service-role — `download_events` has no client-facing INSERT policy for any role. The count is incremented atomically (`increment_script_download_count` RPC, service-role only). A signed-in author downloading their own script returns `counted: false` and records nothing; anonymous self-downloads can't be detected and still count. Returns `{ success: true, counted: boolean }` |

Response excludes `is_flagged` (internal moderation state). Each file in
`files` includes `bucket` (see [File Uploads](#file-uploads)).
Script summary responses include `comments: [{ count }]`, counting all
comments and replies. Comment-list responses include `totalCount` for
top-level threads (used for root pagination) and `totalCommentCount` for all
comments, including replies.

### Authenticated

| Route                      | Notes                                                                                                                                                                                                                                                                                                                                                                                                                               |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST /scripts`            | Body: `{ title, description?, subjectId, professorId, examSession?, examYear?, additionalReading?, files?: [{ fileKey, fileType, fileSizeBytes, bucket, fileName? }] }` — `examSession` is `january`, `june`, `september` or `null` ("General (All Sessions)"); `examYear` is a whole year from 2023 up to the current year, and for a session later in the calendar year than today, at most the previous year (e.g. a September script cannot use 2027 in January 2027). `null` is "General (All Years)" and is only sent with a `null` session. Out-of-range years or unknown sessions are rejected with `400` — `files`, when present, is exactly what `POST /file-ops/finalize` returns, passed straight through (a `fileName`, if sent, must already be in the kebab-case form finalize returns, or the request is rejected with `400`), and checked against the caller's own storage scope for the script's subject (a bucket or key outside it is rejected with `400` `Invalid upload request`, a file that doesn't exist in R2 with `400`, and one over the stored cap with `413`, all before anything is written; the stored size is the one R2 reports, not the client's); omit it or send an empty array to create a script without files. `title`/`description` are Portable Text, restricted to supported text blocks, spans, styles, decorators, lists, and alignments; title must contain text and fit within 2 KiB, description within 50 KiB. Validated via a `zValidator` JSON schema (accepts both `subjectId`/`subject_id` etc. key styles). Rejected if restricted. Returns `403` for RLS authorization failures, `409` for missing subject/professor references, and `400` for invalid Portable Text or database constraint violations. |
| `GET /scripts/my-scripts`  | Current user's scripts                                                                                                                                                                                                                                                                                                                                                                                                              |
| `PATCH /scripts/:id`       | Author or admin. Body: `{ title?, description?, additional_reading?, exam_session?, exam_year? }`. Updated Portable Text uses the same allow-list and byte limits as `POST /scripts`; files are immutable — not part of this body. `description: null` clears the description; `exam_session: null` / `exam_year: null` set the general (all sessions / all years) options, and an `exam_year` is validated against the session the script ends up with (a year-only update still has to fit the stored session; changing the session without a new year drops a year the new session cannot have). Invalid Portable Text, an unknown session or an out-of-range year returns `400`. Restriction-checked in RLS (`is_restricted()` is in the UPDATE policy's `USING` clause): a restricted author's update matches no rows, which the route maps to `403` (`Your account is restricted from editing scripts`) instead of a generic `500`. Admins are never restricted. `authenticated` holds column-level `UPDATE` on exactly `title`, `description`, `additional_reading`, `exam_session`, `exam_year` and `updated_at`; anything else this route might write needs its own grant or it fails with `42501` (a `500`).                                                                                                                                                                                                |
| `DELETE /scripts/:id`      | Author or admin. Not restriction-checked (restricted users can still delete their own scripts). Removes the script's database records and attempts to delete all associated R2 objects.                                                                                                                                                                                                                                                                                                                            |
| `DELETE /scripts/:scriptId/files/:fileId` | Author or admin. Removes a single `script_files` row and attempts to delete that R2 object while leaving the script intact. `404` if the file doesn't belong to that script. Not restriction-checked. After the delete, the remaining files are renumbered so `position` stays `0..n-1` (labels never skip); `script_files` has no UPDATE policy, so this step uses the service-role client and only runs once the session client's RLS-checked delete has succeeded. Renumbering is best effort and never fails the request. |
| `POST /scripts/:id/files`  | Author or admin. Body: `{ files: [{ fileKey, fileType, fileSizeBytes, bucket, fileName? }] }` — at least one entry, exactly what `POST /file-ops/finalize` returns. Appends the files to an existing script after its current last `position`. The files get the same checks as in `POST /scripts` (in the caller's own scope for this script's subject, present in R2, size taken from R2; otherwise `400`/`413`). Restriction-checked in RLS (the `script_files` INSERT policy requires a non-restricted author; admins are exempt): a restricted author gets `403` (`Your account is restricted from adding files`). `404` if the script doesn't exist, `403` if the caller is neither author nor admin, `400` for invalid file data or a failed constraint. Because the files are already in R2 when this is called, every failure path deletes the uploaded objects again, but only objects under the caller's own user id: the keys come from the client, and the `404` and `403` paths run before they have been checked. Returns `{ success: true, files: [...] }` with the inserted rows. |
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
| `POST /flags`                                           | Any authenticated, non-restricted user. `{ target_type: 'user'\|'script'\|'comment', target_id, reason (≥10 chars) }`. Authors cannot report their own scripts or comments (`403`); each reporter can have only one pending flag per target (`400` for a duplicate). At five distinct reporters with non-dismissed flags on the same target, each admin receives a `flag_threshold` notification. |
| `GET /flags/my-flags`                                   | Reporter, own flags only                                                                                                                       |
| `DELETE /flags/:id`                                     | Reporter (own flag) **or** admin (any flag). Not restriction-checked.                                                                          |
| `GET /flags`, `/flags/pending`, `/flags/status/:status` | Admin only — RLS grants admins direct `SELECT`                                                                                                 |
| `PATCH /flags/:id`                                      | Admin only. `{ status: 'pending'\|'reviewed'\|'dismissed' }`. A transition to `reviewed` or `dismissed` records `reviewed_by` and `reviewed_at`; returning to `pending` clears them. Dismissing clears `is_flagged` on the target once no other pending flag remains. |

Reporters can create, view their own, and delete their own flag — that's the
complete self-service surface. They cannot change a flag's `status`; only an
admin can resolve one. Moderators have no flag access at all (see
[Role-Based Access Control](#role-based-access-control)).

---

## Restrictions

Admin-managed. `profile_restrictions` has `profile_id` as its primary key —
one row per user. It is active when `expires_at` is `null` (permanent) or is
later than the current time. Expired rows remain in the table for the admin
list, but `is_restricted()` ignores them. Restricted users are blocked from
creating/updating scripts, comments, flags, comment reactions, votes, and
ratings — see [Role-Based Access Control](#role-based-access-control).
`profile_restriction_history` records each applied restriction. The ladder
counts history rows that were not lifted early: first = two weeks, second =
one calendar month, third and later = permanent.

| Route                             | Access                                                                                                                                              |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /restrictions`               | Admin only. Active and lapsed rows, including `expires_at` and an `active` flag. |
| `GET /restrictions/me`            | Any authenticated user. Own active restriction, or `null` when unrestricted or expired. Limited to 15 requests per minute per user (`429`). |
| `GET /restrictions/lifted` | Admin only. History rows lifted early (`lifted_early_at` set), newest first, with profile and admin names. |
| `GET /restrictions/lookup?username=...` or `?profile_id=...` | Admin only. Minimal profile fields, count of ladder-eligible history rows, and any active restriction. Exactly one query parameter is required. |
| `GET /restrictions/:profileId`    | Owner or admin (RLS-enforced) — a non-admin querying someone else's status silently gets `null`, indistinguishable from unrestricted. |
| `PUT /restrictions/:profileId`    | Admin only. `{ reason (3–500 chars) }`. Returns `400` when the target is an admin account (including the caller); `lookup` does the same. For an active restriction, updates only the reason; otherwise replaces a lapsed row using the ladder and inserts history. |
| `DELETE /restrictions/:profileId` | Admin only. Lifts the row. An active lift marks the latest history row `lifted_early_at`; removing a lapsed row does not change the ladder. `404` if no row exists. |

---

## Profiles

### Public
`GET /profiles`, `/profiles/username/:username`, `/profiles/:id`,
`/profiles/:id/stats` — no auth required. The Next frontend caches public
profile and stats responses; profile, selection, favorite, script, vote, and
download mutations revalidate those tags. A public profile response includes
both authored scripts and favorite scripts. The `script_favorites` SELECT
policy is `true`, so favorites are public and read on the session client; the
direct `/favorites` endpoints remain authenticated and owner-scoped (INSERT /
DELETE policies are owner-only). A failed favorites read returns `500` rather
than an empty list.
Each script's `comments` field is an array containing one `{ count }` item;
the count includes root comments and replies and is read through the
`get_script_comment_counts` RPC rather than a direct comments-table embed.
Missing profiles return `404`; profile database failures return a generic
`500` response rather than exposing database details.
Every profile payload (including `GET /profiles/me`) carries `achievements`:
`[{ achievement_id, earned_at, achievement: { title, description, metric,
threshold, rarity } | null }]`. `title` and `description` are the database
fallback: seeded wording lives in `ACHIEVEMENT_COPY`
(`shared/config/achievements.ts`), which both the UI and the award notification
prefer, keyed by `achievement_id`. `rarity` is one of `common`, `uncommon`,
`rare`, `epic`, `legendary`; `metric` and `rarity` are plain strings in the
payload. Awards are permanent; they are read on the session client (the
`profile_achievements` and `achievement_definitions` SELECT policies are
`true`).

### Authenticated
`GET /profiles/me`, `PATCH /profiles/me`, `DELETE /profiles/me`.

`GET /profiles/me/preferences` and `PATCH /profiles/me/preferences` are
authenticated own-row operations on `profile_preferences`, limited to 15 requests per minute per user (`429`). A missing row reads
as `{}`. The PATCH body is `{ preferences }` and merges into the v1 shape:
`{ version: 1, notifications: { toasts: boolean, achievements: 'show'|'hide' } }`.
Unknown keys and invalid values are rejected. Restriction and moderation
notifications are not configurable.

`PATCH /profiles/me` body is `ProfileUpdateRequest`: `{ username (required),
full_name?, selected_faculty_ids?, selected_study_ids? }`. `username` and
`full_name` are validated with the same rules as registration and stored
trimmed. The selection arrays, when present, replace that user's selections
(rows are diffed, inserts before deletes, errors are checked); they are not
restriction-checked and neither is the profile update. Username uniqueness is
checked the same way as `POST /auth/register` (a shared `isUsernameTaken`
lookup, excluding the profile being edited so keeping your own name is fine);
the `profiles_username_key` unique index (`23505`) is the backstop for a race
past it. Success returns `ProfileUpdateResponse` (`{ success: true, profile }`).

| Status | When |
|---|---|
| `400` | Invalid JSON body, invalid `username`/`full_name`, or a non-array id list |
| `403` | RLS violation (`42501`) |
| `404` | Profile not found |
| `409` | Username taken (`ProfileUpdateConflictResponse`: `{ error, field: 'username' }`), or a selected faculty/study id does not exist (FK `23503`) |

The profile row is written before the selections, so a selection failure
returns its error with the profile fields already saved. The sync is not
atomic across the two tables.

**Avatar uploads** are the same two-call shape as a script file upload, and
the only way `profiles.avatar_url` is written:

| Route | Notes |
|---|---|
| `POST /profiles/me/avatar/upload-url` | Authenticated. Step 1 of 2. Body: `{ name, size }`. Validates the extension against `AVATAR_FILE_TYPES` (`jpg`, `jpeg`, `png`, `webp`) and the size against `AVATAR_MAX_UPLOAD_BYTES` (10 MB), then returns `{ success: true, upload: { stagingKey, url, contentType } }`: a presigned PUT into `R2_BUCKET`'s `staging/{userId}/` prefix, exactly like a script upload. `400` for an unsupported extension or an oversized file; `429` when rate limited (20 requests per 10 minutes per user, counted across both avatar calls). |
| `POST /profiles/me/avatar` | Authenticated. Step 2 of 2. Body: `{ stagingKey }`. Runs the staged image through the optimizer's avatar profile — oriented by EXIF, cropped square around the most interesting region, scaled to `AVATAR_SIZE_PX` (320 px), metadata stripped (GPS included), stored as WebP — into `R2_BUCKET` at `avatars/{userId}.webp` (the same key every time, so a re-upload overwrites the old picture), and points `profiles.avatar_url` at `${R2_PUBLIC_URL}/avatars/{userId}.webp?v={version}`. Returns `AvatarUploadResponse` (`{ success: true, avatarUrl }`). `400` for a key that isn't the caller's or whose extension isn't an avatar type; `413` if the stored image is still over `AVATAR_MAX_STORED_BYTES` (200 KB; the optimizer aims for 100 KB); `429` when rate limited; `503` when `R2_PUBLIC_URL` isn't set, or when the optimizer service is configured but unavailable — an avatar is never stored uncropped; `500` otherwise. A rejected upload leaves the previous avatar untouched and removes only the staged copy. |

Avatars differ from script files in four ways that matter:

- They live in the **same bucket** as script files, under the `avatars/`
  prefix. That bucket needs a public domain (`R2_PUBLIC_URL`, a custom domain or
  its `r2.dev` URL): it exposes every object by key, so script files are no
  longer only reachable through expiring signed URLs — their keys stay
  unguessable random UUIDs and are only handed out with a script.
- `profiles.avatar_url` holds a **full public URL**, not a key. It is rendered
  directly as an image source on cached pages (comments, script cards, the
  header, the profile page), so it has to stay valid without signing.
- The **key is fixed per user** (`avatars/{userId}.webp`), so the stored URL
  carries a `?v=` that changes on every upload. R2 ignores the query when
  resolving the object, and browser/CDN caches key on it, so each upload is a
  new cache entry and the object keeps the bucket's immutable `Cache-Control`.
  There is no previous object to delete; account deletion removes the one key.
- The row is written with the **service-role client**, because the URL is
  served to every visitor. `authenticated` therefore has no `UPDATE`/
  `INSERT` grant on `avatar_url` (migration
  `20261029120000_revoke_profile_avatar_url_write.sql`); do not move this
  write onto the session client. The client renders avatars with
  `unoptimized`, which also takes away the `next/image` host allow-list as a
  backstop — the grant is the boundary.

**Bot Fight Mode**: `files.scriptr.uk` is a proxied host in the same Cloudflare
zone, so the zone-wide Bot Fight Mode applies to it. On the free plan that
setting is on or off for the whole zone, not per hostname (the API host is
DNS-only for exactly that reason). Avatar loads were tested from non-browser
clients — `curl` and Node both got `200 image/webp` — so it is not challenging
this host today. If avatars ever render as broken images while the object is
correct in the bucket, this is the first suspect, and the only lever available
is turning Bot Fight Mode off for the zone.

Limits and types live in `shared/config/avatar.ts`; the routes check them
again, so the client-side check only saves a round trip.

### Admin
`PATCH /profiles/:id`, `DELETE /profiles/:id` — same shape as the `/me`
equivalents. The profiles row goes through the session client (`is_admin()`
is baked into its RLS policy), but `profile_faculties`/`profile_studies`
policies are `profile_id = auth.uid()` with no admin override, so
`PATCH /profiles/:id` writes selections with the service-role client after
the admin check.

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

Responses for the types, stats, my-ratings and upsert endpoints are typed in
`shared/types/ratings.types.ts`. Error mapping on `POST`: `403` (restricted),
`409` (`23503`: the professor or subject being rated doesn't exist), `400`
(missing/invalid/non-JSON body, or a rating type that doesn't exist or doesn't
match the target — the DB trigger raises `P0001` before the foreign key is checked).
Stats are aggregated in the route from the raw rows, so only types with at
least one rating appear.

---

## Notifications

Own-resource, authenticated. Rate limited per user (15 requests per minute
across all notification routes, `429` beyond that). System-generated — there
is no user-facing create endpoint. Admin-triggered moderation notifications use the session
client under the admin INSERT policy; achievement and flag-threshold
notifications use the service-role client. Kinds include achievements,
restriction applied/lifted, content removed, and the five-reporter flag
threshold alert. Onboarding and account creation notifications remain
supported. The `type` column is open-ended, so new kinds need no migration;
type-specific payload lives in `data`.

The frontend merges server rows with per-user local notifications. It refreshes
on mount, tray open, and window focus/visibility change; it does not poll or use
realtime. The persistent restriction notice is derived from
`GET /restrictions/me`, not from a deletable notification row.

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
| `total_script_downloads` | `POST /scripts/:id/download`                   | The script's author (seeded downloads achievements start at 1; a signed-in author downloading their own script is not counted) |

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
notifications, restrictions, and profile preferences. Restriction history is
admin-accessible through its admin RLS policies.

**Use the service role** only where no RLS path exists for the caller:
- All catalog + catalog-junction tables (`universities` → `professor_studies`)
  — read-only via RLS for every role, admin included; `/api/internal` is the
  only write path.
- `POST /scripts/:id/download` — `download_events` has zero client-facing
  `INSERT` policy for any role.
- Awarding achievements and creating flag-threshold alerts (`INSERT` is not
  granted to non-admin clients). Admin-triggered moderation notifications use
  the session client under the admin INSERT policy.
- Reading/writing `profile_preferences` and admin restriction history uses the
  session client under its own-row or admin RLS policies.
- `PATCH /internal/profiles/:id/role` — deliberately hardened past what RLS
  alone would require, given how sensitive the column is.
- `POST /profiles/me/avatar` writing `profiles.avatar_url` — the value is a
  public URL shown to everyone, so it must not be settable by the user, and
  `authenticated` has no grant on that column (see
  [Profiles](#profiles)).

---

## Authentication

Authenticated endpoints require the Supabase session cookie set by
`/api/auth/login` or `/api/auth/callback`. There is no Bearer-token path.
`authMiddleware` verifies the cookie and returns `401` on failure.

| Route                 | Auth     | Notes                                                                                                                                                                                                                                                                                                                    |
| --------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `POST /auth/register` | Public   | `{ email, password, username, full_name, academicProfile? }` — the first four are required, else `400`. `academicProfile` may contain `{ facultyId, studyId, completedSubjectIds }`; its catalog IDs are validated and saved before success. A taken username or an already-registered email returns `409` with `{ error, field: 'username' \| 'email' }` (typed `RegisterConflictResponse`), disposable email domains are rejected with `400`, and repeated attempts are `429`-limited per IP. The profile row is ensured server-side because registration must not depend on the database trigger alone. Sets `emailRedirectTo` to `{origin}/auth/callback`. |
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
   [Achievement definitions](#achievement-definitions)), not direct
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
once no pending flags remain. Both writes use the internal (service-role) client, because `authenticated` has no `UPDATE` grant on `is_flagged`. Flagged content stays publicly visible —
flagging surfaces content for review, it never hides it.

**File types**: `pdf`, `jpg`, `jpeg`, `png`, `webp`, `md`, `docx`, `xlsx`
(legacy `doc`/`xls` are rejected). A script has one or more immutable
`script_files` rows
(`file_url`, `file_type`, `file_size_bytes`, `bucket`, `file_name`, ordered by
`position`). `file_name` is the uploaded name in kebab-case without its
extension, and is `null` for files uploaded before names were kept (the UI
falls back to a positional label). Type/extension checks run at the API via
`zValidator` and the real file signature at finalize, not in Postgres — the
database never sees raw bytes. A stored file is at most 3.5 MB; PDFs and images
may be uploaded up to 20 MB and are shrunk to fit (see
[File Uploads](#file-uploads)).

**Portable Text**: `scripts.title`, `scripts.description`, and `comments.content`
are Portable Text (`jsonb` block arrays). The API enforces the editor allow-list:
script content accepts text blocks with spans, known styles/decorators, configured
lists, and alignments; comments accept normal text blocks with inline decorators
only. Unsupported block/child types, marks, annotations, and extra fields are
rejected with `400`. Script titles must contain text and fit within 2 KiB;
descriptions are limited to 50 KiB. Comments require at least 3
non-whitespace characters and 10 KiB of serialized JSON. Postgres also
enforces its JSON size caps.

## Achievement definitions

Definitions are rows: admins create and edit their metric, threshold and
rarity at runtime, while the title and description are code (`ACHIEVEMENT_COPY`
in `shared/config/achievements.ts`). Only profiles earn achievements, so
entity_type is always profile and is never sent by a client.

- GET /achievement-definitions — public; full rows, ordered by metric then threshold.
- POST /achievement-definitions — admin; body AchievementDefinitionInput. The id is immutable after create.
- PATCH /achievement-definitions/:id — admin; body AchievementDefinitionPatch.
- DELETE /achievement-definitions/:id — admin; 409 once anyone has earned it, because awards are permanent.

Body fields: id (create only), metric, threshold, rarity. Title and
description are **not** client input: they live in `ACHIEVEMENT_COPY`
(`shared/config/achievements.ts`), and `POST` rejects an id that has no entry
there with `400`, because the badge and the notification have nothing to show
otherwise. The API writes that copy onto the row, and every `PATCH` re-syncs it,
so the database copy is only a snapshot used if an entry is ever removed.

Validation mirrors the database: id matches ^[a-z0-9_]{2,60}$, threshold is a
whole number above 0, metric is one of the four metrics above, and rarity is
one of common, uncommon, rare, epic, legendary. Errors: 400 validation, 403
not an admin, 409 duplicate id or a delete blocked by earned awards.

Awards are permanent and are never recomputed. Editing a definition's rarity
leaves existing awards in place and only changes how they render; changing its
title or description is a code change in `ACHIEVEMENT_COPY`, which updates the
badge, the admin list and future notifications together. Adding a definition or lowering a threshold awards users the
next time they take that qualifying action; there is no backfill and no
recheck action. Deleting a definition nobody holds is allowed.
