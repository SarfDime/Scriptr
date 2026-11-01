-- 1. RLS policies for comment_likes (mirrors comment_reactions/script_favorites pattern)
create policy "Likes are publicly readable" on public.comment_likes
  for select using (true);
create policy "Users can like comments" on public.comment_likes
  for insert with check (auth.uid() = user_id);
create policy "Users can unlike comments" on public.comment_likes
  for delete using (auth.uid() = user_id);

-- 2. RLS policy for download_events: only the identity that made the download can see it;
-- all writes happen through the service-role client in the API, so no public write policy.
create policy "Users can see their own download events" on public.download_events
  for select using (auth.uid() = user_id);

-- 3. flags_exactly_one_target didn't account for target_comment_id, which blocked comment flags
alter table public.flags drop constraint if exists flags_exactly_one_target;
alter table public.flags add constraint flags_exactly_one_target
  check (num_nonnulls(target_script_id, target_user_id, target_comment_id) = 1);

-- 4. Subjects should be unique per faculty, not globally
alter table public.subjects drop constraint if exists subjects_name_year_exam_session_key;
alter table public.subjects add constraint subjects_faculty_name_year_session_key
  unique (faculty_id, name, year, exam_session);

-- 5. Prevent duplicate faculty names within the same university
alter table public.faculties add constraint faculties_university_name_key
  unique (university_id, name);

-- 6. Lock down internal-only functions: increment_download_count bypassed download dedup
-- and was unused; rls_auto_enable only needs to run as the event trigger owner.
revoke execute on function public.increment_download_count(uuid) from public, anon, authenticated;
drop function if exists public.increment_download_count(uuid);
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
;
