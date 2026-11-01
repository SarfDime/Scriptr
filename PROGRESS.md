# Scriptr: Progress & Todos

What's built and what's outstanding. See `ARCHITECTURE.md` for the current
system design. This is the single source of truth for planned work and ideas.

Last reconciled: 2026-11-01.

In-code `TODO` and `Deferred:` comments have been removed from the source; the
work they described is tracked below with a link to the code it belonged to.
Sections list what is done in a few lines (the code and `ARCHITECTURE.md` are
the detail) and then what is left. Tags: **[bug]**, **[decision]** (needs a
call before anyone builds it).

> **Standing rule:** any Postgres or Sanity schema change is followed by
> `corepack pnpm gen:api-types` / `corepack pnpm sanity:typegen` and a clean
> `corepack pnpm check-types` before it counts as done.

## Backend API

### Done

- Academic catalog (University → Faculty → Study → Subject, professors,
  junction tables, validation, dependency checks, internal sync). University
  `r2_bucket_id` is validated and persisted through the internal routes, which
  are the only university write path.
- Scripts: Portable Text metadata, multi-file uploads, subject/professor
  validation, hierarchy resolution, author/admin management, fuzzy search,
  individual file removal.
- Script reads are public and unscoped: the selected-faculty filter
  (`getSelectedFacultyScope`/`applySelectedFacultyScope`) and the detail
  route's 404 for out-of-scope faculties are gone, because studies are the
  real academic scope. A signed-in viewer sees the same catalogue as a guest.
- Comments and moderation: threads, replies, pagination, reactions, likes,
  flags, author/admin moderation, rate limits, Portable Text validation,
  engagement aggregation.
- Profiles and selections, votes, favorites, ratings, notifications,
  achievement awarding, user restrictions.
- Auth: registration, login, logout, session refresh, email-confirmation
  callback, cookie sessions, register/login hardening, admin-only access.
- Tagged Data Cache entries with mutation-driven revalidation for public
  scripts and profiles, plus a 60-second revalidate safety net so a webhook
  that is unset, rejected or unreachable cannot freeze a feed forever. The
  revalidation helper now logs missing configuration, the default development
  secret in production, and any non-2xx response instead of failing silently.
- Production revalidation works again. `scriptr.uk` is proxied by Cloudflare,
  which never forwarded the API's server-to-server webhook to Vercel, so every
  mutation left the cache stale and the homepage kept listing deleted scripts.
  `NEXT_REVALIDATE_URL` on the API project now points at the web project's
  Vercel alias (`https://scriptr-web-team-slug.vercel.app/api/revalidate`),
  which is DNS-only; the revalidation secret was rotated on both projects
  (it had been the published `.env.example` value). Verified end to end: a
  create and a delete both expire the homepage feed immediately.
- Typed route responses in `shared/types/`, consumed by the frontend and Studio.
- Request logging is skipped when `NODE_ENV` is `production`
  ([`hono/src/index.ts`](hono/src/index.ts)).
- Decided 2026-10-13: `faculties_university_id_fkey` stays `ON DELETE CASCADE`.
- `PATCH /scripts/:id` maps a restricted author's zero-row update (RLS
  `USING` includes `NOT is_restricted()`, so no `42501` is raised) to a `403`
  instead of a generic `500`. Update/delete/file-removal responses are typed in
  `shared/types/scripts.types.ts`.
- `authenticated` has **column-level** `UPDATE` on `scripts` (not table-wide, so
  `vote_score`, `download_count`, `is_flagged`, `author_id`, `subject_id` and
  `professor_id` stay locked): exactly `title`, `description`,
  `additional_reading` and `updated_at`, matching what `PATCH /scripts/:id`
  writes. Migrations
  `20261017211328_grant_authenticated_update_script_content_columns.sql` and
  `20261017212518_revoke_authenticated_update_script_subject_professor.sql`;
  any new column the route writes needs its own grant, otherwise it fails with
  `42501` (a `500`, deliberately not mapped to `403`).
- Removing a script file renumbers the remaining files' `position` (service-role
  client, since `script_files` has no UPDATE policy), so "File N" labels never
  skip.
- `POST /api/revalidate` expires tags with `revalidateTag(tag, { expire: 0 })`.
  The previous `'max'` profile is stale-while-revalidate, which served the old
  data (e.g. a deleted script) on the first request after a mutation.
- `script_files.file_name` (nullable, 1 to 255 chars; migration
  `20261018131652_add_script_files_file_name.sql`) keeps the uploaded name.
  `POST /file-ops/finalize` returns it (derived from the original file name the
  client sends with each staging key) lowercased, accent-stripped, kebab-cased
  and without its extension (`toStoredFileName` in
  `shared/utils/file-name.utils.ts`), or `null` when nothing usable is left;
  `isScriptFileInput` rejects any other shape. Files from before this have no
  recoverable name and show the positional label.
- Downloads save to disk under the stored name: `GET /file-ops/get-file/*`
  with `?download=1` signs a URL with `Content-Disposition: attachment;
  filename="<file_name>.<ext>"` (plain `attachment` when there is no valid
  name); previews use the plain URL and stay inline. The download button
  navigates the current tab to that URL instead of opening a new one.
- `POST /scripts/:id/files` (author or admin, restriction-checked in RLS)
  appends already-uploaded files to an existing script and removes the R2
  objects again on any failure.
- Decided 2026-10-15: only `admin` moderates (delete scripts/comments, resolve
  flags, rating types). `moderator` gets no moderation tools in
  the API, RLS or UI; any future moderator role is limited to notifications
  (see **Deferred (Do Last)**). Routes already gate on `isAdmin`.
- Profile API: `PATCH /profiles/me` and `/profiles/:id` validate the body,
  store trimmed values, return a typed response (`ProfileUpdateResponse`), map
  `23505`/`23503`/`42501` to `409`/`409`/`403` (and a missing profile to
  `404`), and check every faculty/study write (diffed, inserts before
  deletes; admin edits of another user use the service-role client, since the
  selection tables have no admin RLS path). Username uniqueness runs the same
  pre-check as register (`hono/src/lib/username.ts`, shared by both). Favorites
  are public by design (`script_favorites` SELECT is `true`) and are read on
  the session client; a failed favorites read is a `500`, not an empty list.
  `PUT /profile-subjects/:subjectId` now revalidates the public-profile tags
  (it was the `GET` list that did, by mistake).

### Todo

Nothing open that blocks the frontend. Achievement-definition CRUD and
moderator notifications are deferred to the end (see **Deferred (Do Last)**).

- **Review `anon` table privileges (found 2026-10-17).** `anon` holds
  table-wide `INSERT`/`UPDATE`/`DELETE`/`TRUNCATE` on the `public` tables
  checked so far (`scripts`, `script_files`, `comments`, `profile_subjects`).
  That is Supabase's default grant, and RLS blocks the row-level writes
  (`auth.uid()` is null for `anon`). `TRUNCATE` is not subject to RLS but is not
  reachable through PostgREST. It is still more privilege than the API ever
  needs, so review and revoke what `anon` doesn't use. The same review should
  cover `authenticated`'s table-wide `UPDATE` on `script_files`, which has no
  UPDATE policy and is blocked only by RLS (the service-role client does the
  position renumbering).

## R2 / File Storage

### Done

- Validated multi-file uploads, deterministic keys, per-university buckets,
  recorded storage metadata, signed preview/download.
- Best-effort cleanup after failed uploads, failed script creation and deleted
  scripts.
- Objects are stored with `Cache-Control: public, max-age=31536000, immutable`
  (safe: every key contains a random UUID and is never overwritten;
  [`hono/src/routes/file-ops.ts`](hono/src/routes/file-ops.ts)).
- `R2_ENDPOINT` had the bucket appended (`…/scriptr`), which made the SDK store
  every object under a `scriptr/` prefix while `script_files.file_url` kept the
  unprefixed key — so public URLs and the `staging/` lifecycle rule never
  matched. Fixed in `hono/.env` (bare host) and the 7 existing objects were
  re-keyed: copied to their unprefixed keys with size and content type
  verified, old keys deleted, then read back through a signed URL. The Vercel
  project needs the same check — if it holds objects written under the prefix,
  re-key them before changing that env, or they become unreachable.
- Direct-to-R2 upload flow: `POST /file-ops/upload-urls` → browser PUT to a
  `staging/` prefix → `POST /file-ops/finalize`, so file bytes bypass Vercel's
  4.5 MB body limit. Stored files are capped at 3.5 MB (aiming for 3 MB), content is checked
  against the real file signature, and finalize is all-or-nothing. The
  optimizer is a separate service (an in-process stand-in that only validates
  runs when none is configured) behind
  the contract in
  [`file-upload.types.ts`](shared/types/file-upload.types.ts).
- Legacy `.doc`/`.xls` uploads dropped (code and migration
  `20261016120000_drop_legacy_office_file_types.sql`).
- `POST /scripts` only accepts files whose bucket and key lie inside the
  caller's own storage scope (previously it trusted client-supplied keys and
  deleted them on failure).
- Shared in-memory rate limiter
  ([`rate-limit.ts`](hono/src/lib/rate-limit.ts)) now used by comments, auth, and
  uploads (`upload-urls` 30 and `finalize` 15 per 10 minutes per user).
- API side of the optimizer service is built: an HMAC-signed HTTP client that
  fails closed with `503`, selected by `OPTIMIZER_URL`/`OPTIMIZER_SECRET`, with
  the in-process stand-in used when neither is set. Shrinkable types may be
  uploaded up to 20 MB (the stand-in rejects anything over 3.5 MB at finalize).
  The web client waits up to 120 s for finalize.
- `POST /scripts` verifies its file list instead of trusting it: scope,
  existence in R2, and the size R2 reports (an oversize file is rejected with
  `413` and removed).
- Stored-size limits: a hard cap of 3.5 MB and a 3 MB target
  (`TARGET_STORED_FILE_BYTES`, for the optimizer once it's built).
- Default bucket has a CORS rule for browser `PUT`s and a one-day lifecycle
  rule on `staging/`, and R2 was verified to
  enforce the signed `Content-Length` on presigned PUTs (a body that doesn't
  match the declared size gets `403 SignatureDoesNotMatch`).
- Unit tests run with `corepack pnpm test` (rate limiter, file signatures,
  storage scope, R2 sizing, optimizer client and signing, and the optimizer
  service: auth, pipeline, image and PDF logic, concurrency limiter). Ghostscript
  and R2 are faked in the tests.
- The optimizer service's `/optimize` is implemented
  ([`optimizer/`](optimizer/README.md)): it reads the staged object, checks its
  real file signature, shrinks it, enforces the 3.5 MB hard cap, writes the
  final object (immutable `Cache-Control`) and removes the staged copy. Images
  become WebP via sharp (EXIF-oriented, metadata stripped, at most 2400 px, an
  adaptive quality and size ladder aiming for 3 MB). PDFs over 3 MB go through
  Ghostscript at 150, 120, 96 then 72 dpi and stop at the first result that fits;
  a 200 dpi step leads the ladder only when the uploaded file is under 10 MB,
  since a bigger document rarely has the headroom and the pass would be wasted. Files also stop at the 3.5 MB cap rather than grinding down to the
  smallest one; smaller PDFs are
  stored as uploaded. 72 dpi is the floor and a file that cannot fit there is
  rejected rather than quietly destroyed. Embedded XMP is stripped before
  Ghostscript runs (`optimizer/src/pdf-metadata.ts`, pdf-lib bundled), because
  Ghostscript re-emits it rather than dropping it. Colour and grey are
  downsampled with `/Bicubic` (not `/Average`), 1-bit mono images are kept at
  300 dpi so text stays crisp, and every step strips document XMP, the Info
  dates and the file ID and writes the object table as compressed streams.
  Office files and Markdown only have to fit the cap. Concurrency is limited
  and each file has an 80 s deadline, under the API's 90 s timeout. The
  file-signature and R2 "not found" checks now live in `shared/` for both the
  API and the service.
- **PDF compression is understood, and has a ceiling that is not about images**
  (`optimizer/src/pdf-bloat.ts`). Analysed on a real 15.7 MB, 83-page InDesign
  manual: 73% of it (11.4 MB) is XMP metadata — 484 packets, one per embedded
  Illustrator asset — while embedded rasters are only 10% (1.6 MB, 2562 of them,
  nearly all tiny icons). Ghostscript does collapse that metadata to 0.89 MB,
  but `/ebook` still bottoms out at 4.06 MB (3.86x) and the 50 dpi step only
  reaches 3.48 MB (4.50x) — a 3% gain for destroying every image. That is the
  "3.5x ceiling": after processing, content streams (2.49 MB) and the re-emitted
  XMP packets (0.89 MB) dominate, and neither is a downsampling target. A
  rejection now says so instead of implying another step would help. Meeting the
  3 MB target on such a file would need a PDF rewriter to drop those packets,
  which the service deliberately does not carry (only `sharp` and `gs`). Quality
  was measured, not assumed: `/Bicubic` beats `/Average` on mean absolute error
  against a 200 dpi render of the original on every page tested (2.64 -> 2.53,
  0.36 -> 0.28, 1.28 -> 1.26) and also came out smaller.
- **PDF compression is a resolution ladder, not a preset ladder.** The presets
  jump from about 150 dpi to about 72, which overshoots on image-heavy files: on
  a 24-page 400 dpi scan built for the test, 150 dpi was 3.70 MB (over the cap),
  120 dpi 2.74 MB (fits), 72 dpi 1.29 MB. The old ladder therefore stored 1.29 MB
  at 72 dpi; the new one stores 2.74 MB at 120 dpi, which measured **30% closer to
  the original** (MAE 5.26 vs 7.56) with edge sharpness fully restored (47.3 vs
  43.9 against a 47.3 reference). Why 72 is the floor: measured sharpness holds
  to about 96 dpi (47.0) then falls away — 84 dpi 45.8, 72 dpi 43.9, 50 dpi 38.5.
  The ladder is also shorter to exhaust and now falls back to the best result
  that fits when the deadline passes, instead of failing a file it could have
  stored.
- **Stripping XMP is worth more than every downsampling step combined.** On the
  same 15.7 MB InDesign manual, removing the 476 embedded XMP packets first took
  it to 4.0 MB with no image touched, and the file then fitted the cap at
  **200 dpi** (3.48 MB) where without stripping it could not fit above 72 dpi at
  all. That is the same size as the old 50 dpi result but at four times the
  linear resolution, and 3.5x faster (4.0s vs 14.0s over three Ghostscript runs):
  MAE against a 200 dpi render drops from 2.64/1.91/1.05 to 1.11/0.78/0.40 on
  pages 1/22/60, with sharpness essentially unchanged. Without the 200 dpi step
  the same file landed at 150 dpi / 3.09 MB (MAE 1.35/0.93/0.50), so the top
  step trades about 12% more bytes for a further ~17% cut in error.
  Verified visually lossless — renders of the stripped and unstripped files are
  pixel-identical — and best-effort: an encrypted, damaged or unreadable file
  comes back untouched and falls back to Ghostscript alone.
  Rejected on evidence: `exiftool -all=` removes nothing here (it only handles
  document-level metadata; all 475 packets survived and the file grew 235
  bytes), and pdf-lib needs the orphaned streams deleted too — dropping only the
  `/Metadata` keys saves 9 KB instead of 994 KB, since pdf-lib has no garbage
  collection.
- **PDF steps stop at the first result that fits the cap** rather than at the
  smallest. On the same manual, `/ebook` is 4.06 MB and `/screen` 3.61 MB — both
  over the 3.5 MB cap — and sweeping the downsample resolution shows why the last
  step is a dead end: 72 dpi is 3.76 MB, 65 dpi 3.72 MB, 60 dpi 3.70 MB, 55 dpi
  3.67 MB (still 3 KB over) and only 50 dpi fits, at 3.65 MB. Taking images from
  72 dpi to 50 dpi therefore buys 2.7% on a file whose rasters are a tenth of it.
  Two earlier ideas were tested and rejected on evidence: `-dJPEGQ` is overridden
  by the `/screen` preset (byte-identical output at 60/50/40/30), and a second
  Ghostscript pass does fit the cap at 72 dpi (3.67 MB) but is *worse* than the
  50 dpi path — re-encoding costs it 3.02 MAE against 2.53 — so it is not used.
- The optimizer builds into one bundled file (`corepack pnpm --filter
  @scriptr/optimizer build`, esbuild; only `sharp` stays external) and ships as a
  Docker image ([`optimizer/Dockerfile`](optimizer/Dockerfile): `node:24-trixie-slim`,
  Ghostscript 10.05, non-root). Built and run locally: sharp's native binary
  loads in the image, `GET /health` answers 200, an unsigned `/optimize` is
  `401`, a signed one with R2 unreachable is `500`, and a bad body is `400`.
  Ghostscript was only checked for presence (`gs --version`), not on PDFs —
  since exercised on a real 15.7 MB manual, see the PDF compression entry below.
- The optimizer logs one line per request, like the API, and one per file saying
  what was done and the result: sizes before and after, the step used, and every
  size tried with its timing, or why the file was rejected (see
  [`optimizer/README.md`](optimizer/README.md#logs)).
- Uploading, optimizing and creating a script run behind the app's own loading
  screen (`next/providers/loading/LoadingProvider.tsx`) rather than a dialog of
  its own: the jumping "Scriptr." wordmark, with the current stage underneath
  (uploading, optimizing, creating) and a standing line saying files may lose
  quality and what to do if one is still too large afterwards. The old
  `ProgressDialog` is gone. The loader is now a modal `<dialog>`, so it sits in
  the browser's top layer — it covers any dialog already open instead of
  painting behind it, and everything underneath is inert: nothing can be
  clicked, typed into or focused. `startTask(key, { message, hint })` is what
  puts the words under the logo. A `<dialog>` cannot be shown before hydration
  (it paints only once `showModal()` has run), so the HTML carries a plain
  stand-in element with the same classes for the first frame; a layout effect
  opens the dialog as modal and drops the stand-in in the same pre-paint commit,
  so the hand-over is invisible. The fade from opaque to translucent is animated
  on `:root` (`--ui-loading-veil`, registered with `@property`) rather than on
  the overlay itself, because an animation owned by either element restarts when
  the two swap; inherited from the document, one run covers both. It exists
  because the theme and simple mode are applied in an effect after paint. Nothing renders the `open` attribute, because
  React owning it while an effect toggled the dialog produced a hydration
  mismatch. The overlay sits at `z-100` (above `Z_INDEX.NAV_BAR` at `z-99`) for
  the frames before it is promoted, since a top-layer modal ignores z-index but
  a not-yet-modal dialog does not. The setup wizard waits for
  `isOverlayVisible` before auto-opening — not `isReady`, which is already true
  before the splash finishes leaving — because two modal dialogs both live in
  the top layer, the one shown last wins, and z-index cannot order them.
- **The optimizer is not run twice for the same file.** A file rejected as too
  large is remembered for the session (`next/lib/optimizer-attempts.ts`), and a
  retry is refused before a presigned URL or an R2 upload is even requested,
  with the reason in a toast. Whether a retry is worth running is calculated
  rather than guessed (`shared/utils/optimizer-retry.ts`): the ratio the
  optimizer actually achieved on the failed attempt is extrapolated to the cap
  with a 10% margin, so a 15 MB file that came out at 4.5 MB only allows a retry
  under ~10.5 MB. The API repeats the same calculation in `/file-ops/finalize`
  against the real staged object (`priorRejection` on the request), so a
  tampered frontend gains nothing — though a client that simply omits that field
  cannot be caught without storing attempts server-side, which this does not.
- A file still too large after optimizing is named in the toast with its size
  (`scan.pdf is still 4.2MB after optimizing (the limit is 3.5MB)`). Upload
  rejections now carry a message for the user (`UserFacingError`); every other
  failure still shows the generic "please try again".
- User avatars, on the same pipeline and in the same bucket as script files:
  `POST /profiles/me/avatar/upload-url` presigns a PUT into the `staging/`
  prefix, then `POST /profiles/me/avatar` crops the photo square at 320 px and
  converts it to WebP (≤200 KB, aiming for 100 KB; limits in
  [`avatar.ts`](shared/config/avatar.ts)) over `avatars/{userId}.webp`. One key
  per user, so a re-upload overwrites the picture; the stored URL is
  `${R2_PUBLIC_URL}/avatars/{userId}.webp?v={version}`, the version being what
  keeps caches from showing the old one. Account deletion removes that key.
  The URL is written with the service-role client because it is served to
  everyone (see below). The edit-profile dialog uploads through
  `uploadMyAvatar` ([`profile-api.ts`](next/lib/api/profile-api.ts)) and
  avatars render `unoptimized`, so the image optimizer's quota isn't spent on
  them.
- Both avatar migrations are **applied**: `20261016120000_drop_legacy_office_file_types`
  (live constraint is down to `pdf, jpg, jpeg, png, webp, md, docx, xlsx`) and
  `20261029120000_revoke_profile_avatar_url_write` (`authenticated` now has
  `UPDATE` only on `username`/`full_name`, no `INSERT`, no `avatar_url`;
  `service_role` keeps everything). Six older migrations that had already been
  applied out-of-band were marked applied with `supabase migration repair`, and
  the two were pushed through the Management API's SQL endpoint — `supabase db
  push` refuses until the 33 dashboard-applied migrations from June–October are
  added to the repo or pulled as a baseline (see Todo).
- The bucket's public read path is live: Cloudflare custom domain
  `files.scriptr.uk` with `r2.dev` off, a WAF rule allowing only `/avatars/*`,
  minimum TLS 1.2, and a Cache Rule on that path. Verified against real
  objects: `GET` is `MISS` → `HIT`, a different `?v=` is its own entry, and
  non-avatar paths return `403`. (`HEAD` always reports `DYNAMIC` — that is
  Cloudflare not reporting cache for HEAD, not a misconfiguration; probe with
  `GET`.)
- The profile card's avatar was 0×0: `Avatar` renders with `h-full
  aspect-square`, which needs a sized box, and `ProfileCard` was the one call
  site that didn't wrap it (the other four do). Now wrapped in an `h-20 w-20`
  box.
- The optimizer Docker image was rebuilt
  (`docker build -f optimizer/Dockerfile -t scriptr-optimizer .`) and run: an
  894 KB PNG became an 11 KB 320 px WebP through the container, the logs show
  the request and file lines, and Ghostscript 10.05.1 is present.
- The optimizer is **deployed to Cloud Run**: `optimizer` in `REDACTED_GCP_PROJECT`,
  `europe-west2`, at `https://optimizer-REDACTED_GCP_PROJECT_NUMBER.europe-west2.run.app`,
  1 vCPU / 2 GiB / concurrency 2 / 100 s timeout / 0–3 instances / startup CPU
  boost, running as a dedicated `optimizer-run` service account that can read
  only its three secrets, with an Artifact Registry cleanup policy (keep last
  2) and a $10/month budget alert at 50%/90%. Verified through the deployed
  service: `/health` 200, an unsigned `/optimize` 401, a signed avatar job
  (1.19 MB PNG → 16 KB WebP, 928 ms) and a 10 MB image-only PDF through
  Ghostscript (`gs /ebook`, 833 ms, 2.5 KB), with the result served from
  `files.scriptr.uk`. Both Vercel projects run in `fra1`, which pairs with the
  London region.
- `scriptr-api` now has `OPTIMIZER_URL`, `OPTIMIZER_SECRET` (the Secret Manager
  value) and corrected `R2_ENDPOINT`/`R2_PUBLIC_URL`, all Production and all
  `sensitive`, so Vercel makes them write-only (neither `env pull` nor the API
  can read them back — verification is functional, not by inspection). **A
  redeploy is still pending**; until then production runs the old env.

### Todo

Priority work, scheduled right after the frontend gaps:

- **Migration drift:** 33 migrations applied through the dashboard have no file
  in `hono/supabase/migrations` (the project's schema predates the repo's
  migration history). `supabase db push` refuses to run until they are
  reconciled, either by `supabase migration repair --status reverted <versions>`
  or by `supabase db pull` writing a baseline. Everything in the repo is
  applied; adding the next migration means deciding which way to reconcile
  first.
- **Production env:** set `R2_ENDPOINT` (no bucket path) and
  `R2_PUBLIC_URL=https://files.scriptr.uk` on the Vercel `scriptr-api` project,
  plus `OPTIMIZER_URL=https://optimizer-REDACTED_GCP_PROJECT_NUMBER.europe-west2.run.app` and
  `OPTIMIZER_SECRET` (the value in Secret Manager's `optimizer-secret`). If
  production already holds objects under the old `scriptr/` prefix, re-key them
  first. **Bot Fight Mode** is enabled on the zone and the free plan only allows
  zone-wide on/off, so it cannot be scoped to `files.scriptr.uk`; avatar and
  other requests to that host returned `200 image/webp` from `curl` and Node,
  so it is not challenging them today — if avatars break while the object is
  fine, that is the suspect (see `API_DOCUMENTATION.md`).
- **Optimizer, what's left:** the service is deployed (see Done), so this is
  tuning and production signing. Point the local `hono/.env` at the deployed
  `OPTIMIZER_URL` with the Secret Manager secret once, then run real PDFs
  (scans and text-heavy) and 20 MB phone photos through it to see how often the
  3.5 MB cap is hit and whether the `/ebook` and `/screen` presets and the image
  ladder keep text legible. Tune the presets and ladder from what you see.
  Also consider running `corepack pnpm test` in the API build command so failing
  tests block deploys.
- **User avatars:** the API, the optimizer avatar profile, the client, the
  bucket's public path and both migrations are done (see Done); what's left is
  the production end-to-end once Vercel has the optimizer env.
- **Serving cost:** review preview/download paths for avoidable egress and
  repeated signing once optimization lands.

## Sanity CMS

### Done

- Academic content model (University, Faculty, Study, Subject, Professor),
  relationships, reusable schema pieces, slug handling.
- Create/Sync with Database actions, publish gating, dependency-checked
  deletion, tested end to end across entity types.
- Internal API authentication, deployed API configuration, shared endpoint and
  type mappings.
- Academic field rules: a professor's faculties must belong to one university
  ([`professor.ts`](sanity/schemas/academic/professor.ts)) and a subject's
  professors must belong to the selected study
  ([`subject.ts`](sanity/schemas/academic/subject.ts)).
- Elective subjects: the subject schema's `elective` boolean is surfaced as an
  "Elective" badge on subject cards, the subject detail curriculum card and the
  onboarding academics picker.

### Todo

- **Professor reference filter typing:** type the `studies` reference filter
  callback in [`professor.ts`](sanity/schemas/academic/professor.ts) with a
  schema type instead of the inline inferred shape (check whether this is
  already done).
- **Studio cleanup:** remove unused schemas, utilities and constants,
  including the commented-out legacy hook in
  [`sanity/sanity-hooks/useSanityFetch.ts`](sanity/sanity-hooks/useSanityFetch.ts)
  (verify the live hook against the production Studio fetch flow) and the
  commented-out `renderChild` in
  [`portable-highlights.tsx`](sanity/schemas/portable-text/plugins/portable-highlights.tsx)
  (use the improved Portable Text input API when it becomes available).
- **Shared field builders:** in
  [`academicGrouping`](sanity/schemas/common/academicFields.tsx) allow
  customization and overrides, and decide whether the string `bio` variant
  should be removed.
- **Link selector:** list pages and academic entities dynamically in
  [`link-selector.ts`](sanity/schemas/common/link-selector.ts) (or hardcode the
  main pages and fetch the rest), then replace the plain `url` website field in
  [`person.ts`](sanity/schemas/misc/person.ts) with it.
- **Validation:** add `min` for string fields in `buildLengthRules`
  ([`validation.ts`](sanity/schemas/validation.ts)) once the validation revamp
  lands (a `min` rule currently breaks rich text validation).
- **Studio styles:** add the remaining variants and nest the styles in
  [`button-color-variants.css`](sanity/styles/components/button-color-variants.css).
- **Structure tool [decision]:** decide how page data is represented, and sort
  people by academic field in
  [`misc-structure.ts`](sanity/structure-tool/misc-structure.ts).
- **Semester model:** change semesters to numbers and update Sanity, the
  database, the API and consumers. Subjects keep a semester; scripts no longer
  use one (they have an exam session and year instead).

## Auth & Onboarding

### Done

- End-to-end auth (register, login, logout, session, email confirmation,
  protected actions) on both backend and frontend.
- First-visit onboarding (university, faculty, study, subjects), persisted, with
  onboarding and account-creation notifications.
- Realtime field validation on login and register (shared validators in
  `shared/utils/api.utils.ts`), including the Supabase password policy and
  taken username/email shown as field errors from the `409` response.
- Custom domain: the API sets the session cookie with `Domain=.scriptr.uk`
  (`COOKIE_DOMAIN`) and `SameSite=Lax`, so Server Components receive it (see
  `ARCHITECTURE.md` §4).
- Session-seeded server reads no longer hide failures: on the script detail
  page the vote, favorite and session lookups treat only a missing cookie or a
  `401` as signed out; any other failure keeps the page, disables vote/save and
  shows a toast (`viewerDataFailed`). `/user` uses `getSessionRequired` so an
  API outage shows an error instead of redirecting to `/auth`.
- Signing in or out refreshes the current route: every session transition in
  `SessionProvider` runs `router.refresh()`, so Server Components (script
  lists, profile header, anything gated on being signed in) pick up the new
  cookie immediately. The standalone `/auth` page then redirects to `/` on a
  successful login or logout; the modal leaves the visitor where they were.

### Todo

- **Finish production auth verification:** the Vercel production variables are
  set for `.scriptr.uk`, custom-domain CORS/revalidation, and the web API/site
  origins. The API is deployed with the shared cookie domain, and its DNS record
  is DNS-only so Cloudflare Bot Fight Mode can remain enabled for the web host
  without challenging Vercel server requests. Vercel Managed Bot Protection is
  set to log on the API project, while automatic DDoS mitigation remains on.
  The web deployment is live again; `/`, `/auth`, a script detail, and the API
  return successfully, while signed-out `/user` redirects as expected. Confirm
  the Supabase Auth Site URL is `https://scriptr.uk` and that
  `https://scriptr.uk/auth/callback` is allowed, then verify a signed-in hard
  refresh, vote/favorite state, and Studio sync.
  The production Sanity workflows set `SANITY_STUDIO_API_URL` to
  `https://api.scriptr.uk`. Users sign in once because existing cookies were
  scoped to the Vercel API host.

## API Client & Shared Types

### Done

- `apiRoutes` generated from the route configuration, `apiFetch` as the shared
  request layer with per-domain wrappers (`corepack pnpm gen:api-endpoints`).
- Shared contracts in `shared/`: API response types, Sanity TypeGen output,
  academic entity transforms, config. `UserRole`, `ProfileSubjectStatus` and
  `FlagStatus` live in `shared/types/`.
- The Hono RPC client was replaced on purpose by generated paths, because the
  full route graph was too expensive for TypeScript tooling.

## Frontend

### Done

- Academic navigation (nested university/faculty/study/subject routes, flat
  professor pages, ancestor-scoped queries), script listing/sorting/filtering,
  cached homepage and subject feeds. Public feeds and search render empty
  states when the API is down.
- Script creation (Portable Text editing, professor selection, exam
  session + year, additional reading, validated multi-file upload) and the
  script detail page (files, previews, downloads, comments, empty states).
- Script detail 404s answer a real `404`: the route dropped its segment
  `loading.tsx`, because a Suspense boundary above the page made `notFound()`
  stream after the headers and every missing script returned `200`. The same
  skeleton is now the page's own Suspense fallback, so the existence check runs
  first and the body streams after it.
- Script sessions: scripts are filed under an exam session (January, June,
  September) or "General (All Sessions)", plus a year limited to
  `SCRIPT_START_YEAR`..current year. The year select stays disabled until a
  session is chosen, offers only years that session has already reached this
  calendar year, and adds "General (All Years)" only for the general session.
  Create and edit share the same rules (`shared/utils/script-session.utils.ts`,
  enforced again by `POST`/`PATCH /scripts`). Subjects keep their semester.
- Homepage script feed: the default list stays curated from the viewer's
  in-progress subjects, and `/?scripts=all` shows the platform-wide top list.
  The choice is read server-side from the URL and the switch is a pair of plain
  links (`ScriptFeedToggle`), so the page stays a Server Component, only the
  selected list is fetched, and guests (who only have one list) see no switch.
- Elective subjects show an "Elective" badge on subject cards, the subject
  detail curriculum card and the onboarding academics picker.
- Comments and engagement UI (threads, replies, reactions, likes, moderation,
  votes, favorites).
- Auth and onboarding UI, protected actions, responsive navbar with mobile
  drawer and remembered desktop collapse.
- Mobile-first layout: centered `Dialog` fills the screen below `md` with
  shared default styling (side trays keep their own); the `/auth` card fills the
  screen under the header; script lists use `grid-auto-fit`; `EntityCard` text
  (and so `SubjectCard`) wraps below `md`; `ui-container` follows
  `--breakpoint-lg`.
- Portable Text editor and toolbar (dropdown triggers take the accent while
  something inside is selected).
- Animated canvas background with configurable mobile behavior and Studio
  controls.
- Professor page styling and layout.
- Subject overview card links: each person/entity links to its own page
  (professor, study, faculty, university); previously every link went to a
  professor page.
- `NextImage` requires `sizes` whenever `fillProp` is set.
- Script search: `/search?q=` (Server Component, `noindex`) backed by the
  public, unscoped `GET /scripts/search`; the homepage `ScriptsSection` links
  to it from the local filter (`showGlobalSearch`).
- Header search bar: the header search icon expands an inline bar (an overlay
  of the whole header below `sm`, inline from `sm` up). Enter goes to
  `/search?q=`; Escape and an outside press close it. It does not prefill the
  current query (`useSearchParams` in the root layout would make every static
  route client-rendered).
- Search validation: `isValidSearchQuery` (`lib/script-search.ts`) is shared by
  the header bar and the `/search` form (trim, non-empty, at most
  `INPUT_MAX_LENGTH`; no stricter format rule exists). Invalid submits are
  stopped with an inline message; the `/search` form is still a plain GET
  form without JS.
- Study tips: Sanity-only `studyTip` documents (not DB-synced). The tip card
  shows one tip per UTC day, picked on the server, on the homepage (signed in
  and guest) and both profile pages, and is omitted when there are no tips.
  The Studio schema must be deployed and tips authored before it appears.
- Footer: a one-line static footer in `MainLayout` (wordmark and copyright).
  `/auth` on mobile subtracts `--footer-height` so it still fits the screen.
- Script management: the script detail page shows Edit and Delete (title,
  description and additional reading; delete confirms and returns to the
  subject) plus a per-file Remove action to the author or an admin
  (`canManage` in the detail view model; the API stays the real boundary).
  Edit goes through `useProtectedAction` (restriction-checked, `403` is
  toasted); delete and file removal are never restriction-checked, so they are
  not wrapped. Guests already preview and download through the public
  `get-file` route. Components live in
  `next/components/academics/scripts/manage/`.
- Editing a script can also add files (upload, then attach; if the text save
  succeeds but the upload fails, a retry only re-sends the files). The create
  and edit forms share `ScriptFilesInput` / `useScriptFilePicker` and
  `ReadingLinksField` / `useReadingLinkTouched`.
- File cards and the preview modal show the stored file name (the type is
  already its own badge) and fall back to "File N" for older files.
- The script detail page shows a "Your script" badge to its author.
- Profile editing: the "Edit profile" dialog (`EditProfileDialog`,
  `useEditProfileForm`) edits username and full name through
  `PATCH /profiles/me` with the register form's validators; a taken username
  (`409`, `field: 'username'`) is shown on the field. Not restriction-checked,
  so it doesn't use `useProtectedAction`. The profile page updates in place
  (`reload()` on `ProfileProvider`, no loading flash) and the session is
  re-read. The signed-in avatar sits at the end of the header and links to
  `/user` while the navbar is collapsed (`HeaderProfileLink`).
- Academics editor: a separate "Edit academics" dialog on the profile
  (`EditAcademicsDialog`, `useEditAcademicsForm`) edits university → faculty →
  study and completed subjects. It reuses the onboarding wizard's selection
  cascade and subject logic (extracted to `useAcademicSelections`, now shared
  by both) and its select/subjects blocks, over local state seeded from the
  account (`lib/profile-academics.ts`). Saving diffs against the profile:
  faculty/study replacement through `PATCH /profiles/me`, then per-subject
  `PUT`/`DELETE`. Only `completed` subjects are edited; `currently_taking`
  and subjects of other studies are left alone.
- Profile subjects section (`ProfileSubjectsSidebar`): a toggle between
  Completed and Currently taking (in the section header, replacing the old
  no-op "Manage" button), plus separate study and year filters over the
  showing list (options come from that list; switching resets them; a filter
  with a single option is preselected and disabled). Both lists are limited
  to the subjects of the selected studies: completed ones, and everything
  else, which counts as currently taking. That is derived from the study, not
  read from stored `currently_taking` rows, which registration writes but the
  onboarding sync and academics editor don't. `SubjectsSidebar` gained an
  optional `toolbar` slot.
- One profile layout: `ProfilePage` (presentational) serves both `/user`
  (through the client `MyProfilePage`, which reads the shared profile state)
  and `/user/[username]` (server-fetched), replacing the duplicated page
  code. The public view now also shows subjects (the public profile endpoint
  already returned them). Visiting `/user/[username]` for your own username
  redirects to `/user`.
- Profile academic links use Sanity slugs: the onboarding catalog query now
  returns `slug` for universities, faculties and studies, and
  `buildProfileAcademics` maps profile rows to catalog entries by `dbId` to
  build `/university/...` paths (plain text when a slug is missing).
  `ProfileCard` takes that view model instead of raw rows. Resolves the old
  "use slugs, not ids" TODO.
- Onboarding copy lives in `UI_STRINGS.onboarding` (the modal and its select,
  subjects and account steps have no inline strings); the academics editor
  reuses the same strings.
- Professor comments: the professor page shows the shared comment section
  (`ProfessorComments`, rendered after the subjects explorer only when the
  professor has a `dbId`). The page stays statically generated: the first page
  of comments is fetched in the browser after mount (`useProfessorComments`),
  with a loading placeholder, the existing retry UI on a failed read
  (`CommentSection`'s `initialLoadFailed`) and the empty state. The browser
  sends its own session cookie and the client read is `no-store`, so
  `liked_by_me` / `my_reactions` are personalised and a posted comment shows up
  on reload. `EMPTY_COMMENT_PAGE` (`lib/comments/empty-comment-page.ts`) is
  shared with the script detail loader. Resolves the old static-vs-dynamic
  open decision.
- Ratings UI: a compact `RatingsSection` sits inside the professor page's
  About card (renamed from "Contact details") and the subject page's
  curriculum details card (`next/components/ratings/`, only when the entity has
  a `dbId`). The ratings routes also gained typed responses, a `23503` → `409`
  mapping, and non-JSON bodies now answer `400` instead of `500`. Criteria come
  from `GET /ratings/types?target_type=` and aggregates from `.../stats`, both
  read in the browser so the pages stay static (`useRatings`,
  `lib/api/ratings-api.ts`). Signed-in viewers load `.../my-ratings` and
  `GET /restrictions/me`; they can set, change and remove a score per
  criterion (five-point radiogroup, arrow keys move focus, Enter/Space/click
  selects). Guests see aggregates and a sign-in prompt. Restricted viewers
  (known up front, or via a 403 on save) can remove but not create or change.
  Strings live in `shared/strings/ratings-strings.ts`. No automated tests: the
  repo has no test runner.

### Todo

Product features:

- **Admin UI:** academic sync and dependency tools, `professor_studies`, user
  restrictions, flag resolution/moderation, suspicious-download review.
- **Notification settings:** preferences and the remaining user-facing
  notification kinds/UX (moderator notifications are deferred).
- **Profile experience (leftovers):** achievements (defer to the achievements
  todo). Avatar upload is built (see "R2 / File Storage"); it needs the bucket
  setup listed there. Optional later: make the faculty/study + profile row
  save atomic with an RPC (the profile row is written first, so a selection
  failure leaves the profile fields saved). Registration still writes
  `currently_taking` rows that nothing reads for display now (profiles derive
  it from the selected studies); either stop writing them or keep them in
  sync.
- **Study overview metadata:** more administrator/study metadata on the card in
  [`StudyOverviewCard.tsx`](next/components/academics/study/StudyOverviewCard.tsx)
  when it becomes available.
- **Branding:** create the app logo and apply the branding across the app;
  update the README and use the logo as the favicon.
- **Localization:** allow project strings, script titles and descriptions to be
  localized; comments remain unchanged.

Correctness and quality:

- **Scrollbar layout shift (Chromium) [bug, deferred]:** opening the loading
  overlay (and any dialog) locks body scroll, which removes the classic
  scrollbar; when it comes back the in-flow page jumps sideways by its width
  (~15px). Firefox is unaffected because its scrollbars overlay the content.
  Attempted and rejected: `scrollbar-gutter: stable` on `html` (reserves the
  space but leaves an empty strip right of the scrollbar and does not hold
  `fixed`/`sticky` elements still) and compensating with
  `body { padding-right: var(--scrollbar-compensation) }` measured in
  [`useBodyScroll.ts`](next/hooks/useBodyScroll.ts) (still shifted in Chromium).
  Next thing to try: a custom Chromium scrollbar — give `::-webkit-scrollbar`
  an explicit width and always reserve it (`overflow-y: scroll` scoped to
  browsers that render classic scrollbars), or ref-count the lock so nested
  locks cannot release the compensation early.
- **State coverage:** loading, empty and error states on the remaining pages
  and flows. Includes `/search`: `searchScripts` goes through
  `apiFetchPublicRead`, so an API failure currently renders as "no results".
- **Button accessibility:** require ARIA attributes on
  [`Button.tsx`](next/components/common/Button.tsx) (type level).
- **Error UX:** never show raw implementation details to users; present
  formatted, user-facing errors and improve error pages to use the available
  space, with an optional theme-matched illustration. Standardize operation
  failures as toasts where appropriate and document the convention in
  `ARCHITECTURE.md`.
- **Draft mode / live editing [decision]:** draft mode is currently unused. If
  it returns, add the `/api/disable-draft` endpoint linked by
  [`DisableDraft.tsx`](next/components/ui/DisableDraft.tsx) and ensure the
  component is not rendered while draft mode is unused.
- **Inline strings:** many components still hold user-facing text inline.
  Move it into `shared/strings/<area>-strings.ts` / `UI_STRINGS` (script
  detail and comments are already done), one feature area per pass. Cover JSX
  text, `aria-label`, `placeholder`, `title`, and toast/error messages.
- **Portable Text toolbar:** fix list numbering and the weight icons; keep the
  dropdown menu inside the viewport in
  [`PTDropdown.tsx`](next/components/typography/portable-text/toolbar/PTDropdown.tsx);
  share the decorator-category logic in
  [`PTClearOtherDecorators.tsx`](next/components/typography/portable-text/toolbar/PTClearOtherDecorators.tsx)
  with the Studio instead of keeping two copies.
- **Root layout:** in [`next/app/layout.tsx`](next/app/layout.tsx), factor the
  font setup out and build `metadata` with `generateMetadata` from Sanity data.
- **Type cleanup:** derive the `AcademicPathInput` types in
  [`academic-routes.ts`](next/lib/academic-routes.ts) from Sanity types.
- **UI polish:** z-index variables need to come from STYLE and not be written inline so they can be properly tracked, modal lifecycle (don't render closed
  dialogs, confirm modal), image sizing, mobile and accessibility passes,
  production CSS obfuscation, toasts should be more mobile friendly.

SEO and performance:

- **Cache Components:** investigate the `use cache` directive and partial
  prerendering.
- **Sitemap:** add one.
- **Robots [decision]:** add `robots` only if needed (Cloudflare may already
  serve one; check first).
- **Other SEO routes:** add any other useful ones if needed.
- **Image loading:** use eager loading on the largest images.
- **Font preloading:** add preload where it helps and remove it from fonts
  that don't need it, remove unused fonts once ui is finalized.

## Tooling & Quality

### Done

- Shared strict TypeScript config across workspaces; Next.js 16 with Turbopack
  and the React Compiler; root scripts for builds and type-checks.
- Security hardening: database-backed authorization, vote RPC hardening,
  restricted trigger execution, generic API database-error responses.
- API reference and testing guide reconciled with the route set; every in-code
  `TODO` / `Deferred:` moved into this file.

### Todo

- **Biome coverage:** enable additional rules after reviewing their
  signal-to-noise ratio.
- **Error hygiene:** project-wide review that stack traces, database details
  and other internals are never shown to users.
- **Internal secrets [decision, project-wide]:** `INTERNAL_API_SECRET`
  (server) and `SANITY_STUDIO_INTERNAL_SECRET` (Studio) are sent in request
  headers unencrypted, and the same question applies to any other
  service-to-service secret across `hono/`, `next/`, `sanity/` and `shared/`.
  Decide one mechanism for all of them: encryption, or salts set per
  environment via env vars that match across projects so each side can verify
  the other's requests. Covers config, docs and deploy workflows in every
  workspace, not just Studio.
- **Production registration incident (watch):** investigate the original
  academic-profile registration failure if it recurs with valid production
  catalog selections. The deployed path was verified with a fresh test account
  on 2026-10-09.

## Deferred (Do Last)

Deliberately postponed until everything else is done:

- **Achievement definitions CRUD:** admin management for
  `achievement_definitions`; public reading and awarding already exist.
- **Moderator notifications:** escalate repeated flags to moderators and route
  moderator-generated flags to admins. The moderator role stays
  notification-only; it never gets moderation tools.

## Suggested Order

1. Finish the main frontend gaps: admin/moderation UI (admin-only), then the notification settings. Profile editing is done; its leftovers are listed under the
   frontend todo.
2. Close frontend quality work: state coverage, inline strings, accessibility,
   toolbar behavior, root layout, toasts, polish, SEO/performance.
3. R2 improvements: file optimization and avatars are built; what's left is
   the migrations, public access on the bucket, tuning against real files, the
   Cloud Run deploy, and the serving-cost review.
4. Sanity cleanup, the structure/semester/elective decisions.
5. Tooling pass: Biome rules, error hygiene, and the project-wide internal
   secrets decision.
6. Deferred: achievement-definition CRUD and moderator notifications.

## Exploratory Ideas

- **Christmas effects:** add a seasonal Christmas background and effects.
