DROP TRIGGER IF EXISTS recalc_vote_score_after_change ON public.votes;
REVOKE EXECUTE ON FUNCTION public.recalc_vote_score() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.recalc_vote_score() FROM anon;
REVOKE EXECUTE ON FUNCTION public.recalc_vote_score() FROM authenticated;;
