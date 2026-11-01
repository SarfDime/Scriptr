
CREATE POLICY "reporters can remove their own flags" ON public.flags
  FOR DELETE USING ((select auth.uid()) = reporter_id);
;
