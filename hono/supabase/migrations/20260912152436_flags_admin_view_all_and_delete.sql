-- Give admins full visibility and delete rights on flags, matching the
-- is_admin() OR-pattern already used on scripts/comments/profiles.
-- UPDATE already had "admins can resolve flags"; INSERT stays reporter-only
-- since admins don't need to file flags as someone else.

drop policy if exists "reporters see their own flags" on public.flags;
create policy "reporters and admins can view flags"
on public.flags
for select
to public
using (
  (select auth.uid()) = reporter_id
  or is_admin((select auth.uid()))
);

drop policy if exists "reporters can remove their own flags" on public.flags;
create policy "reporters and admins can remove flags"
on public.flags
for delete
to public
using (
  (select auth.uid()) = reporter_id
  or is_admin((select auth.uid()))
);
;
