CREATE OR REPLACE FUNCTION public.recalc_vote_score()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  affected_script uuid;
BEGIN
  affected_script := COALESCE(NEW.script_id, OLD.script_id);

  UPDATE public.scripts
  SET vote_score = (
    SELECT COALESCE(SUM(value), 0)::integer
    FROM public.votes
    WHERE script_id = affected_script
  )
  WHERE id = affected_script;

  RETURN NULL;
END;
$function$;

CREATE OR REPLACE FUNCTION public.toggle_vote(p_script_id uuid)
RETURNS TABLE(voted boolean, vote_score integer)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_author_id uuid;
  v_existing_id uuid;
  v_new_score integer;
  v_voted boolean;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000';
  END IF;

  SELECT script.author_id
  INTO v_author_id
  FROM public.scripts AS script
  WHERE script.id = p_script_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Script not found' USING ERRCODE = 'P0002';
  END IF;

  SELECT vote.id
  INTO v_existing_id
  FROM public.votes AS vote
  WHERE vote.user_id = v_user_id
    AND vote.script_id = p_script_id;

  IF v_existing_id IS NOT NULL THEN
    DELETE FROM public.votes AS vote
    WHERE vote.id = v_existing_id;

    v_voted := false;
  ELSE
    IF v_author_id = v_user_id THEN
      RAISE EXCEPTION 'You cannot vote on your own script'
        USING ERRCODE = '42501';
    END IF;

    IF public.is_restricted(v_user_id) THEN
      RAISE EXCEPTION 'Your account is restricted from voting'
        USING ERRCODE = '42501';
    END IF;

    INSERT INTO public.votes (user_id, script_id, value)
    VALUES (v_user_id, p_script_id, 1);

    v_voted := true;
  END IF;

  SELECT script.vote_score
  INTO v_new_score
  FROM public.scripts AS script
  WHERE script.id = p_script_id;

  RETURN QUERY SELECT v_voted, v_new_score;
END;
$function$;

DROP TRIGGER IF EXISTS recalc_vote_score_after_change ON public.votes;

CREATE TRIGGER recalc_vote_score_after_change
AFTER INSERT OR DELETE ON public.votes
FOR EACH ROW
EXECUTE FUNCTION public.recalc_vote_score();
