# SANITY
- [ ] Remove unused schemas
- [ ] Remove any unused utils and constants
- [ ] Encrypt internal secret and use same salt across environments with env variables

# NEXT 
- [ ] Do all todos across project
- [ ] Add image sizes across project
- [ ] https://tailwindcss.com/docs/transition-behavior for handling transitions like notification shade pop up
- [ ] Add register/sign up field validation
- [ ] confirm modal
- [ ] dont render dialogs if not open
- [ ] repalce all zindexes with style z-index variables
- [ ] fix pt lists increments
- [ ] if item selected in toolbar add accent
- [ ] fix weight icons in pt toolbar
- [ ] add view background mode easter egg, by clicking on the black hole repeatedly
- [ ] add source inline for color palettes as well
- [ ] use strings for everything
- [ ] make header actually show real information maybe coming from sanity?
- [ ] add localization

# NEXT and SANITY
- [ ] Decide how to handle page data in the structure tool
- [ ] Check out cache components and use cache directive for ppr
- [ ] Nest academic routes except for professor

# HONO
- [ ] Add register field validation
- [ ] Unique usernames
- [ ] file-ops.ts — one thing worth a decision, not a fix
GET /get-file/* has no authMiddleware and does no check that the requested key corresponds to an actual script_files.file_url row — it'll happily presign a URL for any key string handed to it, including one for a script/file that's since been deleted from the DB. In practice the UUID-based keys make guessing impractical, so this may be an accepted tradeoff given "download and preview remain accessible to guests" — but it does mean a deleted script's file stays fetchable via R2 forever unless something also deletes the R2 object on script deletion (nothing in scripts.ts's DELETE /:id does that today). I'd rather flag this than silently add auth, since guest access here might be load-bearing for the public preview/download flow — do you want key-to-DB validation added, R2 cleanup added on script delete, or is this intentional as-is?
- [ ] Decide on handling of R2 objects for deleted scripts in hono/file-ops.ts
- [ ] Make routes responses typed with constant variables and types from those, so they can be easily extracted, or maybe even set up the types in shared and use them in hono
// Excludes is_flagged, which is internal moderation state and not for public consumption.
const PUBLIC_SCRIPT_COLUMNS =
  'id, title, description, subject_id, professor_id, author_id, exam_session, additional_reading, vote_score, download_count, created_at, updated_at, files:script_files(id, file_url, file_type, file_size_bytes, bucket, position, created_at)'


## R2 
- [ ] Allow uploading multiple files, in CF upload files under the subject slug so faculty/study/userid/files go here
- [ ] Cloudflare buckets will be university scoped so each university will have it's own bucket

# GENERAL
- [ ] Add more biome rules that are not currently covered in the project, mostly nursery rules.
- [ ] Semesters change to numbers
- [ ] Add elective subjects which are not necessarily in a semester or year
- [ ] Disallow spam email addresses in registration
- [ ] rate limiting