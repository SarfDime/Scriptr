-- The profile row and its faculty/study selections are written by one call, so
-- a bad selection id rolls back the username too. Before this, the row was
-- updated first and a failed selection sync left the two out of step.
--
-- SECURITY INVOKER on purpose: the session client keeps RLS and the
-- `(username, full_name)` column grant as the boundary, and the admin route
-- passes the service-role client after its own owner check (the selection
-- tables have no admin RLS path).
--
-- `p_full_name` null keeps the stored value: the route cannot tell "absent"
-- from "null", and validation never accepts clearing the name.
CREATE OR REPLACE FUNCTION public.sync_profile_selections(
  p_profile_id uuid,
  p_username text,
  p_full_name text,
  p_faculty_ids uuid[],
  p_study_ids uuid[]
)
RETURNS public.profiles
LANGUAGE plpgsql
SET search_path = public
AS $function$
DECLARE
  v_profile public.profiles;
BEGIN
  UPDATE public.profiles
     SET username = p_username,
         full_name = coalesce(p_full_name, full_name)
   WHERE id = p_profile_id
  RETURNING * INTO v_profile;

  IF v_profile.id IS NULL THEN
    RETURN NULL;
  END IF;

  IF p_faculty_ids IS NOT NULL THEN
    INSERT INTO public.profile_faculties (profile_id, faculty_id)
    SELECT p_profile_id, selected.id
      FROM unnest(p_faculty_ids) AS selected(id)
    ON CONFLICT DO NOTHING;

    DELETE FROM public.profile_faculties
     WHERE profile_id = p_profile_id
       AND faculty_id <> ALL (p_faculty_ids);
  END IF;

  IF p_study_ids IS NOT NULL THEN
    INSERT INTO public.profile_studies (profile_id, study_id)
    SELECT p_profile_id, selected.id
      FROM unnest(p_study_ids) AS selected(id)
    ON CONFLICT DO NOTHING;

    DELETE FROM public.profile_studies
     WHERE profile_id = p_profile_id
       AND study_id <> ALL (p_study_ids);
  END IF;

  RETURN v_profile;
END;
$function$;

REVOKE ALL ON FUNCTION public.sync_profile_selections(uuid, text, text, uuid[], uuid[])
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.sync_profile_selections(uuid, text, text, uuid[], uuid[])
  TO authenticated, service_role;
