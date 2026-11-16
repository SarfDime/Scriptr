-- Weekly automatic calendar-notes push. The explicit sync allowance lives in one
-- serverless instance's memory and cannot express a week, so the record is a row
-- per profile: every browser and every instance reads the same limit.
CREATE TABLE public.profile_calendar_notes_syncs (
  profile_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  auto_synced_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profile_calendar_notes_syncs ENABLE ROW LEVEL SECURITY;

-- The owner may read the row, which is how the route answers "next automatic
-- sync"; only the function below writes it, so a browser cannot move the
-- timestamp back and lift its own limit.
CREATE POLICY "users can view their own calendar notes sync"
  ON public.profile_calendar_notes_syncs
  FOR SELECT
  USING ((select auth.uid()) = profile_id);

REVOKE ALL ON TABLE public.profile_calendar_notes_syncs
  FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.profile_calendar_notes_syncs TO authenticated;
GRANT ALL ON TABLE public.profile_calendar_notes_syncs TO service_role;

-- Claims an automatic push and says whether this call took it, in one
-- statement: two browsers racing produce one claim, because the conflict arm
-- blocks on the row and then re-evaluates its `WHERE` against the winner.
CREATE OR REPLACE FUNCTION public.claim_calendar_notes_auto_sync(
  p_window_days integer
)
RETURNS TABLE(claimed boolean, last_auto_sync timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_profile_id uuid := (select auth.uid());
  v_now timestamptz := now();
  v_stored timestamptz;
BEGIN
  IF v_profile_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000';
  END IF;

  INSERT INTO public.profile_calendar_notes_syncs AS sync
    (profile_id, auto_synced_at)
  VALUES (v_profile_id, v_now)
  ON CONFLICT (profile_id) DO UPDATE
    SET auto_synced_at = v_now
    WHERE sync.auto_synced_at <= v_now - make_interval(days => p_window_days)
  RETURNING sync.auto_synced_at INTO v_stored;

  IF FOUND THEN
    RETURN QUERY SELECT true, v_stored;
    RETURN;
  END IF;

  SELECT sync.auto_synced_at
  INTO v_stored
  FROM public.profile_calendar_notes_syncs AS sync
  WHERE sync.profile_id = v_profile_id;

  RETURN QUERY SELECT false, v_stored;
END;
$function$;

REVOKE ALL ON FUNCTION public.claim_calendar_notes_auto_sync(integer)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_calendar_notes_auto_sync(integer)
  TO authenticated, service_role;
