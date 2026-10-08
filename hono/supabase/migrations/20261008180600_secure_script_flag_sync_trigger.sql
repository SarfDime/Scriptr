ALTER FUNCTION public.sync_script_flagged() SECURITY DEFINER;

REVOKE EXECUTE ON FUNCTION public.sync_script_flagged() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.sync_script_flagged() FROM anon;
REVOKE EXECUTE ON FUNCTION public.sync_script_flagged() FROM authenticated;
