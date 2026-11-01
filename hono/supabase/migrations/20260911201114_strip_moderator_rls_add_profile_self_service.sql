
-- profiles: users can create and delete their own profile (insert/delete were missing entirely)
CREATE POLICY "users can create their own profile" ON public.profiles
  FOR INSERT WITH CHECK ((select auth.uid()) = id);
CREATE POLICY "users can delete their own profile" ON public.profiles
  FOR DELETE USING ((select auth.uid()) = id);

-- comments: own comments only, no moderator override
DROP POLICY IF EXISTS "authors and moderators can delete comments" ON public.comments;
CREATE POLICY "authors can delete their own comments" ON public.comments
  FOR DELETE USING ((select auth.uid()) = author_id);

DROP POLICY IF EXISTS "authors and moderators can edit comments" ON public.comments;
CREATE POLICY "authors can edit their own comments" ON public.comments
  FOR UPDATE USING ((select auth.uid()) = author_id) WITH CHECK ((select auth.uid()) = author_id);

-- scripts: own scripts only, no moderator override
DROP POLICY IF EXISTS "authors and moderators can delete scripts" ON public.scripts;
CREATE POLICY "authors can delete their own scripts" ON public.scripts
  FOR DELETE USING ((select auth.uid()) = author_id);

DROP POLICY IF EXISTS "authors and moderators can update scripts" ON public.scripts;
CREATE POLICY "authors can update their own scripts" ON public.scripts
  FOR UPDATE USING ((select auth.uid()) = author_id) WITH CHECK ((select auth.uid()) = author_id);

-- flags: users can create and see only their own flags; resolving flags is a
-- backend/service-role operation now, not a client-facing RLS privilege
DROP POLICY IF EXISTS "only moderators can resolve flags" ON public.flags;

DROP POLICY IF EXISTS "reporters see own flags, moderators see all" ON public.flags;
CREATE POLICY "reporters see their own flags" ON public.flags
  FOR SELECT USING ((select auth.uid()) = reporter_id);

-- academic-entity-administration junction tables: no moderator RLS write access;
-- managed exclusively via the service-role Sanity-sync backend, matching
-- universities/faculties/studies/subjects/professors
DROP POLICY IF EXISTS "moderators can insert professor studies" ON public.professor_studies;
DROP POLICY IF EXISTS "moderators can delete professor studies" ON public.professor_studies;

DROP POLICY IF EXISTS "moderators can insert subject_professors" ON public.subject_professors;
DROP POLICY IF EXISTS "moderators can update subject_professors" ON public.subject_professors;
DROP POLICY IF EXISTS "moderators can delete subject_professors" ON public.subject_professors;
;
