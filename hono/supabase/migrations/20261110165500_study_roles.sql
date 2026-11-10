-- Roles, split by scope.
--
-- `owner` is the org-level role: it replaces the old platform-wide `admin`.
-- `admin` and `moderator` are per study and live in `study_roles`, so a person
-- can hold a role on any number of studies. Bans stay org-wide and unchanged.
--
-- Existing behaviour is preserved: every policy that called `is_admin()` keeps
-- working, because that function now answers the owner question. Only the
-- study-scoped moderation policies are rewritten here.

-- ============================================================
-- 1. Owner
-- ============================================================

create or replace function public.is_owner(uid uuid)
returns boolean
language sql
stable
set search_path to 'public'
as $function$
  select exists (select 1 from public.profiles where id = uid and role = 'owner');
$function$;

-- The name 19 policies still call. It now answers the owner question, so their
-- meaning moved with the role without recreating each policy. New and rewritten
-- policies say `is_owner`; renaming these is a follow-up, not a behaviour change.
create or replace function public.is_admin(uid uuid)
returns boolean
language sql
stable
set search_path to 'public'
as $function$
  select public.is_owner(uid);
$function$;

-- ============================================================
-- 2. Study roles
-- ============================================================

create table if not exists public.study_roles (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  study_id uuid not null references public.studies(id) on delete cascade,
  role text not null check (role in ('admin', 'moderator')),
  granted_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (profile_id, study_id)
);

alter table public.study_roles enable row level security;

drop policy if exists "users can see their own study roles" on public.study_roles;
create policy "users can see their own study roles" on public.study_roles
  for select using (
    (select auth.uid()) = profile_id
    or public.is_owner((select auth.uid()))
  );

drop policy if exists "owners can grant study roles" on public.study_roles;
create policy "owners can grant study roles" on public.study_roles
  for insert with check (public.is_owner((select auth.uid())));

drop policy if exists "owners can change study roles" on public.study_roles;
create policy "owners can change study roles" on public.study_roles
  for update using (public.is_owner((select auth.uid())))
  with check (public.is_owner((select auth.uid())));

drop policy if exists "owners can revoke study roles" on public.study_roles;
create policy "owners can revoke study roles" on public.study_roles
  for delete using (public.is_owner((select auth.uid())));

create index if not exists idx_study_roles_profile_id
  on public.study_roles (profile_id);

create index if not exists idx_study_roles_study_id
  on public.study_roles (study_id);

-- `need` is 'admin' or 'moderator'; an admin satisfies a moderator check.
create or replace function public.has_study_role(uid uuid, study uuid, need text)
returns boolean
language sql
stable
set search_path to 'public'
as $function$
  select exists (
    select 1
      from public.study_roles role
     where role.profile_id = uid
       and role.study_id = study
       and (role.role = need or role.role = 'admin')
  );
$function$;

-- Anyone holding a study role anywhere. No policy uses it any more (the last
-- two, on `professor_studies`, were rewritten above); kept because the function
-- is part of the schema's history rather than dropped mid-migration.
create or replace function public.is_moderator(uid uuid)
returns boolean
language sql
stable
set search_path to 'public'
as $function$
  select exists (select 1 from public.study_roles where profile_id = uid);
$function$;

-- The study a flag belongs to: its script, or its comment's script. Null for a
-- flag on a user or a professor, which only an owner handles.
create or replace function public.flag_study_id(target_script uuid, target_comment uuid)
returns uuid
language sql
stable
set search_path to 'public'
as $function$
  select coalesce(
    (select script.study_id from public.scripts script where script.id = target_script),
    (
      select script.study_id
        from public.comments comment
        join public.scripts script on script.id = comment.script_id
       where comment.id = target_comment
    )
  );
$function$;

-- ============================================================
-- 3. Move the existing global roles across
-- ============================================================

-- Moderators were platform-wide because there was nothing narrower. Every
-- current study gets a row, which is what they effectively had while there is
-- one study, and what an owner can trim afterwards.
insert into public.study_roles (profile_id, study_id, role)
select profile.id, study.id, 'moderator'
  from public.profiles profile
  cross join public.studies study
 where profile.role = 'moderator'
on conflict (profile_id, study_id) do nothing;

alter table public.profiles drop constraint if exists profiles_role_check;

update public.profiles set role = 'student' where role = 'moderator';
update public.profiles set role = 'owner' where role = 'admin';

alter table public.profiles
  add constraint profiles_role_check check (role in ('student', 'owner'));

-- ============================================================
-- 4. Study-scoped moderation
-- ============================================================

-- scripts: the row carries its study, so no join is needed.
drop policy if exists "authors and admins can delete scripts" on public.scripts;
create policy "authors, owners and study moderators can delete scripts" on public.scripts
  for delete using (
    (select auth.uid()) = author_id
    or public.is_owner((select auth.uid()))
    or public.has_study_role((select auth.uid()), study_id, 'moderator')
  );

drop policy if exists "authors can update their own scripts" on public.scripts;
create policy "authors can update their own scripts" on public.scripts
  for update using (
    ((select auth.uid()) = author_id and not public.is_restricted((select auth.uid())))
    or public.is_owner((select auth.uid()))
    or public.has_study_role((select auth.uid()), study_id, 'moderator')
  ) with check (
    ((select auth.uid()) = author_id and not public.is_restricted((select auth.uid())))
    or public.is_owner((select auth.uid()))
    or public.has_study_role((select auth.uid()), study_id, 'moderator')
  );

drop policy if exists "authenticated users can create their own scripts" on public.scripts;
create policy "authenticated users can create their own scripts" on public.scripts
  for insert with check (
    ((select auth.uid()) = author_id and not public.is_restricted((select auth.uid())))
    or public.is_owner((select auth.uid()))
    or public.has_study_role((select auth.uid()), study_id, 'moderator')
  );

-- comments: the study comes from the script the comment is on. A comment on a
-- professor has no script and therefore no study, so only an owner moderates it.
drop policy if exists "authors and admins can delete comments" on public.comments;
create policy "authors, owners and study moderators can delete comments" on public.comments
  for delete using (
    (select auth.uid()) = author_id
    or public.is_owner((select auth.uid()))
    or public.has_study_role(
      (select auth.uid()),
      (select script.study_id from public.scripts script where script.id = comments.script_id),
      'moderator'
    )
  );

drop policy if exists "authors can edit their own comments" on public.comments;
create policy "authors can edit their own comments" on public.comments
  for update using (
    ((select auth.uid()) = author_id and not public.is_restricted((select auth.uid())))
    or public.is_owner((select auth.uid()))
    or public.has_study_role(
      (select auth.uid()),
      (select script.study_id from public.scripts script where script.id = comments.script_id),
      'moderator'
    )
  ) with check (
    ((select auth.uid()) = author_id and not public.is_restricted((select auth.uid())))
    or public.is_owner((select auth.uid()))
    or public.has_study_role(
      (select auth.uid()),
      (select script.study_id from public.scripts script where script.id = comments.script_id),
      'moderator'
    )
  );

drop policy if exists "authenticated users can comment" on public.comments;
create policy "authenticated users can comment" on public.comments
  for insert with check (
    ((select auth.uid()) = author_id and not public.is_restricted((select auth.uid())))
    or public.is_owner((select auth.uid()))
    or public.has_study_role(
      (select auth.uid()),
      (select script.study_id from public.scripts script where script.id = comments.script_id),
      'moderator'
    )
  );

-- flags: the study is whichever row the flag points at.
drop policy if exists "admins can resolve flags" on public.flags;
create policy "owners and study moderators can resolve flags" on public.flags
  for update using (
    public.is_owner((select auth.uid()))
    or public.has_study_role(
      (select auth.uid()),
      public.flag_study_id(target_script_id, target_comment_id),
      'moderator'
    )
  ) with check (
    public.is_owner((select auth.uid()))
    or public.has_study_role(
      (select auth.uid()),
      public.flag_study_id(target_script_id, target_comment_id),
      'moderator'
    )
  );

drop policy if exists "reporters and admins can view flags" on public.flags;
create policy "reporters, owners and study moderators can view flags" on public.flags
  for select using (
    (select auth.uid()) = reporter_id
    or public.is_owner((select auth.uid()))
    or public.has_study_role(
      (select auth.uid()),
      public.flag_study_id(target_script_id, target_comment_id),
      'moderator'
    )
  );

drop policy if exists "reporters and admins can remove flags" on public.flags;
create policy "reporters, owners and study moderators can remove flags" on public.flags
  for delete using (
    (select auth.uid()) = reporter_id
    or public.is_owner((select auth.uid()))
    or public.has_study_role(
      (select auth.uid()),
      public.flag_study_id(target_script_id, target_comment_id),
      'moderator'
    )
  );

-- script files: the study comes from their script.
drop policy if exists "authors and admins can delete script files" on public.script_files;
create policy "authors, owners and study moderators can delete script files" on public.script_files
  for delete using (
    exists (
      select 1 from public.scripts script
       where script.id = script_files.script_id
         and script.author_id = (select auth.uid())
    )
    or public.is_owner((select auth.uid()))
    or public.has_study_role(
      (select auth.uid()),
      (select script.study_id from public.scripts script where script.id = script_files.script_id),
      'moderator'
    )
  );

drop policy if exists "authors can attach files to their own scripts" on public.script_files;
create policy "authors can attach files to their own scripts" on public.script_files
  for insert with check (
    exists (
      select 1 from public.scripts script
       where script.id = script_files.script_id
         and script.author_id = (select auth.uid())
         and not public.is_restricted((select auth.uid()))
    )
    or public.is_owner((select auth.uid()))
    or public.has_study_role(
      (select auth.uid()),
      (select script.study_id from public.scripts script where script.id = script_files.script_id),
      'moderator'
    )
  );

-- professor assignments belong to the study the professor teaches on it.
drop policy if exists "moderators can insert professor study programs" on public.professor_studies;
create policy "study admins can insert professor study programs" on public.professor_studies
  for insert with check (
    public.is_owner((select auth.uid()))
    or public.has_study_role((select auth.uid()), study_id, 'admin')
  );

drop policy if exists "moderators can delete professor study programs" on public.professor_studies;
create policy "study admins can delete professor study programs" on public.professor_studies
  for delete using (
    public.is_owner((select auth.uid()))
    or public.has_study_role((select auth.uid()), study_id, 'admin')
  );
