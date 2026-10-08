REVOKE SELECT ON TABLE public.comments FROM PUBLIC, anon, authenticated;
REVOKE SELECT (is_flagged) ON TABLE public.comments FROM PUBLIC, anon, authenticated;

GRANT SELECT (
  id,
  author_id,
  content,
  created_at,
  edited,
  parent_id,
  professor_id,
  script_id,
  updated_at
) ON TABLE public.comments TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.enforce_comment_reply_target()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  parent_script_id uuid;
  parent_professor_id uuid;
BEGIN
  IF NEW.parent_id IS NOT NULL THEN
    SELECT script_id, professor_id
      INTO parent_script_id, parent_professor_id
      FROM public.comments
      WHERE id = NEW.parent_id
      FOR SHARE;

    IF FOUND AND (
      NEW.script_id IS DISTINCT FROM parent_script_id OR
      NEW.professor_id IS DISTINCT FROM parent_professor_id
    ) THEN
      RAISE EXCEPTION 'Reply target must match its parent comment'
        USING ERRCODE = '23514';
    END IF;
  END IF;

  IF TG_OP = 'UPDATE' AND (
    NEW.script_id IS DISTINCT FROM OLD.script_id OR
    NEW.professor_id IS DISTINCT FROM OLD.professor_id
  ) AND EXISTS (
    SELECT 1
      FROM public.comments AS child
      WHERE child.parent_id = NEW.id
        AND (
          child.script_id IS DISTINCT FROM NEW.script_id OR
          child.professor_id IS DISTINCT FROM NEW.professor_id
        )
  ) THEN
    RAISE EXCEPTION 'Comment target must match all reply targets'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS comments_enforce_reply_target ON public.comments;

CREATE TRIGGER comments_enforce_reply_target
BEFORE INSERT OR UPDATE OF parent_id, script_id, professor_id
ON public.comments
FOR EACH ROW
EXECUTE FUNCTION public.enforce_comment_reply_target();
