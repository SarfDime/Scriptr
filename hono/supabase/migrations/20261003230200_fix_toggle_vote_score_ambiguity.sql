CREATE OR REPLACE FUNCTION public.toggle_vote(p_script_id uuid)
RETURNS TABLE(voted boolean, vote_score integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_existing_id uuid;
  v_new_score integer;
  v_voted boolean;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000';
  END IF;

  SELECT script.vote_score
  INTO v_new_score
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

    UPDATE public.scripts AS script
    SET vote_score = GREATEST(0, script.vote_score - 1)
    WHERE script.id = p_script_id
    RETURNING script.vote_score INTO v_new_score;
  ELSE
    IF public.is_restricted(v_user_id) THEN
      RAISE EXCEPTION 'Your account is restricted from voting' USING ERRCODE = '42501';
    END IF;

    INSERT INTO public.votes (user_id, script_id, value)
    VALUES (v_user_id, p_script_id, 1);

    v_voted := true;

    UPDATE public.scripts AS script
    SET vote_score = script.vote_score + 1
    WHERE script.id = p_script_id
    RETURNING script.vote_score INTO v_new_score;
  END IF;

  RETURN QUERY SELECT v_voted, v_new_score;
END;
$function$;
