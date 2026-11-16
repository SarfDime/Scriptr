-- A note belongs to the study whose calendar it was written on, so the same
-- day can hold different notes in two studies. The per-day cap and the client
-- grouping both key on (profile, study, day); the primary key stays
-- (profile_id, note_id) because the id is client-generated and already unique.
--
-- Existing rows carry no study. They are attributed to the reader's primary
-- study, else their oldest membership — the closest the data allows. A profile
-- with no study membership has no calendar to show them on, so those rows are
-- removed; the browser copy is the source of truth and is re-pushed with a
-- study on the next sync.
ALTER TABLE public.profile_calendar_notes
  ADD COLUMN study_id uuid REFERENCES public.studies(id) ON DELETE CASCADE;

UPDATE public.profile_calendar_notes AS note
   SET study_id = (
     SELECT membership.study_id
       FROM public.profile_studies AS membership
      WHERE membership.profile_id = note.profile_id
      ORDER BY membership.is_primary DESC, membership.created_at
      LIMIT 1
   );

DELETE FROM public.profile_calendar_notes WHERE study_id IS NULL;

ALTER TABLE public.profile_calendar_notes
  ALTER COLUMN study_id SET NOT NULL;
