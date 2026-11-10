-- The composite key added in 20261110154000 already guarantees that every
-- script points at a real subject: (subject_id, study_id) references
-- subjects (id, study_id). Keeping the older single-column key as well gives
-- PostgREST two relationships between scripts and subjects, which makes every
-- `subject:subjects(...)` embed ambiguous and fails the generated types.
--
-- Dropping the narrower key changes no behaviour: neither had an on-delete
-- action, so a subject that still has scripts is still refused.
alter table public.scripts drop constraint if exists scripts_subject_id_fkey;
