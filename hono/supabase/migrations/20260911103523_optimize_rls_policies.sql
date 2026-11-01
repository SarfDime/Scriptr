
-- comment_likes
DROP POLICY IF EXISTS "Users can like comments" ON public.comment_likes;
CREATE POLICY "Users can like comments" ON public.comment_likes
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can unlike comments" ON public.comment_likes;
CREATE POLICY "Users can unlike comments" ON public.comment_likes
  FOR DELETE USING ((select auth.uid()) = user_id);

-- comment_reactions
DROP POLICY IF EXISTS "Users can add their own reactions" ON public.comment_reactions;
CREATE POLICY "Users can add their own reactions" ON public.comment_reactions
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can change their own reactions" ON public.comment_reactions;
CREATE POLICY "Users can change their own reactions" ON public.comment_reactions
  FOR UPDATE USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can remove their own reactions" ON public.comment_reactions;
CREATE POLICY "Users can remove their own reactions" ON public.comment_reactions
  FOR DELETE USING ((select auth.uid()) = user_id);

-- comments
DROP POLICY IF EXISTS "authenticated users can comment" ON public.comments;
CREATE POLICY "authenticated users can comment" ON public.comments
  FOR INSERT WITH CHECK ((select auth.uid()) = author_id);

DROP POLICY IF EXISTS "authors and moderators can delete comments" ON public.comments;
CREATE POLICY "authors and moderators can delete comments" ON public.comments
  FOR DELETE USING ((select auth.uid()) = author_id OR is_moderator((select auth.uid())));

DROP POLICY IF EXISTS "authors and moderators can edit comments" ON public.comments;
CREATE POLICY "authors and moderators can edit comments" ON public.comments
  FOR UPDATE USING ((select auth.uid()) = author_id OR is_moderator((select auth.uid())))
  WITH CHECK ((select auth.uid()) = author_id OR is_moderator((select auth.uid())));

-- download_events
DROP POLICY IF EXISTS "Users can see their own download events" ON public.download_events;
CREATE POLICY "Users can see their own download events" ON public.download_events
  FOR SELECT USING ((select auth.uid()) = user_id);

-- flags
DROP POLICY IF EXISTS "authenticated users can file a flag" ON public.flags;
CREATE POLICY "authenticated users can file a flag" ON public.flags
  FOR INSERT WITH CHECK ((select auth.uid()) = reporter_id);

DROP POLICY IF EXISTS "only moderators can resolve flags" ON public.flags;
CREATE POLICY "only moderators can resolve flags" ON public.flags
  FOR UPDATE USING (is_moderator((select auth.uid()))) WITH CHECK (is_moderator((select auth.uid())));

DROP POLICY IF EXISTS "reporters see own flags, moderators see all" ON public.flags;
CREATE POLICY "reporters see own flags, moderators see all" ON public.flags
  FOR SELECT USING ((select auth.uid()) = reporter_id OR is_moderator((select auth.uid())));

-- professors: split ALL policy so it stops duplicating the public SELECT policy
DROP POLICY IF EXISTS "moderators manage professors" ON public.professors;
CREATE POLICY "moderators can insert professors" ON public.professors
  FOR INSERT WITH CHECK (is_moderator((select auth.uid())));
CREATE POLICY "moderators can update professors" ON public.professors
  FOR UPDATE USING (is_moderator((select auth.uid()))) WITH CHECK (is_moderator((select auth.uid())));
CREATE POLICY "moderators can delete professors" ON public.professors
  FOR DELETE USING (is_moderator((select auth.uid())));

-- profile_faculties: split ALL policy so it stops duplicating the public SELECT policy
DROP POLICY IF EXISTS "Users can manage their own faculty enrollments" ON public.profile_faculties;
CREATE POLICY "Users can insert their own faculty enrollments" ON public.profile_faculties
  FOR INSERT WITH CHECK ((select auth.uid()) = profile_id);
CREATE POLICY "Users can update their own faculty enrollments" ON public.profile_faculties
  FOR UPDATE USING ((select auth.uid()) = profile_id) WITH CHECK ((select auth.uid()) = profile_id);
CREATE POLICY "Users can delete their own faculty enrollments" ON public.profile_faculties
  FOR DELETE USING ((select auth.uid()) = profile_id);

-- profile_subjects: split ALL policy so it stops duplicating the public SELECT policy
DROP POLICY IF EXISTS "Users manage their own subjects" ON public.profile_subjects;
CREATE POLICY "Users can insert their own subjects" ON public.profile_subjects
  FOR INSERT WITH CHECK ((select auth.uid()) = profile_id);
CREATE POLICY "Users can update their own subjects" ON public.profile_subjects
  FOR UPDATE USING ((select auth.uid()) = profile_id) WITH CHECK ((select auth.uid()) = profile_id);
CREATE POLICY "Users can delete their own subjects" ON public.profile_subjects
  FOR DELETE USING ((select auth.uid()) = profile_id);

-- profiles
DROP POLICY IF EXISTS "users can update their own profile" ON public.profiles;
CREATE POLICY "users can update their own profile" ON public.profiles
  FOR UPDATE USING ((select auth.uid()) = id) WITH CHECK ((select auth.uid()) = id);

-- script_favorites
DROP POLICY IF EXISTS "Users can favorite scripts" ON public.script_favorites;
CREATE POLICY "Users can favorite scripts" ON public.script_favorites
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can unfavorite scripts" ON public.script_favorites;
CREATE POLICY "Users can unfavorite scripts" ON public.script_favorites
  FOR DELETE USING ((select auth.uid()) = user_id);

-- scripts: drop the redundant/superseded duplicates, optimize the ones that remain
DROP POLICY IF EXISTS "Users can insert scripts" ON public.scripts;
DROP POLICY IF EXISTS "Scripts are viewable by everyone" ON public.scripts;
DROP POLICY IF EXISTS "Users can update their own scripts" ON public.scripts;

DROP POLICY IF EXISTS "authenticated users can create their own scripts" ON public.scripts;
CREATE POLICY "authenticated users can create their own scripts" ON public.scripts
  FOR INSERT WITH CHECK ((select auth.uid()) = author_id);

DROP POLICY IF EXISTS "non-flagged scripts are publicly readable, plus own/moderator" ON public.scripts;
CREATE POLICY "non-flagged scripts are publicly readable, plus own/moderator" ON public.scripts
  FOR SELECT USING (is_flagged = false OR author_id = (select auth.uid()) OR is_moderator((select auth.uid())));

DROP POLICY IF EXISTS "authors and moderators can update scripts" ON public.scripts;
CREATE POLICY "authors and moderators can update scripts" ON public.scripts
  FOR UPDATE USING ((select auth.uid()) = author_id OR is_moderator((select auth.uid())))
  WITH CHECK ((select auth.uid()) = author_id OR is_moderator((select auth.uid())));

DROP POLICY IF EXISTS "authors and moderators can delete scripts" ON public.scripts;
CREATE POLICY "authors and moderators can delete scripts" ON public.scripts
  FOR DELETE USING ((select auth.uid()) = author_id OR is_moderator((select auth.uid())));

-- subject_professors: split ALL policy so it stops duplicating the public SELECT policy
DROP POLICY IF EXISTS "moderators manage subject_professors" ON public.subject_professors;
CREATE POLICY "moderators can insert subject_professors" ON public.subject_professors
  FOR INSERT WITH CHECK (is_moderator((select auth.uid())));
CREATE POLICY "moderators can update subject_professors" ON public.subject_professors
  FOR UPDATE USING (is_moderator((select auth.uid()))) WITH CHECK (is_moderator((select auth.uid())));
CREATE POLICY "moderators can delete subject_professors" ON public.subject_professors
  FOR DELETE USING (is_moderator((select auth.uid())));

-- subjects: drop exact-duplicate SELECT policy, split ALL policy
DROP POLICY IF EXISTS "subjects are publicly readable" ON public.subjects;

DROP POLICY IF EXISTS "moderators manage subjects" ON public.subjects;
CREATE POLICY "moderators can insert subjects" ON public.subjects
  FOR INSERT WITH CHECK (is_moderator((select auth.uid())));
CREATE POLICY "moderators can update subjects" ON public.subjects
  FOR UPDATE USING (is_moderator((select auth.uid()))) WITH CHECK (is_moderator((select auth.uid())));
CREATE POLICY "moderators can delete subjects" ON public.subjects
  FOR DELETE USING (is_moderator((select auth.uid())));

-- votes
DROP POLICY IF EXISTS "users can cast their own votes" ON public.votes;
CREATE POLICY "users can cast their own votes" ON public.votes
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "users can change their own vote" ON public.votes;
CREATE POLICY "users can change their own vote" ON public.votes
  FOR UPDATE USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "users can remove their own vote" ON public.votes;
CREATE POLICY "users can remove their own vote" ON public.votes
  FOR DELETE USING ((select auth.uid()) = user_id);

-- study_programs: was RLS-enabled with zero policies (fully locked). Add public read to match sibling reference tables.
CREATE POLICY "study_programs are publicly readable" ON public.study_programs
  FOR SELECT USING (true);
;
