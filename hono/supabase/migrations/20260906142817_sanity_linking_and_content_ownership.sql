-- Link DB rows to their Sanity document (at most one DB row per Sanity doc)
alter table public.universities add column if not exists sanity_id text unique;
alter table public.faculties add column if not exists sanity_id text unique;
alter table public.professors add column if not exists sanity_id text unique;
alter table public.subjects add column if not exists sanity_id text unique;

-- Rich descriptive content now lives in Sanity, not Postgres
alter table public.professors drop column if exists bio;
alter table public.professors drop column if exists picture_url;
alter table public.subjects drop column if exists description;
;
