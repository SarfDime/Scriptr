-- A study admin may announce inside their own study.
--
-- The admin surface is shared, and an announcement is now addressable to one
-- study (`notifications.study_id`). Without this an admin who can already edit
-- that study's content would still be unable to tell its people anything. The
-- policy is the boundary: the row must name a study the caller administers, so a
-- study admin can never write a platform-wide notification — that stays with an
-- owner through the existing "admins can create notifications" policy.

drop policy if exists "study admins can announce in their study" on public.notifications;
create policy "study admins can announce in their study" on public.notifications
  for insert
  with check (
    study_id is not null
    and public.has_study_role((select auth.uid()), study_id, 'admin')
  );
