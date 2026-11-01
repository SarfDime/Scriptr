
-- flags: restricted users can't file new flags (removing an existing flag stays allowed)
DROP POLICY IF EXISTS "authenticated users can file a flag" ON public.flags;
CREATE POLICY "authenticated users can file a flag" ON public.flags
  FOR INSERT WITH CHECK (
    (select auth.uid()) = reporter_id AND NOT is_restricted((select auth.uid()))
  );

-- comment_likes: restricted users can't add new likes (unliking stays allowed)
DROP POLICY IF EXISTS "Users can like comments" ON public.comment_likes;
CREATE POLICY "Users can like comments" ON public.comment_likes
  FOR INSERT WITH CHECK (
    (select auth.uid()) = user_id AND NOT is_restricted((select auth.uid()))
  );

-- comment_reactions: restricted users can't add or change reactions (removing stays allowed)
DROP POLICY IF EXISTS "Users can add their own reactions" ON public.comment_reactions;
CREATE POLICY "Users can add their own reactions" ON public.comment_reactions
  FOR INSERT WITH CHECK (
    (select auth.uid()) = user_id AND NOT is_restricted((select auth.uid()))
  );

DROP POLICY IF EXISTS "Users can change their own reactions" ON public.comment_reactions;
CREATE POLICY "Users can change their own reactions" ON public.comment_reactions
  FOR UPDATE USING (
    (select auth.uid()) = user_id AND NOT is_restricted((select auth.uid()))
  ) WITH CHECK (
    (select auth.uid()) = user_id AND NOT is_restricted((select auth.uid()))
  );

-- votes: restricted users can't cast or change votes (removing a vote stays allowed)
DROP POLICY IF EXISTS "users can cast their own votes" ON public.votes;
CREATE POLICY "users can cast their own votes" ON public.votes
  FOR INSERT WITH CHECK (
    (select auth.uid()) = user_id AND NOT is_restricted((select auth.uid()))
  );

DROP POLICY IF EXISTS "users can change their own vote" ON public.votes;
CREATE POLICY "users can change their own vote" ON public.votes
  FOR UPDATE USING (
    (select auth.uid()) = user_id AND NOT is_restricted((select auth.uid()))
  ) WITH CHECK (
    (select auth.uid()) = user_id AND NOT is_restricted((select auth.uid()))
  );
;
