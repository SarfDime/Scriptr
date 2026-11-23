# API Endpoints

Reference for `hono/`. Every path is relative to `/api` (`.basePath('/api')`), so the health
check is `GET /api`. Response shapes live in `shared/types/` and are applied at the route
(`c.json<T>(…)`). Repo and route rules: [`../../AGENTS.md`](../../AGENTS.md) (workspace) and
[`../../../AGENTS.md`](../../../AGENTS.md) (repo-wide).

## Access surfaces

| Surface                      | Needs                                                           | Pinned origin          |
| ---------------------------- | --------------------------------------------------------------- | ---------------------- |
| Session routes (the default) | Supabase session cookie                                         | —                      |
| `/api/sanity/*`              | `x-admin-token`: a TOTP code exchanged at `POST /sanity/access` | `SANITY_STUDIO_ORIGIN` |
| `/api/admin/*`               | the same token **and** an admin session                         | `WEBSITE_ORIGIN`       |

- `POST /sanity/access` `{ code }` → `{ token, expiresAt }`, valid twenty minutes. `400` not
  six digits, `401` wrong or reused code, `429` after 5 attempts per IP in 15 minutes,
  `503` when `ADMIN_TOTP_SECRET` is unset or not base32. The token is stateless, so twenty
  minutes is the whole revocation window.
- `POST /admin/access` `{ code }` verifies the same TOTP and sets the
  `scriptr-admin-access` cookie (`HttpOnly`, `SameSite=Lax`, `Max-Age=1200`, `COOKIE_DOMAIN`)
  as well as returning `{ token, expiresAt }` for scripted callers. Same codes.
- Every other `/sanity/*` route takes `x-admin-token`; every other `/admin/*` route takes
  the cookie or that header **and** an admin session (the token proves the unlock, the
  session identifies the actor and keeps RLS in force).
- Origin pinning: a foreign `Origin` is `403` even with a valid token, and in production a
  missing one is too (the admin surface allows it, because server-rendered pages call from
  Node). The origin must also be listed in `CORS_ORIGINS`.
- Admin-gated routes on ordinary paths (session + unlock): the flag queue and resolution,
  the restriction reads and writes, rating-type and achievement-definition writes, the admin
  script list (`GET /scripts`, `/scripts/flagged/all`, `/comments/flagged/all`), and
  `GET`/`PATCH`/`DELETE /profiles/:id`, `GET /profiles`, `GET /profiles/:id/admin`,
  `POST /admin/notifications`.
- Generate the secret with `corepack pnpm --filter @scriptr/api admin:totp`.

## Catalog (admin token, reads included)

RLS is read-only on these tables and their junctions for every role, admin included;
`/api/sanity/*` with the service-role client is the only write path.

| Route                              | Response                                                                    |
| ---------------------------------- | --------------------------------------------------------------------------- |
| `GET /sanity/universities`, `/:id` | Universities with faculties (incl. `r2_bucket_id`)                          |
| `GET /sanity/faculties`, `/:id`    | Faculties; one faculty with `studies` (each with `subjects`) and professors |
| `GET /sanity/professors`, `/:id`   | Professors; one with subjects, studies, faculties                           |
| `GET /sanity/subjects`, `/:id`     | Subjects; one with study and professors                                     |

Subjects reach faculties only through studies (`subjects.study_id → studies.faculty_id`);
faculty responses nest subjects under `studies`.

Mutations, all under `/sanity`:

| Entity     | Routes                                                                                                                                                                                                                                                                                                                                            |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| University | `POST /universities` `{ name, sanity_id?, r2_bucket_id? }` (returns the linked row with `existing: true` if the Sanity doc is already linked) · `PATCH /universities/:id` `{ name?, r2_bucket_id? }` · `DELETE` (blocked with `409` while faculties reference it) · `POST /universities/:id/sync` `{ name, r2_bucket_id? }` (`404` if no row)     |
| Faculty    | `POST /faculties` `{ name, university_id, sanity_id? }` · `PATCH /faculties/:id` `{ name?, university_id? }` · `DELETE` (`409` if referenced by studies, professor assignments or user selections) · `POST /faculties/:id/sync`                                                                                                                   |
| Professor  | `POST /professors` `{ name, faculty_ids?, study_ids?, sanity_id? }` · `PATCH /professors/:id` `{ name? }` · `DELETE` (blocked if referenced by subjects, faculties, studies, scripts or comments) · `POST`/`DELETE /professors/:id/{faculties/:facultyId,studies/:studyId}` · `GET /professors/by-sanity/:sanityId` · `POST /professors/:id/sync` |
| Study      | `POST /studies` `{ name, faculty_id, site_slug, sanity_id?, r2_bucket_id? }` · `PATCH /studies/:id` · `DELETE` (blocked if referenced by subjects, professor assignments or enrollments) · `POST /studies/:id/sync`                                                                                                                               |
| Subject    | `POST /subjects` `{ name, study_id, professor_ids?, sanity_id? }` · `PATCH /subjects/:id` `{ name?, study_id? }` · `DELETE` (blocked if referenced by professor assignments, user statuses or scripts) · `POST`/`DELETE /subjects/:id/professors/:professorId` · `POST /subjects/:id/sync`                                                        |

- `r2_bucket_id` matches `^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$` (API and a DB CHECK), unique per
  university; studies may also carry one, falling back to the parent university's bucket.
- `site_slug` is a study's permanent handle: lowercase letters, digits and inner dashes, not
  reserved, unique, refused with `409` once set.
- University delete is blocked by an explicit dependents check (`409`), independent of the
  FK's `ON DELETE CASCADE`.
- `professors` holds only `id`, `name`, `sanity_id`, `created_at`; bio and picture are Sanity.

Read-only lookups for the Studio: `GET /sanity/{universities,faculties,studies,professors,subjects}`
(plain rows, no embeds) and `GET /sanity/{universities,faculties,professors,subjects}/by-sanity/:sanityId`
(`404` "Not linked to a database record yet").

## Sitemap

`GET /sitemap/scripts` — `{ slug, updated_at }` for every script, newest first. Needs
`x-sitemap-secret` = `SITEMAP_SECRET`; 10 requests a day and 2 a minute per IP (`429`).
`/sitemap.xml` is prerendered, so one read per deployment is the expected load.

## Uploads

| Route                        | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST /file-ops/upload-urls` | Auth. Step 1. `{ subjectId?, files: [{ name, size }] }`, 1–10 files. Returns `{ success, uploads: [{ stagingKey, url, contentType }] }` — presigned PUTs valid 10 minutes into `staging/{userId}/`. `400` unsupported extension / oversized / too many; `429` at 30 requests per 10 minutes per user.                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `POST /file-ops/finalize`    | Auth. Step 3. `{ subjectId?, files: [{ stagingKey, name }] }`. Optimizes each file and returns `{ success, files: [{ fileKey, fileType, fileSizeBytes, bucket, fileName }] }`, which `POST /scripts` and `POST /scripts/:id/files` accept as `files`. `fileName` is the original name lowercased, accent-stripped, kebab-cased, extension dropped (`Predavanje 3.PDF` → `predavanje-3`), or `null` when nothing usable remains (Cyrillic-only). All-or-nothing: `400` for a key that is not the caller's, does not exist, or whose bytes do not match the extension; `413` (with `stagingKey` and post-optimization `sizeBytes`) if still over the cap; `429` at 15 per 10 minutes; `503` if the optimizer is configured but unavailable; `500` otherwise. Nothing is left behind. |
| `GET /file-ops/get-file/*`   | Public. `{ url, key }` — a pre-signed download valid one hour for a key recorded in `script_files`, with the bucket resolved from that row (any `?bucket=` is ignored). `?download=1` answers `Content-Disposition: attachment; filename="<file_name>.<file_type>"` (a row without a usable name gets plain `attachment`); otherwise the URL renders inline.                                                                                                                                                                                                                                                                                                                                                                                                                       |

- Bytes never pass through the API (Vercel caps bodies at 4.5 MB): the browser gets the
  presigned URLs, PUTs each file with the returned `Content-Type` and the declared length
  (both signed), then calls finalize. The content type is derived from the extension
  server-side.
- Limits (`shared/config/shared-constants.ts`): 3.5 MB stored (`MAX_STORED_FILE_BYTES`,
  optimizer target 3 MB), 20 MB uploaded for shrinkable types (PDF, images). Accepted:
  `pdf`, `jpg`, `jpeg`, `png`, `webp`, `md`, `docx`, `xlsx`; legacy `.doc`/`.xls` are
  rejected. `script_files_file_type_check` means a type change also needs a migration.
- `finalize` calls `optimizeStagedFile` (`../lib/file-optimizer.ts`): the service
  when `OPTIMIZER_URL` and `OPTIMIZER_SECRET` are both set (HMAC over a timestamp and the
  body, 90 s timeout), otherwise an in-process stand-in that enforces the cap, checks the
  signature and stores as uploaded. One variable set, or an unreachable service, is `503`.
- Storage scoping: a resolvable `subjectId` → study → faculty → university selects that
  university's bucket, under `{facultyId}/{studyId}/{subjectId}/{userId}/{uuid}.{ext}`;
  otherwise the default bucket under `{userId}/`. `script_files.bucket` records where each
  file landed, because a key no longer implies a bucket.
- Bucket setup: CORS allowing `PUT` from the site origin with `Content-Type`, and a
  lifecycle rule expiring `staging/` after a day. R2 enforces the signed length (mismatch →
  `403`). An `AllowedOrigins` entry holds one `*`, which spans periods —
  `https://*.scriptr.uk` covers every study host but not the apex, so list
  `https://scriptr.uk` beside it. Only `PUT` is needed.

## Scripts

Public:

| Route                                                        | Notes                                                                                                                                                                                                                                                                                                                                |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `GET /scripts`                                               | **Admin.** One page, newest first: `?limit` (max 50, default 50), `?offset`, optional `?study=<id>` → `{ items, hasMore, totalCount }`.                                                                                                                                                                                              |
| `GET /scripts/:id`                                           | By **slug or id**. Public and unscoped; `404` only when missing. The slug is minted at creation and never changes.                                                                                                                                                                                                                   |
| `GET /scripts/subject/:subjectId`, `/scripts/study/:studyId` | By vote score.                                                                                                                                                                                                                                                                                                                       |
| `GET /scripts/top?limit=10`, `/scripts/popular?limit=10`     | By votes / downloads; optional `?study=<id>`.                                                                                                                                                                                                                                                                                        |
| `GET /scripts/search?q=`                                     | Fuzzy over title and description in every language; optional `?study=<id>`.                                                                                                                                                                                                                                                          |
| `POST /scripts/:id/download`                                 | Records a download deduped by account → IP → `x-device-id`. Service-role: `download_events` has no client INSERT policy, and the count goes through the atomic `increment_script_download_count` RPC. An author downloading their own script gets `counted: false` and nothing is recorded; an anonymous self-download still counts. |

`?study=` narrows, it never grants: reads are scoped by RLS, and a non-UUID value is `400`
rather than a silently unscoped read. There is no `?study=` on `/professors` (they are
university-scoped). Responses exclude `is_flagged`; `files` carry `bucket`; summaries carry
`comments: [{ count }]` (comments and replies).

Authenticated:

| Route                                     | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST /scripts`                           | `{ title, description?, subjectId, professorId, examSession?, examYear?, additionalReading?, files? }`. `examSession` is `january`/`june`/`september`/`null`; `examYear` is 2023…current, one lower for a session still ahead this calendar year; `null` year only with a `null` session. Out of range is `400`. `files` is exactly what finalize returned — checked against the caller's scope for this subject (otherwise `400 Invalid upload request`), existence in R2 (`400`) and the cap (`413`) before anything is written, with the size taken from R2 — or omitted/empty for a script without files. `title`/`description` are Portable Text per language (see Notes). Study-scoped: the caller must belong to the subject's study (a `profile_studies` row, a study role, or ownership), else `403` before R2 is touched. `409` for an unknown subject/professor, or a professor not assigned to the subject (checked before the upload). Rejected if restricted. |
| `GET /scripts/my-scripts`                 | The caller's scripts.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `PATCH /scripts/:id`                      | Author or admin. `{ title?, description?, additional_reading?, exam_session?, exam_year? }`; files are immutable. `description: null` clears it; `exam_session/year: null` sets the general options; a year is validated against the session the script ends up with. `400` on invalid text, an unknown session or an out-of-range year. Restriction is enforced in the UPDATE policy, mapped to `403` ("Your account is restricted from editing scripts"). `authenticated` holds column UPDATE on exactly `title`, `description`, `additional_reading`, `exam_session`, `exam_year`, `updated_at`.                                                                                                                                                                                                                                                                                                                                                                         |
| `DELETE /scripts/:id`                     | Author or admin. Not restriction-checked. Removes the rows and best-effort deletes the R2 objects.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `DELETE /scripts/:scriptId/files/:fileId` | Author or admin. `404` if the file is not that script's. Not restriction-checked. Renumbers the remaining `position`s (service-role, because `script_files` has no UPDATE policy; best effort).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `POST /scripts/:id/files`                 | Author or admin. `{ files: [...] }`, at least one, exactly what finalize returned; appends after the last `position`. Same scope/existence/size checks (`400`/`413`). The INSERT policy requires a non-restricted author → `403` ("Your account is restricted from adding files"). `404` unknown script, `403` neither author nor admin. Every failure deletes the uploaded objects again, only under the caller's own user id.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `GET /scripts/flagged/all`                | Admin.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |

## Comments

Public (no auth): `GET /comments/script/:scriptId`, `/comments/professor/:professorId`,
`/comments/user/:userId`, `/comments/:commentId/reactions`, `/comments/:commentId/replies`.
With a session, list responses add `reactions_count`, `reactions_by_type`, `likes_count`,
`my_reactions`, `liked_by_me`.

- The three comment lists return top-level comments only: `limit` 1–2 (default 2), `offset`,
  `sort` (`newest` default, or `top` by combined likes and reactions) →
  `{ items, hasMore, totalCount, totalCommentCount }`, each root with up to five
  chronological replies and `replies_has_more`. `totalCount` is root threads for pagination;
  `totalCommentCount` includes replies.
- `GET /comments/:commentId/replies` pages one chronological reply set: `limit` 1–10
  (default 10), `offset` → `{ items, hasMore, totalCount }`; nested replies expose
  `has_replies`.
- Counts include all users' engagement; the API aggregates server-side and returns only
  counts and the viewer's own status. The frontend keeps fetched pages while mounted.

Authenticated:

| Route                                 | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST /comments`                      | `{ content, professor_id? \| script_id? }` — exactly one target. Inline decorators on normal text blocks only; no blocks, annotations, headings, lists or alignment. ≥3 non-whitespace characters, ≤10 KiB of JSON. 10 per 15 minutes per account, plus 60 per 15 minutes across one study. Study-scoped when the target is a script (`403`; unknown `script_id` is `404`); a professor comment is open to any signed-in account. Rejected if restricted. |
| `POST /comments/:commentId/replies`   | `{ content }`; the target is copied from the parent and enforced by a trigger. Same validation, limits and study rule.                                                                                                                                                                                                                                                                                                                                    |
| `POST /comments/:commentId/reactions` | `{ reaction_type: 'like'\|'hate'\|'funny'\|'sad'\|'confused' }`, toggled per type. Authors cannot react to their own comment. 15 toggles per minute per account with likes. Rejected if restricted.                                                                                                                                                                                                                                                       |
| `POST /comments/:commentId/like`      | Toggle, same author rule and engagement limit.                                                                                                                                                                                                                                                                                                                                                                                                            |
| `PATCH /comments/:id`                 | Author or admin. `{ content }`, same allow-list, minimum and size. `404` if missing.                                                                                                                                                                                                                                                                                                                                                                      |
| `DELETE /comments/:id`                | Author or admin. Returns the target's updated `totalCommentCount`, cascade included.                                                                                                                                                                                                                                                                                                                                                                      |
| `GET /comments/flagged/all`           | Admin, unlocked. Service-role read after the admin check, because public roles cannot select `is_flagged`.                                                                                                                                                                                                                                                                                                                                                |

Database errors map to `409` (unique/FK), `403` (permission), `400` (custom Postgres
exception) and a generic `500`; raw details stay in the logs.

## Flags

One table for scripts, users and comments (`target_script_id`/`target_user_id`/
`target_comment_id`, exactly one set).

| Route                                                   | Access                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST /flags`                                           | Any authenticated, non-restricted user. `{ target_type: 'user'\|'script'\|'comment', target_id, reason (≥10 chars) }`. Authors cannot report their own script or comment (`403`); one pending flag per reporter per target (`400`). At five distinct reporters with non-dismissed flags, every owner and the admins/moderators of the target's study get a `flag_threshold` notification (a user flag alerts owners only). |
| `GET /flags/my-flags`                                   | Own flags.                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `DELETE /flags/:id`                                     | Reporter (own) or admin (any). Not restriction-checked.                                                                                                                                                                                                                                                                                                                                                                    |
| `GET /flags`, `/flags/pending`, `/flags/status/:status` | Admin (RLS grants SELECT).                                                                                                                                                                                                                                                                                                                                                                                                 |
| `PATCH /flags/:id`                                      | Admin. `{ status: 'pending'\|'reviewed'\|'dismissed' }`; resolving records `reviewed_by`/`reviewed_at`, returning to pending clears them, and dismissing clears `is_flagged` once no pending flag remains.                                                                                                                                                                                                                 |

`is_flagged` is written with the service-role client (`authenticated` has no UPDATE grant);
flagged content stays visible.

## Restrictions

`profile_restrictions` is one row per profile, active while `expires_at` is null or later;
`is_restricted()` ignores expired rows. History lives in `profile_restriction_history`, and
the ladder counts rows not lifted early: two weeks, one calendar month, then permanent.

| Route                                                  | Access                                                                                                                                                                                     |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `GET /restrictions`                                    | Admin. Active and lapsed rows with `active`.                                                                                                                                               |
| `GET /restrictions/me`                                 | Any user. Own active restriction or `null`. 15 requests per minute.                                                                                                                        |
| `GET /restrictions/lifted`                             | Admin. Early lifts, newest first, with names.                                                                                                                                              |
| `GET /restrictions/lookup?username=` \| `?profile_id=` | Admin. Exactly one parameter. Minimal profile, ladder-eligible count, active restriction.                                                                                                  |
| `GET /restrictions/:profileId`                         | Owner or admin by RLS; anyone else silently gets `null`.                                                                                                                                   |
| `PUT /restrictions/:profileId`                         | Admin. `{ reason (3–500 chars) }`. `400` for an admin target (self included). An active row only updates its reason; otherwise it replaces a lapsed row by the ladder and inserts history. |
| `DELETE /restrictions/:profileId`                      | Admin. Lifts; an active lift marks the latest history row `lifted_early_at`, a lapsed removal changes nothing. `404` if absent.                                                            |

## Download review

Admin-only reads over the append-only `download_events`; RLS shows a user only their own
rows, so these use the service-role client after an explicit role check, plus
`requireAdminAccess`.

- Both lists aggregate the newest 2,000 events and repeat `scanned`, `total_events` and
  `window`. `limit` (default 10, max 50), `offset`, `sort`, `order` (`asc`/`desc`), `search`
  → `{ items, total, offset, limit, scanned, total_events, window }`, with `total` the
  matching rows before paging. An unknown sort column, order or target is `400`.
- `?study=<id>` scopes all three routes to one study; without it a non-owner has no scope
  and gets `403`, while an owner sees every study. The script drill-down derives the study
  from the script.

| Route                                                   | Notes                                                                                                                                              |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /download-review/accounts`                         | Accounts by counted downloads. `sort`: `events`, `scripts`, `ip_addresses`, `devices`, `last_download_at`. `search` on username or full name.      |
| `GET /download-review/scripts`                          | Scripts by counted downloads. `sort`: `events`, `accounts`, `anonymous`, `ip_addresses`, `devices`, `last_download_at`. `search` on title or slug. |
| `GET /download-review/events?script_id=` \| `?user_id=` | The events behind one script or account, newest first; `limit` 20 (max 100) with `offset` → `{ events, total, offset, limit }`.                    |

## Profiles

Public: `/profiles/username/:username`, `/profiles/:id`, `/profiles/:id/stats` — cached by
the frontend and invalidated by the profile/selection/favorite/script/vote tags.

Authenticated: `GET`/`PATCH`/`DELETE /profiles/me`.

`GET /profiles` is **admin only** — the user manager's listing. `limit` 1–100 (20),
`offset`, `search` (username or full name, case-insensitive; reserved `or` grammar
characters are replaced and `ilike` wildcards stripped so a term can only narrow),
`role`, `sort` (`created_at`, `updated_at`, `username`, `full_name`, `role`), `order` →
`AdminProfilesListResponse` `{ profiles, total, limit, offset }`, each row with
`id, username, full_name, role, avatar_url, created_at, updated_at`, its `subjects`
(`subject_id, status, updated_at`) and the names of its selected faculties and studies.
`400` outside those lists, `401` without a session, `403` for a non-admin. The `profiles`
SELECT policy is public, so this route's check is the only gate.

Preferences: `GET`/`PATCH /profiles/me/preferences`, own row, 15 requests per minute. A
missing row reads `{}`. PATCH `{ preferences }` merges into the v1 shape
`{ version: 1, notifications: { toasts: boolean, achievements: 'show'|'hide' } }`; unknown
keys and invalid values are rejected. Restriction and moderation notices are not
configurable.

`PATCH /profiles/me` takes `ProfileUpdateRequest` `{ username, full_name?,
selected_faculty_ids?, selected_study_ids? }`. Both strings use the registration rules and
are stored trimmed; the arrays replace the selections (diffed, inserts before deletes,
errors checked) and are not restriction-checked. Username uniqueness uses the shared
`isUsernameTaken`, excluding the profile being edited, with `profiles_username_key`
(`23505`) as the race backstop. Returns `ProfileUpdateResponse`.

| Status | When                                                                                     |
| ------ | ---------------------------------------------------------------------------------------- |
| `400`  | Invalid JSON, invalid username/full name, non-array ids                                  |
| `403`  | RLS violation (`42501`)                                                                  |
| `404`  | Profile not found                                                                        |
| `409`  | Username taken (`{ error, field: 'username' }`) or an unknown faculty/study id (`23503`) |

The row and both selection lists are written by `sync_profile_selections`, one transaction:
a bad faculty or study id rolls the username back with it. The function runs as the caller,
so RLS and the `(username, full_name)` column grant still apply.

Avatars are two calls and the only way `profiles.avatar_url` is written:

| Route                                 | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST /profiles/me/avatar/upload-url` | `{ name, size }`. Extension against `AVATAR_FILE_TYPES` (`jpg`, `jpeg`, `png`, `webp`) and size against `AVATAR_MAX_UPLOAD_BYTES` (10 MB) → `{ success, upload: { stagingKey, url, contentType } }`. `400` unsupported/oversized; `429` at 20 requests per 10 minutes across both avatar calls.                                                                                                                                                                                                                                                                                                                                                       |
| `POST /profiles/me/avatar`            | `{ stagingKey }`. Runs the image through the optimizer's avatar profile (EXIF-oriented, square crop around the most interesting region, `AVATAR_SIZE_PX` 320, metadata stripped, WebP) into `R2_BUCKET` at `avatars/{userId}.webp`, then stores `${R2_PUBLIC_URL}/avatars/{userId}.webp?v={version}`. `400` for a key that is not the caller's or a non-avatar extension; `413` over `AVATAR_MAX_STORED_BYTES` (200 KB, aiming for 100 KB); `429`; `503` without `R2_PUBLIC_URL` or with the optimizer configured but unavailable (never stored uncropped); `500` otherwise. A rejection leaves the previous avatar and removes only the staged copy. |

Avatars live in the script bucket under `avatars/`, which needs a public domain and exposes
every object by key (script keys stay random UUIDs, but a leaked one no longer expires).
The key is fixed per user, so `?v=` is what refreshes browser and CDN caches; account
deletion removes the key. The row is written with the service-role client — `authenticated`
has no INSERT/UPDATE grant on `avatar_url`
(`20261029120000_revoke_profile_avatar_url_write.sql`) — and the client renders it with
`unoptimized`, so the column grant is the boundary, not the host allow-list. Limits live in
`shared/config/avatar.ts`; the routes re-check them.

Admin: `GET /profiles/:id/admin`, `PATCH /profiles/:id`, `DELETE /profiles/:id` (session
**and** unlock). The profile row goes through the session client, but
`profile_faculties`/`profile_studies` have no admin RLS path, so `PATCH` writes the row and
selections with the service-role client after the admin check; its body matches `/me`, so
the form sends the whole pair.

- `GET /profiles/:id/admin` → `AdminProfileDetail` `{ profile, counts: { scripts, comments },
  faculties, studies }`; `404` for an unknown id.
- `DELETE /profiles/:id` removes the profile, its avatar and the Supabase Auth login (without
  which the account could sign in with no profile). The profile goes first on the session
  client; if the login deletion fails afterwards the row stays deleted, the failure is
  logged and the response says so (`{ success: true, auth_user_deleted: false }`). `400` when
  an admin targets themselves, `404` for an unknown id.
- `PATCH /admin/profiles/:id/role` `{ role: 'student'|'moderator'|'admin' }` lives on the
  admin surface (unlock + admin session, else `403`; `404` unknown id) and is the one profile
  write on the service-role client: `authenticated` holds column UPDATE on
  `(username, full_name)` only, and the profiles UPDATE policy lets a caller update their own
  row, so a session-client role write would be a self-promotion path. The first admin has no
  route — promote it in the database.

## Profile selections

Own-resource, authenticated, `profile_id = auth.uid()` RLS, session client.

| Resource  | List                     | Get           | Add                            | Remove               |
| --------- | ------------------------ | ------------- | ------------------------------ | -------------------- |
| Faculties | `GET /profile-faculties` | `/:facultyId` | `POST /:facultyId` (no body)   | `DELETE /:facultyId` |
| Studies   | `GET /profile-studies`   | `/:studyId`   | `POST /:studyId` (no body)     | `DELETE /:studyId`   |
| Subjects  | `GET /profile-subjects`  | `/:subjectId` | `PUT /:subjectId` `{ status }` | `DELETE /:subjectId` |

Subjects use `PUT` because the status (`completed` | `currently_taking`) is a value.

## Calendar notes

Local-first notes; these routes are the only place the database is involved. Authenticated,
own resource, session client.

| Route                            | Notes                                                                                                                                                 |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /calendar-notes`            | `{ notes }`, tombstones included. One sync.                                                                                                           |
| `POST /calendar-notes/sync`      | `{ since, notes }` → `{ notes, syncedAt }` with the merged copy; a stored note newer than the incoming one is kept.                                   |
| `POST /calendar-notes/auto-sync` | Same body and merge, at most once per profile per 7 days: `{ notes, syncedAt, nextAutoSyncAt }`, with `notes` and `syncedAt` null when it is not due. |

- A note carries `studyId` (a `studies.id`): it belongs to the calendar it was written on,
  so the same day holds different notes in two studies. A note without a valid `studyId` is
  invalid, like any other malformed note.
- Three notes per study's day, checked against the merged result before writing (`400`).
- A deletion is a tombstone (`deleted: true`), not a row removal.
- Allowance: 3 per 30 minutes and 12 per day per profile, both directions; an automatic push
  spends one too (`429` with the window named).
- A restricted account cannot push (`403`); reading still works.
- A payload whose notes all fail validation is `400`, not an empty sync.
- Limits are per warm instance, like the other in-memory limiters. The automatic push's week is
  not: `profile_calendar_notes_syncs` (one row per profile, written only by
  `claim_calendar_notes_auto_sync`) holds it. The claim runs after the write, so a failed write
  never spends the week, and a browser that asks early is answered without spending a slot.

## Favorites

Authenticated, own resource: `GET /favorites`, `GET /favorites/:scriptId`,
`POST /favorites/:scriptId` (idempotent), `DELETE /favorites/:scriptId`. Not
restriction-checked. Creating is study-scoped (`403` for another study, `404` unknown
script), removing is not. Either revalidates the public-profile tags.

## Votes

| Route                                                          | Auth     | Notes                                                                                                                                                                                                                                                                                                                                                                                      |
| -------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `GET /votes`, `/votes/script/:scriptId`, `/votes/user/:userId` | Public   | —                                                                                                                                                                                                                                                                                                                                                                                          |
| `GET /votes/script/:scriptId/stats`                            | Public   | `{ upvotes, score }`                                                                                                                                                                                                                                                                                                                                                                       |
| `GET /votes/my-votes`, `/votes/script/:scriptId/my-vote`       | Required | —                                                                                                                                                                                                                                                                                                                                                                                          |
| `POST /votes/:scriptId`                                        | Required | Toggle. Authors cannot vote for their own script but may remove an existing vote; `vote_score` clamps at zero. Runs through the atomic `toggle_vote` RPC (`security definer`, keyed on `auth.uid()`), so it cannot race or take an arbitrary delta. Casting is rejected if restricted and is study-scoped (`403`; unknown script `404`); removing is not. Returns `{ voted, vote_score }`. |

## Ratings

`rating_types` (`target_type: 'professor'|'subject'`) is a shared, public-read lookup;
one rating per user per type per entity, and posting again updates it.

- Types: `GET /ratings/types` (optional `?target_type=`), `GET /ratings/types/:id`,
  `POST /ratings/types` `{ id, target_type, labels }` (`id` matches `^[a-z0-9_]{2,40}$`),
  `PATCH /ratings/types/:id` `{ labels }`, `DELETE /ratings/types/:id` (`409` while a rating
  references it). Writes are owner-gated by RLS, with no service secret.
- `labels` is `{ en?, mk? }`, every present language 2–60 characters and at least one filled
  (`isLocalizedRatingLabel`).

| Route                                                   | Auth                                                                                                                                                                                                        |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /ratings/{professor,subject}/:id`                  | Public                                                                                                                                                                                                      |
| `GET /ratings/{professor,subject}/:id/stats`            | Public — `{ rating_type_id, average, count }[]`                                                                                                                                                             |
| `GET /ratings/{professor,subject}/:id/my-ratings`       | Required                                                                                                                                                                                                    |
| `POST /ratings/{professor,subject}/:id`                 | Required — `{ rating_type_id, score (1–5) }`. Rejected if restricted or if the type does not match the target. Subject ratings are study-scoped (`403`; unknown subject `404`); professor ratings are open. |
| `DELETE /ratings/{professor,subject}/:id/:ratingTypeId` | Required, not restriction-checked                                                                                                                                                                           |

`POST` errors: `403` restricted, `409` (`23503`) unknown professor/subject, `400` invalid
body or an unknown/mismatched type (the trigger raises `P0001` before the FK). Stats are
aggregated in the route, so only types with a rating appear. The frontend caches the
criteria list and each stats entry under `RATING_CACHE_TAGS` with no expiry: a type mutation
revalidates `ratings:types`, a rating write revalidates `ratings:professor:<id>` or
`ratings:subject:<id>`, and the widget reads both fresh.

## Notifications

Own resource, authenticated, 15 requests per minute across all notification routes.
System-generated — the only create path is the announcement below. Types are open-ended, so
a new kind needs no migration; the payload lives in `data`. Moderation notifications use the
session client under the admin INSERT policy; achievement and flag-threshold ones use the
service role.

`study_id` (nullable) names the study a content notification belongs to; it is not a
permission key but decides the link (`/study/<site_slug>/scripts/<slug>`) and the tray's
scope. Account-wide ones leave it null.

| Route                             | Notes                                                               |
| --------------------------------- | ------------------------------------------------------------------- |
| `GET /notifications`              | Own rows, optional `?is_read`; each carries `study: { site_slug }`. |
| `GET /notifications/unread-count` | `{ count }`.                                                        |
| `PATCH /notifications/read-all`   | Marks all read.                                                     |
| `PATCH /notifications/:id`        | `{ is_read }`; `400` for a non-boolean, `404` if not the caller's.  |
| `DELETE /notifications/:id`       | Deletes one.                                                        |
| `POST /admin/notifications`       | Admin, unlocked. `{ title, body?, studyId? }` — see below.          |

Announcements: `title` 1–200 characters, `body` ≤1000 (the table's CHECK limits), else
`400`; `413` over the 4 KiB body cap; `429` after ten broadcasts per admin per hour.
Omitted/`null` `studyId` addresses every profile; a study id addresses that study's students
(`profile_studies`), its admins and moderators (`study_roles`) and every owner, stamping the
rows with the study. An owner may address everyone or any study, a study admin only their
own, which the INSERT policy also enforces. Recipient ids are read in pages with the service
client and written in chunks with the session client, so RLS stays the boundary. Response
`{ success: true, recipients }`. A broadcast cannot be recalled; each recipient can dismiss
their own.

Achievements are rows: a definition is `metric` + `threshold` on the `profile` entity type,
optionally scoped to one study. After a relevant mutation the backend recomputes the
profile's value and awards + notifies (`type: 'achievement_earned'`) for any newly crossed
threshold — idempotent, service-role, never failing the triggering request.

| Metric                   | Recomputed after                               | Credited to                                             |
| ------------------------ | ---------------------------------------------- | ------------------------------------------------------- |
| `scripts_uploaded`       | `POST /scripts`                                | The uploader                                            |
| `comments_posted`        | `POST /comments`, `POST /comments/:id/replies` | The author                                              |
| `total_script_votes`     | `POST /votes/:scriptId` (either direction)     | The script's author                                     |
| `total_script_downloads` | `POST /scripts/:id/download`                   | The script's author (their own download is not counted) |

A global definition (`study_id` null) counts platform-wide; a study definition counts inside
its study; a mutation inside a study evaluates both groups, one outside only the global ones.

`GET /achievement-definitions` is public (full rows, ordered by metric then threshold).
`POST`/`PATCH`/`DELETE /achievement-definitions[/:id]` are admin + unlock. Body:
`AchievementDefinitionInput` — `id` (create only, immutable, `^[a-z0-9_]{2,60}$`), `metric`,
`threshold` (whole, >0), `rarity` (`common` | `uncommon` | `rare` | `epic` | `legendary`),
`studyId` (a study id or null; unknown is `400`). Title and description are **not** input:
they live in `ACHIEVEMENTS_STRINGS_PACK.copy` (`shared/strings/achievements-strings.ts`),
`POST` rejects an id with no entry there (`400`), the API copies them onto the row and every
`PATCH` re-syncs them, so the row's copy is only a snapshot. Errors: `400` validation, `403`
not an admin, `409` duplicate id or a delete blocked by earned awards. Awards are permanent
and never recomputed: an edited rarity only changes rendering, a new or lowered definition
awards on the next qualifying action with no backfill, and a definition nobody holds can be
deleted. Entity type is always `profile` and never sent by a client.

## Client access patterns

Every route uses either the caller's session client or the service-role client. Backwards,
a legitimate request fails silently or an intended check is bypassed.

**Session client** where RLS already grants the caller — their own resource
(`author_id`/`user_id`/`profile_id = auth.uid()`) or an `is_owner()`-gated policy. That is
nearly everything: admin script/comment/profile actions, all own-resource endpoints, flags,
rating types, professor/subject ratings, profile selections, notifications, restrictions,
preferences and restriction history.

**Service role** only where no RLS path exists for the caller:

- Catalog and junction tables (`universities` → `professor_studies`) — read-only by RLS for
  every role.
- `POST /scripts/:id/download`, and `GET /download-review/*` (RLS shows only one's own
  `download_events`).
- Awarding achievements and creating flag-threshold alerts, plus writing `is_flagged`.
- `POST /profiles/me/avatar` writing `profiles.avatar_url`, and `PATCH /admin/profiles/:id/role`.

## Authentication

The Supabase session cookie from `/api/auth/login` or `/api/auth/callback`; no Bearer path.
`authMiddleware` verifies it and answers `401`. `SessionUser`
(`shared/types/auth.types.ts`) is the app-shaped user — `{ id, email, username, role,
subjects: [{ subject_id, status }], selected_faculty_ids, selected_study_ids }` — returned
by login, callback and session alike.

| Route                 | Auth     | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| --------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST /auth/register` | Public   | `{ email, password, username, full_name }`, all required. No academic profile: it is per study and the client writes each stored setup through the study endpoints afterwards (`next/lib/study-setup-sync.ts`). `409` `{ error, field: 'username'\|'email' }` when taken, `400` for a disposable domain, `429` per IP on repeats. The profile row is ensured server-side, not left to the trigger. `emailRedirectTo` is `{origin}/auth/callback`. |
| `POST /auth/login`    | Public   | `{ email, password }` → `{ success, user, session }`. `401` bad credentials, `429` after repeated failures per IP.                                                                                                                                                                                                                                                                                                                                |
| `POST /auth/callback` | Public   | `{ access_token, refresh_token }` from the confirmation redirect (implicit flow, no PKCE; the client reads them from the URL fragment). `400` missing, `401` invalid. Same shape as login.                                                                                                                                                                                                                                                        |
| `POST /auth/logout`   | Required | Signs out and clears the cookie.                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `GET /auth/session`   | Public   | `{ user, session }`; refreshes only when the token expires within 60 s, clears invalid sessions, and returns `role` plus `study_roles` for the admin surface.                                                                                                                                                                                                                                                                                     |

## Roles and access control

- `profiles.role` is `student` or `owner`; an owner is org-level (every study, catalog table
  and queue). `study_roles` (`profile_id`, `study_id`, `role`) holds `admin` or `moderator`
  per study; a study admin passes every moderator check, a moderator does not pass admin
  checks. Usernames are unique org-wide and bans are org-wide.
- Predicates: `is_owner(uid)`, `has_study_role(uid, study_id, need)` (`admin` satisfies
  `moderator`), `is_moderator(uid)` (holds any study role; unused by policies).
- Study-scoped policies (`scripts`, `comments`, `flags`, `script_files`,
  `professor_studies`) read `is_owner(auth.uid()) or has_study_role(auth.uid(), <study>, …)`,
  taking the study from the row (scripts, professor assignments), the script (comments,
  files) or `flag_study_id(…)`. A flag or comment with no script belongs to no study and is
  owner-only. Achievement definitions, rating types, restrictions and the profile admin
  branch stay owner-only; a study admin may announce inside their study.
- Gates: catalog routes need the access token regardless of Supabase role; `/api/admin/*`
  needs the session and the unlock (`GET /admin/studies` lists what the caller may act on,
  `PUT`/`DELETE /admin/profiles/:id/study-roles[/:studyId]` are owner-only); routes check
  roles for a clean `403` but RLS is the boundary.
- **Restricted users** cannot create or update scripts, comments, reactions/likes, flags,
  votes or ratings, but can remove their own content; favorites are exempt.
- **Writes are study-scoped**: creating a script, commenting on or replying to one, voting,
  rating a subject and favoriting all resolve the target's `study_id` and require
  `profile_studies` membership, a study role or ownership (`../lib/study-access.ts`), else
  `403 { error: "Join this study before contributing to it", code: "study_join_required" }`
  — the client uses `code` to offer study setup, so it never shows a membership refusal as
  an account restriction. Professor comments and professor ratings carry no study. This
  check is in the route, not in RLS.
- The flag queue accepts `?study=<id>`; a flag without a study appears only unfiltered.

## Errors

```json
{ "error": "Error message description" }
```

`400` validation · `401` unauthenticated · `403` forbidden/restricted · `404` not found ·
`409` conflict (unique/FK, or a catalog delete blocked by dependents) · `429` too many
requests · `500` server error. Raw Postgres details never reach the client.

## Notes

- **Votes:** one `+1` per user per script, toggle, clamped at zero. No downvotes exist.
- **Files:** a script has one or more immutable `script_files` rows ordered by `position`;
  `file_name` is the kebab-case name without extension, `null` for older uploads (the UI
  falls back to a positional label). Type checks run at the API and the real signature at
  finalize; the database never sees bytes.
- **Portable Text:** `scripts.title`, `scripts.description` and `comments.content` are
  `jsonb` block arrays. Script content accepts text blocks with spans, known
  styles/decorators, configured lists and alignments; comments accept normal text blocks
  with inline decorators only. Unsupported types, marks, annotations and extra fields are
  `400`. Titles ≤2 KiB per language, descriptions ≤50 KiB per language, comments ≥3
  non-whitespace characters and ≤10 KiB. Postgres also enforces JSON size caps.
- **Per-language script text:** `title` and `description` are objects keyed by language
  (`{ "en": <PT>, "mk": <PT> }`), any subset of `LOCALES`, at least one filled; each present
  language is validated on its own, and an unknown key or a bare array is `400`. The API
  returns the map as stored and the caller resolves the reader's language
  (`pickLocalizedPortableText`, requested → default → any filled), so one cached read serves
  both. The slug is minted once from the default language, or the first filled one. Search
  matches every language.
