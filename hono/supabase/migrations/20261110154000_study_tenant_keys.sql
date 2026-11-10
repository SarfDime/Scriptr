-- Study tenancy: the keys every later phase reads.
--
-- Adds the study's permanent site handle, moves file storage onto the study,
-- denormalises the study onto scripts (so feeds, search and RLS stop needing a
-- three-table join), gives the per-study academic profile its display fields,
-- and scopes achievements.

-- ============================================================
-- 1. The study's permanent site handle
-- ============================================================

alter table public.studies add column if not exists site_slug text;

alter table public.studies
  add constraint studies_site_slug_format
  check (site_slug is null or site_slug ~ '^[a-z0-9]([a-z0-9-]{0,59}[a-z0-9])?$');

-- Keep in sync with RESERVED_SITE_SLUGS in shared/config/site-slugs.ts.
alter table public.studies
  add constraint studies_site_slug_reserved
  check (
    site_slug is null
    or lower(site_slug) <> all (array[
      'www', 'api', 'admin', 'sanity', 'cdn', 'files', 'staging', 'mail',
      'status', 'preview', 'app'
    ])
  );

-- A handle is immutable once a study exists in the database, so uniqueness is
-- case-insensitive and enforced here rather than only in the Studio.
create unique index if not exists studies_site_slug_key
  on public.studies (lower(site_slug))
  where site_slug is not null;

-- ============================================================
-- 2. Files belong to a study, not a university
-- ============================================================

alter table public.studies add column if not exists r2_bucket_id text;

update public.studies as study
   set r2_bucket_id = university.r2_bucket_id
  from public.faculties as faculty
  join public.universities as university on university.id = faculty.university_id
 where study.faculty_id = faculty.id
   and study.r2_bucket_id is null;

-- ============================================================
-- 3. The study on each script
-- ============================================================

-- The target of the composite foreign key below. `id` alone is already unique;
-- this pair is what lets a script carry `study_id` and still be guaranteed to
-- agree with its subject.
create unique index if not exists subjects_id_study_id_key
  on public.subjects (id, study_id);

alter table public.scripts add column if not exists study_id uuid;

update public.scripts as script
   set study_id = subject.study_id
  from public.subjects as subject
 where subject.id = script.subject_id;

do $$
declare
  orphaned integer;
begin
  select count(*) into orphaned from public.scripts where study_id is null;
  if orphaned > 0 then
    raise exception
      '% script(s) point at a subject with no study; fix them before applying', orphaned;
  end if;
end
$$;

alter table public.scripts alter column study_id set not null;

alter table public.scripts
  add constraint scripts_subject_study_fkey
  foreign key (subject_id, study_id) references public.subjects (id, study_id);

create index if not exists scripts_study_recent_idx
  on public.scripts (study_id, created_at desc);

create index if not exists scripts_study_vote_idx
  on public.scripts (study_id, vote_score desc)
  where is_flagged = false;

-- Writers never send `study_id`: it is always derived from the subject, so it
-- cannot drift from it and no insert path needs changing.
create or replace function public.set_script_study_id()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  subject_study uuid;
begin
  select subject.study_id into subject_study
    from public.subjects as subject
   where subject.id = new.subject_id;

  if subject_study is null then
    raise exception 'script subject % has no study', new.subject_id
      using errcode = '23503';
  end if;

  new.study_id := subject_study;
  return new;
end;
$$;

revoke execute on function public.set_script_study_id() from public;
revoke execute on function public.set_script_study_id() from anon;
revoke execute on function public.set_script_study_id() from authenticated;

drop trigger if exists set_script_study_id on public.scripts;
create trigger set_script_study_id
  before insert or update of subject_id on public.scripts
  for each row execute function public.set_script_study_id();

-- ============================================================
-- 4. The academic profile, per study
-- ============================================================

alter table public.profile_studies
  add column if not exists display_name text,
  add column if not exists headline text,
  add column if not exists year smallint,
  add column if not exists is_primary boolean not null default false,
  add column if not exists is_public boolean not null default true,
  add column if not exists updated_at timestamptz not null default now();

alter table public.profile_studies
  add constraint profile_studies_display_name_length
    check (display_name is null or char_length(display_name) between 2 and 60),
  add constraint profile_studies_headline_length
    check (headline is null or char_length(headline) between 2 and 160),
  add constraint profile_studies_year_range
    check (year is null or year between 1 and 8);

-- One default study per profile. The (profile_id, study_id) primary key already
-- stops duplicate memberships.
create unique index if not exists profile_studies_one_primary
  on public.profile_studies (profile_id)
  where is_primary;

-- A display name is unique inside its study, not across the platform.
create unique index if not exists profile_studies_display_name_per_study
  on public.profile_studies (study_id, lower(display_name))
  where is_public and display_name is not null;

drop trigger if exists set_profile_studies_updated_at on public.profile_studies;
create trigger set_profile_studies_updated_at
  before update on public.profile_studies
  for each row execute function public.set_updated_at();

-- ============================================================
-- 5. Achievements: per study, with global definitions as study_id is null
-- ============================================================

alter table public.achievement_definitions
  add column if not exists study_id uuid
    references public.studies(id) on delete cascade;

create index if not exists idx_achievement_definitions_study_id
  on public.achievement_definitions (study_id);

-- `profile_achievements` needs no change: a definition id stays globally unique,
-- so (profile_id, achievement_id) already scopes each award to its study.
