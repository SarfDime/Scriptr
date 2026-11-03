-- Readable script URLs: /scripts/<transliterated-title>-<id8>, e.g.
-- /scripts/biologija-predavanje-1-f585a670.
--
-- The slug is minted once, by the API, when the script is created
-- (buildScriptSlug in shared/utils/slug.utils.ts) and never regenerated: it is
-- the address people share, so a later title edit must not break it.
--
-- Two steps, on purpose. Titles are Portable Text and folding Macedonian
-- Cyrillic to ASCII in SQL would duplicate the mapping the app already owns, so
-- this file only guarantees every existing row gets a unique placeholder.
-- `corepack pnpm --filter @scriptr/api backfill:script-slugs -- --apply` then
-- rewrites them from the titles through that same function. A slug only has to
-- be stable and unique, never pretty, so the placeholder is a safe resting
-- state if that step is missed.
alter table public.scripts
  add column if not exists slug text;

update public.scripts
  set slug = 'script-' || substr(replace(id::text, '-', ''), 1, 8)
  where slug is null or slug = '';

-- Unique rather than plain: it is also the key GET /scripts/:slug resolves
-- through, and the id characters are what keep two identically titled scripts
-- apart.
create unique index if not exists scripts_slug_key
  on public.scripts (slug);

-- No grants here. `authenticated` holds table-wide SELECT and INSERT on this
-- table, so the new column is readable and insertable already, while UPDATE is
-- column-level (title, description, additional_reading, exam_session,
-- exam_year, updated_at). Not granting UPDATE on slug is what keeps the slug
-- immutable from a client, which is the property the create form promises.
