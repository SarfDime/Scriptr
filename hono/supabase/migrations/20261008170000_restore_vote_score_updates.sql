ALTER FUNCTION public.toggle_vote(uuid) SECURITY DEFINER;

REVOKE EXECUTE ON FUNCTION public.toggle_vote(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.toggle_vote(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.toggle_vote(uuid) TO authenticated;

CREATE TRIGGER recalc_vote_score_after_change
AFTER INSERT OR DELETE ON public.votes
FOR EACH ROW
EXECUTE FUNCTION public.recalc_vote_score();
