ALTER TABLE public.profile_restrictions
  ADD COLUMN expires_at timestamptz;

CREATE OR REPLACE FUNCTION public.is_restricted(uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.profile_restrictions
    WHERE profile_id = uid
      AND (expires_at IS NULL OR expires_at > now())
  );
$function$;

CREATE POLICY "admins can update restrictions" ON public.profile_restrictions
  FOR UPDATE
  USING (is_admin((select auth.uid())))
  WITH CHECK (is_admin((select auth.uid())));

CREATE TABLE public.profile_restriction_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  restricted_by uuid NOT NULL REFERENCES public.profiles(id),
  reason text NOT NULL CHECK (char_length(reason) BETWEEN 3 AND 500),
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  lifted_early_at timestamptz
);

CREATE INDEX idx_profile_restriction_history_profile_created_at
  ON public.profile_restriction_history(profile_id, created_at DESC);

ALTER TABLE public.profile_restriction_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins can view restriction history"
  ON public.profile_restriction_history
  FOR SELECT
  USING (is_admin((select auth.uid())));

CREATE POLICY "admins can insert restriction history"
  ON public.profile_restriction_history
  FOR INSERT
  WITH CHECK (is_admin((select auth.uid())));

CREATE POLICY "admins can update restriction history"
  ON public.profile_restriction_history
  FOR UPDATE
  USING (is_admin((select auth.uid())))
  WITH CHECK (is_admin((select auth.uid())));

REVOKE ALL ON TABLE public.profile_restriction_history
  FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.profile_restriction_history
  TO authenticated;
GRANT ALL ON TABLE public.profile_restriction_history TO service_role;

CREATE TABLE public.profile_preferences (
  profile_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  preferences jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profile_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can view their own preferences"
  ON public.profile_preferences
  FOR SELECT
  USING ((select auth.uid()) = profile_id);

CREATE POLICY "users can insert their own preferences"
  ON public.profile_preferences
  FOR INSERT
  WITH CHECK ((select auth.uid()) = profile_id);

CREATE POLICY "users can update their own preferences"
  ON public.profile_preferences
  FOR UPDATE
  USING ((select auth.uid()) = profile_id)
  WITH CHECK ((select auth.uid()) = profile_id);

REVOKE ALL ON TABLE public.profile_preferences FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.profile_preferences TO authenticated;
GRANT ALL ON TABLE public.profile_preferences TO service_role;

REVOKE UPDATE ON TABLE public.notifications FROM PUBLIC, anon, authenticated;
REVOKE UPDATE (
  id,
  profile_id,
  type,
  title,
  body,
  data,
  is_read,
  created_at
) ON TABLE public.notifications FROM PUBLIC, anon, authenticated;
GRANT UPDATE (is_read) ON TABLE public.notifications TO authenticated;
