-- Atomic download counter. The route used to read download_count and write back
-- count + 1, which loses increments under concurrent downloads. This is a single
-- UPDATE, so concurrent calls serialize on the row lock and every one counts.
--
-- Internal only: the download route calls it through the service-role client
-- AFTER its dedupe check, so it must not be callable by anon/authenticated (an
-- earlier increment_download_count bypassed dedupe and was dropped for that
-- reason in 20260906140454_schema_hardening_and_rls_fixes.sql).
CREATE OR REPLACE FUNCTION public.increment_script_download_count(p_script_id uuid)
RETURNS integer
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
AS $$
  UPDATE public.scripts
  SET download_count = download_count + 1
  WHERE id = p_script_id
  RETURNING download_count::integer;
$$;

REVOKE ALL ON FUNCTION public.increment_script_download_count(uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_script_download_count(uuid)
  TO service_role;
