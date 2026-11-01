
-- Mirrors is_moderator(), but for the admin role.
CREATE OR REPLACE FUNCTION public.is_admin(uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $function$
  select exists (select 1 from public.profiles where id = uid and role = 'admin');
$function$;

-- Only admins can resolve/dismiss flags (set status, reviewed_by, reviewed_at).
CREATE POLICY "admins can resolve flags" ON public.flags
  FOR UPDATE USING (is_admin((select auth.uid())))
  WITH CHECK (is_admin((select auth.uid())));
;
