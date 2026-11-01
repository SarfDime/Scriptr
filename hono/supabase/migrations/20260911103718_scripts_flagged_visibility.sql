
DROP POLICY IF EXISTS "non-flagged scripts are publicly readable, plus own/moderator" ON public.scripts;
CREATE POLICY "scripts are publicly readable" ON public.scripts
  FOR SELECT USING (true);
;
