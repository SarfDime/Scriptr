
-- Student enrollment in one or more study programs
CREATE TABLE public.profile_study_programs (
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  study_program_id uuid NOT NULL REFERENCES public.study_programs(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (profile_id, study_program_id)
);

-- Professor affiliation with one or more study programs
CREATE TABLE public.professor_study_programs (
  professor_id uuid NOT NULL REFERENCES public.professors(id) ON DELETE CASCADE,
  study_program_id uuid NOT NULL REFERENCES public.study_programs(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (professor_id, study_program_id)
);

ALTER TABLE public.profile_study_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professor_study_programs ENABLE ROW LEVEL SECURITY;

-- Mirror the pattern used by profile_faculties / professor_faculties:
-- publicly readable, owner (or moderator, for professor data) manages writes.
CREATE POLICY "Profile study programs are viewable by everyone" ON public.profile_study_programs
  FOR SELECT USING (true);
CREATE POLICY "Users can insert their own study programs" ON public.profile_study_programs
  FOR INSERT WITH CHECK ((select auth.uid()) = profile_id);
CREATE POLICY "Users can delete their own study programs" ON public.profile_study_programs
  FOR DELETE USING ((select auth.uid()) = profile_id);

CREATE POLICY "Professor study program mappings are viewable by everyone" ON public.professor_study_programs
  FOR SELECT USING (true);
CREATE POLICY "moderators can insert professor study programs" ON public.professor_study_programs
  FOR INSERT WITH CHECK (is_moderator((select auth.uid())));
CREATE POLICY "moderators can delete professor study programs" ON public.professor_study_programs
  FOR DELETE USING (is_moderator((select auth.uid())));

CREATE INDEX idx_profile_study_programs_study_program_id ON public.profile_study_programs(study_program_id);
CREATE INDEX idx_professor_study_programs_study_program_id ON public.professor_study_programs(study_program_id);
;
