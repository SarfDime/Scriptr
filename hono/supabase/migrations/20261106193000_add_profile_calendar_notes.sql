-- Personal calendar notes. Notes are local-first: the browser owns them until
-- the reader syncs, so the row is keyed by the client-generated `note_id` and
-- `updated_at` is what resolves a conflict (newest edit wins). A deletion keeps
-- a tombstone (`deleted = true`) so it can travel to another browser.
--
-- The per-day cap (three) and the per-profile cap live in
-- shared/config/calendar.ts and are enforced by the API; a CHECK here only
-- guards what the table itself must never store.
CREATE TABLE public.profile_calendar_notes (
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  note_id text NOT NULL,
  day date NOT NULL,
  type text NOT NULL DEFAULT 'note'
    CHECK (type IN ('note', 'exam', 'preliminary_exam', 'exam_result')),
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 80),
  body text CHECK (body IS NULL OR char_length(body) <= 2000),
  deleted boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL,
  synced_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (profile_id, note_id),
  CONSTRAINT profile_calendar_notes_note_id_length
    CHECK (char_length(note_id) BETWEEN 1 AND 64)
);

CREATE INDEX profile_calendar_notes_profile_day_idx
  ON public.profile_calendar_notes (profile_id, day);

ALTER TABLE public.profile_calendar_notes ENABLE ROW LEVEL SECURITY;

-- Reading is always allowed for the owner (a sync needs the full copy, and the
-- pages cache it locally). Writing is blocked for a restricted account, the same
-- rule the other own-resource tables apply.
CREATE POLICY "users can view their own calendar notes"
  ON public.profile_calendar_notes
  FOR SELECT
  USING ((select auth.uid()) = profile_id);

CREATE POLICY "users can insert their own calendar notes"
  ON public.profile_calendar_notes
  FOR INSERT
  WITH CHECK (
    (select auth.uid()) = profile_id
    AND NOT is_restricted((select auth.uid()))
  );

CREATE POLICY "users can update their own calendar notes"
  ON public.profile_calendar_notes
  FOR UPDATE
  USING (
    (select auth.uid()) = profile_id
    AND NOT is_restricted((select auth.uid()))
  )
  WITH CHECK (
    (select auth.uid()) = profile_id
    AND NOT is_restricted((select auth.uid()))
  );

CREATE POLICY "users can delete their own calendar notes"
  ON public.profile_calendar_notes
  FOR DELETE
  USING ((select auth.uid()) = profile_id);

REVOKE ALL ON TABLE public.profile_calendar_notes FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.profile_calendar_notes
  TO authenticated;
GRANT ALL ON TABLE public.profile_calendar_notes TO service_role;
