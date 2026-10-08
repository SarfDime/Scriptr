CREATE OR REPLACE FUNCTION public.get_script_comment_counts(p_script_ids uuid[])
RETURNS TABLE(script_id uuid, comment_count integer)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF p_script_ids IS NULL OR cardinality(p_script_ids) > 100 THEN
    RAISE EXCEPTION 'At most 100 script IDs may be counted at once'
      USING ERRCODE = '22023';
  END IF;

  RETURN QUERY
  SELECT comments.script_id, count(comments.id)::integer
  FROM public.comments
  WHERE comments.script_id = ANY(p_script_ids)
    AND comments.parent_id IS NULL
  GROUP BY comments.script_id;
END;
$$;

REVOKE ALL ON FUNCTION public.get_script_comment_counts(uuid[])
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_script_comment_counts(uuid[])
  TO anon, authenticated;
