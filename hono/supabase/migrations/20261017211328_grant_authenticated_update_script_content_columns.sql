-- PATCH /scripts/:id writes title, description and additional_reading (plus
-- updated_at, already granted). `authenticated` only had column-level UPDATE on
-- professor_id, subject_id and updated_at, so every edit failed with 42501
-- ("permission denied for table scripts") before RLS was evaluated.
--
-- Column-level on purpose: a table-wide grant would also make vote_score,
-- download_count, is_flagged and author_id writable by any author. RLS
-- (author-or-admin, and not restricted for non-admins) still decides which
-- rows can be updated.
grant update (title, description, additional_reading)
  on public.scripts to authenticated;
