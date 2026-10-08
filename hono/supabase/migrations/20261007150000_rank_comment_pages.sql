CREATE OR REPLACE FUNCTION public.get_top_comment_ids(
  p_script_id uuid,
  p_professor_id uuid,
  p_author_id uuid,
  p_limit integer,
  p_offset integer
)
RETURNS TABLE(comment_id uuid)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF num_nonnulls(p_script_id, p_professor_id, p_author_id) <> 1 THEN
    RAISE EXCEPTION 'Exactly one comment target is required'
      USING ERRCODE = '22023';
  END IF;

  IF p_limit < 1 OR p_limit > 20 OR p_offset < 0 THEN
    RAISE EXCEPTION 'Invalid comment page parameters'
      USING ERRCODE = '22023';
  END IF;

  RETURN QUERY
  WITH target_comments AS MATERIALIZED (
    SELECT comments.id, comments.created_at
    FROM public.comments
    WHERE comments.parent_id IS NULL
      AND (
        (p_script_id IS NOT NULL AND comments.script_id = p_script_id)
        OR (p_professor_id IS NOT NULL AND comments.professor_id = p_professor_id)
        OR (p_author_id IS NOT NULL AND comments.author_id = p_author_id)
      )
  ),
  engagement AS (
    SELECT activity.comment_id, count(*) AS activity_count
    FROM (
      SELECT likes.comment_id
      FROM public.comment_likes AS likes
      INNER JOIN target_comments ON target_comments.id = likes.comment_id
      UNION ALL
      SELECT reactions.comment_id
      FROM public.comment_reactions AS reactions
      INNER JOIN target_comments ON target_comments.id = reactions.comment_id
    ) AS activity
    GROUP BY activity.comment_id
  )
  SELECT target_comments.id
  FROM target_comments
  LEFT JOIN engagement ON engagement.comment_id = target_comments.id
  ORDER BY
    COALESCE(engagement.activity_count, 0) DESC,
    target_comments.created_at DESC,
    target_comments.id ASC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

REVOKE ALL ON FUNCTION public.get_top_comment_ids(uuid, uuid, uuid, integer, integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_top_comment_ids(uuid, uuid, uuid, integer, integer)
  TO anon, authenticated;
