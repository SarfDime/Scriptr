-- Replaces the five-argument version: PostgREST types a function's arguments as
-- non-null, so the optional parts of a PATCH body (the full name, either
-- selection list) could not be passed as null. One payload carries the
-- validated body, and a key that is present is a field that was sent.
--
-- SECURITY INVOKER for the same reason as before: the session client keeps RLS
-- and the `(username, full_name)` column grant as the boundary.
DROP FUNCTION IF EXISTS public.sync_profile_selections(uuid, text, text, uuid[], uuid[]);

CREATE OR REPLACE FUNCTION public.sync_profile_selections(
  p_profile_id uuid,
  p_input jsonb
)
RETURNS public.profiles
LANGUAGE plpgsql
SET search_path = public
AS $function$
DECLARE
  v_profile public.profiles;
  v_faculty_ids uuid[];
  v_study_ids uuid[];
BEGIN
  IF jsonb_typeof(p_input) <> 'object' OR p_input->>'username' IS NULL THEN
    RAISE EXCEPTION 'A username is required' USING ERRCODE = '22023';
  END IF;

  UPDATE public.profiles
     SET username = p_input->>'username',
         full_name = CASE
           WHEN p_input ? 'full_name' THEN p_input->>'full_name'
           ELSE full_name
         END
   WHERE id = p_profile_id
  RETURNING * INTO v_profile;

  IF v_profile.id IS NULL THEN
    RETURN NULL;
  END IF;

  IF p_input ? 'selected_faculty_ids' THEN
    SELECT coalesce(array_agg(DISTINCT selected.value::uuid), '{}')
      INTO v_faculty_ids
      FROM jsonb_array_elements_text(p_input->'selected_faculty_ids') AS selected;

    INSERT INTO public.profile_faculties (profile_id, faculty_id)
    SELECT p_profile_id, unnest(v_faculty_ids)
    ON CONFLICT DO NOTHING;

    DELETE FROM public.profile_faculties
     WHERE profile_id = p_profile_id
       AND faculty_id <> ALL (v_faculty_ids);
  END IF;

  IF p_input ? 'selected_study_ids' THEN
    SELECT coalesce(array_agg(DISTINCT selected.value::uuid), '{}')
      INTO v_study_ids
      FROM jsonb_array_elements_text(p_input->'selected_study_ids') AS selected;

    INSERT INTO public.profile_studies (profile_id, study_id)
    SELECT p_profile_id, unnest(v_study_ids)
    ON CONFLICT DO NOTHING;

    DELETE FROM public.profile_studies
     WHERE profile_id = p_profile_id
       AND study_id <> ALL (v_study_ids);
  END IF;

  RETURN v_profile;
END;
$function$;

REVOKE ALL ON FUNCTION public.sync_profile_selections(uuid, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.sync_profile_selections(uuid, jsonb)
  TO authenticated, service_role;
