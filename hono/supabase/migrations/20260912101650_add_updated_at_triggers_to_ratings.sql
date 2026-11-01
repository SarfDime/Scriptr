
CREATE TRIGGER trg_professor_ratings_updated_at
  BEFORE UPDATE ON public.professor_ratings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_subject_ratings_updated_at
  BEFORE UPDATE ON public.subject_ratings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
;
