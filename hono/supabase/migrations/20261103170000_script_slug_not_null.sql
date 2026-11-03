-- The slug is now the address a script is served at, so a row without one is
-- unreachable: `GET /scripts/:slug` resolves through this column.
--
-- Safe to tighten now. `add_script_slug` filled every existing row with a
-- placeholder, `backfill:script-slugs` replaced those with title-derived slugs,
-- and POST /scripts mints one in the same insert as the row.
alter table public.scripts
  alter column slug set not null;
