
CREATE OR REPLACE FUNCTION public.check_professor_rating_type()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.rating_types
    WHERE id = NEW.rating_type_id AND target_type = 'professor'
  ) THEN
    RAISE EXCEPTION 'rating_type "%" is not a valid professor rating type', NEW.rating_type_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_subject_rating_type()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.rating_types
    WHERE id = NEW.rating_type_id AND target_type = 'subject'
  ) THEN
    RAISE EXCEPTION 'rating_type "%" is not a valid subject rating type', NEW.rating_type_id;
  END IF;
  RETURN NEW;
END;
$$;
;
