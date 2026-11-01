-- Supabase grants EXECUTE to anon/authenticated/service_role by default on
-- function creation, independent of PUBLIC. Revoking from PUBLIC alone left
-- anon (i.e. unauthenticated callers) able to hit this via PostgREST directly.
revoke execute on function public.adjust_vote_score(uuid, integer) from anon;
;
