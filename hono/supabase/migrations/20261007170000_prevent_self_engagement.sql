CREATE OR REPLACE FUNCTION public.toggle_vote(p_script_id uuid)
RETURNS TABLE(voted boolean, vote_score integer)
LANGUAGE plpgsql
SECURITY DEFINER
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

  SELECT script.author_id, script.vote_score
  INTO v_author_id, v_new_score
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

    UPDATE public.scripts AS script
    SET vote_score = script.vote_score + 1
    WHERE script.id = p_script_id
    RETURNING script.vote_score INTO v_new_score;
  END IF;

  RETURN QUERY SELECT v_voted, v_new_score;
END;
$function$;

CREATE OR REPLACE FUNCTION public.prevent_self_comment_engagement()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  comment_author_id uuid;
BEGIN
  SELECT comments.author_id
  INTO comment_author_id
  FROM public.comments
  WHERE comments.id = NEW.comment_id;

  IF comment_author_id = auth.uid() THEN
    RAISE EXCEPTION 'You cannot engage with your own comment'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.prevent_self_comment_engagement()
  FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS comment_likes_prevent_self_engagement
  ON public.comment_likes;
CREATE TRIGGER comment_likes_prevent_self_engagement
BEFORE INSERT OR UPDATE OF comment_id, user_id
ON public.comment_likes
FOR EACH ROW
EXECUTE FUNCTION public.prevent_self_comment_engagement();

DROP TRIGGER IF EXISTS comment_reactions_prevent_self_engagement
  ON public.comment_reactions;
CREATE TRIGGER comment_reactions_prevent_self_engagement
BEFORE INSERT OR UPDATE OF comment_id, user_id
ON public.comment_reactions
FOR EACH ROW
EXECUTE FUNCTION public.prevent_self_comment_engagement();
