# Scripts & Uploads

## The script

- One subject per script; faculty, study and university are derived, never stored.
  The professor is chosen explicitly and validated against `subject_professors`.
- A script's subject and professor **names** are read from Sanity, not from the Postgres
  rows: `subjects.name` and `professors.name` are single strings frozen when the rows were
  linked. The detail page resolves both in one subject read by the script's
  `subject.sanity_id` / `professor_id` (`getSubjectRef`); script lists resolve every
  distinct subject in one batch (`getScriptSubjectNames`).
- `title` and `description` are Portable Text **per language** — `jsonb`
  `{ en?, mk?: … }`, title needs at least one language, description may be absent, any
  subset; title ≤2KB per language, description ≤50KB. The API returns them as stored and
  the reader's language resolves through `pickLocalizedPortableText`. The column `CHECK`
  accepts only the object (`20261114214500_script_text_object_only.sql`).
- `exam_session` (`january`/`june`/`september`, or `null` for general),
  `exam_year` (`SCRIPT_START_YEAR` = 2023 to the current year, one lower for a session
  still ahead this calendar year, or `null`), `additional_reading` (`text[]`), and one or
  more `script_files` (`file_url`, `file_type`, `file_size_bytes`, `bucket`, `position`,
  `file_name`). File contents are immutable; the author or an admin adds files with
  `POST /scripts/:id/files` (restriction-checked) and removes one with
  `DELETE /scripts/:scriptId/files/:fileId`, which renumbers `position`.
- `file_name` is the uploaded name lowercased, accent-stripped, kebab-cased, without its
  extension; `null` for uploads from before names were kept.
- `zValidator` enforces the body, including the Portable Text allow-list (blocks, spans,
  decorators, styles, lists, alignments). The form validates per language and edits one
  language at a time behind `ScriptLanguageSelector`, dropping a language the author never
  touched. Submit is disabled only while busy (or, when editing, when nothing changed):
  an invalid form stays clickable and the click marks every field touched.
- **Address:** `/study/<siteSlug>/scripts/<slug>`, the slug being the title folded to ASCII
  plus the first eight id characters. It is minted in the same insert as the row
  (`buildScriptSlug`, `shared/utils/slug.utils.ts`) and **never regenerated** — the edit
  form shows it read-only, the create form previews it. It uses the default language, or
  the first filled one. The fold is a closed map to ASCII (`ж` → `z`, never `ž`, which
  would percent-encode), which is why authored text is Latin and Cyrillic only
  (`hasUnsupportedScript`, rejected at the form and by `POST`/`PATCH`). `GET /scripts/:id`
  resolves a slug or an id, so older links still work.
- `is_flagged` is excluded from every public response.
- **Search** is local-first with an API fallback (`GET /scripts/search`), fuzzy over
  Portable Text as plain text, and never platform-wide: a study's site searches its own
  scripts with `study=<dbId>` (`/scripts?q=…`). The catalog's `/search` covers
  universities, faculties, studies and professors from Sanity (`loadSearchPage`).
  `ScriptsSection`'s local filter only covers loaded scripts. `isValidSearchQuery`
  (`next/lib/script-search.ts`) trims and caps at `INPUT_MAX_LENGTH` for both the header
  and `SearchForm`; the API's `400` is the backstop. The header never prefills `?q=`,
  because `useSearchParams` in the root layout would make every static route client-
  rendered.

## Comments

- Allow-listed Portable Text with inline decorators only — no custom blocks, annotations,
  headings, lists or alignment. ≤10 KiB, at least three non-whitespace characters. A reply
  inherits and is database-enforced against its parent's target.
- Root comments page by two, ordered newest or combined like-and-reaction. Five
  chronological replies show per comment, further replies page by 10 at any depth. One
  hide/show control per root thread, which resets to the reply preview; loaded pages stay
  cached.
- Summary counts and `totalCommentCount` include replies; root `totalCount` is the
  paginated root total. Totals come from the bounded `get_script_comment_counts`
  security-definer RPC, because public roles have no table `SELECT` on comments;
  reaction/like totals are aggregated server-side through the internal client, returning
  counts and the viewer's own status only.
- Each user toggles several reaction types, but cannot like or react to their own comment.
  Comment and reply creation are limited to 10 per 15 minutes each, and likes/reactions to
  15 per minute per account, per API process.
- Comments target exactly one script or professor, and the components are target-agnostic.
  A script page reads its first page on the server with the viewer's cookie (so it is
  dynamic); a professor page stays static and loads the first page in the browser
  (`ProfessorComments`/`useProfessorComments`, `no-store`), with loading, retry and empty
  states, and only when the professor has a database id.

## Files

- Types: `pdf`, `jpg`, `jpeg`, `png`, `webp`, `md`, `docx`, `xlsx` (no legacy `.doc`/`.xls`),
  checked by extension at `POST /file-ops/upload-urls` and by real signature at
  `POST /file-ops/finalize`. Stored files are capped at 3.5 MB with a 3 MB target
  (`shared/config/shared-constants.ts`); PDFs and images may arrive up to 20 MB and are
  shrunk to fit.
- Three steps: `POST /file-ops/upload-urls` presigns PUTs into `staging/{userId}/`; the
  browser PUTs straight to R2 (bytes never pass through the API, which sidesteps Vercel's
  4.5 MB body limit); `POST /file-ops/finalize` optimizes each file (the optimizer service
  when configured, otherwise an in-process stand-in that validates without shrinking) and
  returns `{ fileKey, fileType, fileSizeBytes, bucket, fileName }` per file, passed into
  `POST /scripts` or `POST /scripts/:id/files`. A script may be created with no files.
- **Storage scoping:** a university may have its own bucket (`universities.r2_bucket_id`),
  resolved through subject → study → faculty → university, falling back to `R2_BUCKET`.
  Keys use dbIds: `{facultyId}/{studyId}/{subjectId}/{userId}/{uuid}.{ext}`;
  `script_files.bucket` records the landing bucket. `POST /scripts` and
  `POST /scripts/:id/files` accept only keys inside the caller's scope for that subject
  that exist in R2, and store the size R2 reports. Cleanup deletes only under the caller's
  own user id. Deleting a script, or a failed upload/create/attach, deletes the affected
  objects best-effort (logged, never returned).
- `GET /file-ops/get-file/*` is public for guest preview and download, verifies the key
  against `script_files` and resolves the bucket server-side; `?download=1` saves under the
  stored `file_name` instead of rendering inline.
- Keys are unique per upload and never overwritten, so objects are served
  `public, max-age=31536000, immutable`.
- While the mobile drawer or a native dialog is open, the main `ui-container` scroll
  surface is locked by a `:has()` rule; a dialog also restores focus to its trigger and
  traps keyboard focus.

## Caching

- Next.js Data Cache, tagged per endpoint/id; public profiles and stats never expire on a
  clock, so tags are the only refresh. Script, profile, favorite, vote, download, comment,
  rating and role mutations call the backend webhook to revalidate the affected tags. The
  webhook targets the web project's Vercel alias, because Cloudflare does not forward the
  API's server-to-server request to `scriptr.uk`; that alias is behind Vercel
  Authentication, so the call carries the project's protection-bypass token.
- A study's feed composes the signed-in curated list from shared cached per-subject reads;
  that list is currently behind `CURATED_FEED_ENABLED` in the scripts page.
  Search and "my scripts" are never cached.
