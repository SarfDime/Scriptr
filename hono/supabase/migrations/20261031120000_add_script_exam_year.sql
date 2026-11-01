-- Scripts are classified by exam session (january/june/september, or null for
-- the "general" session) plus the year that session sits in. Subjects keep
-- their own numeric semester; only scripts get a session/year pair.
--
-- Nullable on purpose: existing rows were created before the column existed.
alter table public.scripts
  add column if not exists exam_year integer;

alter table public.scripts
  drop constraint if exists scripts_exam_year_check;

alter table public.scripts
  add constraint scripts_exam_year_check
  check (exam_year is null or exam_year >= 2023);

-- PATCH /scripts/:id accepts exam_session and exam_year as editable fields.
-- authenticated only had column-level UPDATE on title, description,
-- additional_reading and updated_at, so without this grant every author edit
-- that touches the session/year fails with 42501 before RLS is evaluated.
-- Column-level, not table-wide: vote_score, download_count, is_flagged and
-- author_id stay unwritable. RLS still decides which rows can be updated.
grant update (exam_session, exam_year)
  on public.scripts to authenticated;
