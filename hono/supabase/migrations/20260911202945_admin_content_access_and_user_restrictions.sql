
-- 1. Restriction tracking: presence of a row = user is restricted.
--    A separate table (rather than a column on profiles) so a restricted user
--    can't touch the flag via their own "update own profile" policy.
CREATE TABLE public.profile_restrictions (
  profile_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  restricted_by uuid NOT NULL REFERENCES public.profiles(id),
  reason text NOT NULL CHECK (char_length(reason) BETWEEN 3 AND 500),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_profile_restrictions_restricted_by ON public.profile_restrictions(restricted_by);

ALTER TABLE public.profile_restrictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can see their own restriction, admins see all" ON public.profile_restrictions
  FOR SELECT USING ((select auth.uid()) = profile_id OR is_admin((select auth.uid())));
CREATE POLICY "admins can restrict a user" ON public.profile_restrictions
  FOR INSERT WITH CHECK (is_admin((select auth.uid())));
CREATE POLICY "admins can lift a restriction" ON public.profile_restrictions
  FOR DELETE USING (is_admin((select auth.uid())));

-- Helper mirroring is_admin()/is_moderator().
CREATE OR REPLACE FUNCTION public.is_restricted(uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $function$
  select exists (select 1 from public.profile_restrictions where profile_id = uid);
$function$;

-- 2. scripts: admins get full create/update/delete; restricted users are
--    blocked from creating or updating (not deleting) their own scripts.
DROP POLICY IF EXISTS "authenticated users can create their own scripts" ON public.scripts;
CREATE POLICY "authenticated users can create their own scripts" ON public.scripts
  FOR INSERT WITH CHECK (
    ((select auth.uid()) = author_id AND NOT is_restricted((select auth.uid())))
    OR is_admin((select auth.uid()))
  );

DROP POLICY IF EXISTS "authors can update their own scripts" ON public.scripts;
CREATE POLICY "authors can update their own scripts" ON public.scripts
  FOR UPDATE USING (
    ((select auth.uid()) = author_id AND NOT is_restricted((select auth.uid())))
    OR is_admin((select auth.uid()))
  ) WITH CHECK (
    ((select auth.uid()) = author_id AND NOT is_restricted((select auth.uid())))
    OR is_admin((select auth.uid()))
  );

DROP POLICY IF EXISTS "authors can delete their own scripts" ON public.scripts;
CREATE POLICY "authors and admins can delete scripts" ON public.scripts
  FOR DELETE USING ((select auth.uid()) = author_id OR is_admin((select auth.uid())));

-- 3. comments: same pattern as scripts.
DROP POLICY IF EXISTS "authenticated users can comment" ON public.comments;
CREATE POLICY "authenticated users can comment" ON public.comments
  FOR INSERT WITH CHECK (
    ((select auth.uid()) = author_id AND NOT is_restricted((select auth.uid())))
    OR is_admin((select auth.uid()))
  );

DROP POLICY IF EXISTS "authors can edit their own comments" ON public.comments;
CREATE POLICY "authors can edit their own comments" ON public.comments
  FOR UPDATE USING (
    ((select auth.uid()) = author_id AND NOT is_restricted((select auth.uid())))
    OR is_admin((select auth.uid()))
  ) WITH CHECK (
    ((select auth.uid()) = author_id AND NOT is_restricted((select auth.uid())))
    OR is_admin((select auth.uid()))
  );

DROP POLICY IF EXISTS "authors can delete their own comments" ON public.comments;
CREATE POLICY "authors and admins can delete comments" ON public.comments
  FOR DELETE USING ((select auth.uid()) = author_id OR is_admin((select auth.uid())));

-- 4. profiles: admins get full create/update/delete on any profile.
DROP POLICY IF EXISTS "users can create their own profile" ON public.profiles;
CREATE POLICY "users can create their own profile" ON public.profiles
  FOR INSERT WITH CHECK ((select auth.uid()) = id OR is_admin((select auth.uid())));

DROP POLICY IF EXISTS "users can update their own profile" ON public.profiles;
CREATE POLICY "users can update their own profile" ON public.profiles
  FOR UPDATE USING ((select auth.uid()) = id OR is_admin((select auth.uid())))
  WITH CHECK ((select auth.uid()) = id OR is_admin((select auth.uid())));

DROP POLICY IF EXISTS "users can delete their own profile" ON public.profiles;
CREATE POLICY "users can delete their own profile" ON public.profiles
  FOR DELETE USING ((select auth.uid()) = id OR is_admin((select auth.uid())));
;
