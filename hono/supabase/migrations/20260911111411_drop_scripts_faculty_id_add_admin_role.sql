
-- 1. Drop the stale scripts.faculty_id column (leftover from before study_programs existed;
--    faculty is now correctly derived via subject_id -> study_program_id -> faculty_id).
ALTER TABLE public.scripts DROP CONSTRAINT IF EXISTS scripts_faculty_id_fkey;
DROP INDEX IF EXISTS public.idx_scripts_faculty_id;
ALTER TABLE public.scripts DROP COLUMN IF EXISTS faculty_id;

-- 2. Add 'admin' to the allowed profile roles (student, moderator, admin).
ALTER TABLE public.profiles DROP CONSTRAINT profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
  CHECK (role = ANY (ARRAY['student'::text, 'moderator'::text, 'admin'::text]));
;
