
DROP POLICY IF EXISTS "moderators can insert subjects" ON public.subjects;
DROP POLICY IF EXISTS "moderators can update subjects" ON public.subjects;
DROP POLICY IF EXISTS "moderators can delete subjects" ON public.subjects;

DROP POLICY IF EXISTS "moderators can insert professors" ON public.professors;
DROP POLICY IF EXISTS "moderators can update professors" ON public.professors;
DROP POLICY IF EXISTS "moderators can delete professors" ON public.professors;
;
