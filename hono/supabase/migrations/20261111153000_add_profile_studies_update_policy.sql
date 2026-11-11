-- The owner of a study membership can update it.
--
-- `POST /profile-studies/:studyId` is an idempotent add: it upserts on
-- `(profile_id, study_id)`, and once the row exists Postgres takes the
-- `ON CONFLICT DO UPDATE` branch. RLS checks that branch against the UPDATE
-- policy's USING expression, so with only the SELECT/INSERT/DELETE policies the
-- second save of a study an account already has fails with `42501` — which is
-- exactly what "save academic setup" does for an existing enrollee. The sibling
-- tables (`profile_faculties`, `profile_subjects`) already carry the matching
-- policy; this is the one that was missed. It also lets the owner write the
-- per-study profile fields added in 20261110154000 (display name, headline,
-- year, public/primary flags).

drop policy if exists "Users can update their own studies" on public.profile_studies;
create policy "Users can update their own studies" on public.profile_studies
  for update
  using ((select auth.uid()) = profile_id)
  with check ((select auth.uid()) = profile_id);
