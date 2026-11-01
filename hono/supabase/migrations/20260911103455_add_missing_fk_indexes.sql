
CREATE INDEX IF NOT EXISTS idx_comment_likes_user_id ON public.comment_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_comment_reactions_user_id ON public.comment_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_author_id ON public.comments(author_id);
CREATE INDEX IF NOT EXISTS idx_flags_reporter_id ON public.flags(reporter_id);
CREATE INDEX IF NOT EXISTS idx_flags_reviewed_by ON public.flags(reviewed_by);
CREATE INDEX IF NOT EXISTS idx_professor_faculties_faculty_id ON public.professor_faculties(faculty_id);
CREATE INDEX IF NOT EXISTS idx_profile_faculties_faculty_id ON public.profile_faculties(faculty_id);
CREATE INDEX IF NOT EXISTS idx_profile_subjects_subject_id ON public.profile_subjects(subject_id);
CREATE INDEX IF NOT EXISTS idx_scripts_faculty_id ON public.scripts(faculty_id);
CREATE INDEX IF NOT EXISTS idx_scripts_subject_professor ON public.scripts(subject_id, professor_id);
;
