
-- ============================================================
-- 1. Notifications
-- ============================================================
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (char_length(type) BETWEEN 2 AND 50),
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
  body text CHECK (body IS NULL OR char_length(body) <= 1000),
  data jsonb,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_profile_id_created_at
  ON public.notifications(profile_id, created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can see their own notifications" ON public.notifications
  FOR SELECT USING ((select auth.uid()) = profile_id);

CREATE POLICY "admins can create notifications" ON public.notifications
  FOR INSERT WITH CHECK (is_admin((select auth.uid())));

CREATE POLICY "users can update their own notifications" ON public.notifications
  FOR UPDATE USING ((select auth.uid()) = profile_id)
  WITH CHECK ((select auth.uid()) = profile_id);

CREATE POLICY "users can delete their own notifications" ON public.notifications
  FOR DELETE USING ((select auth.uid()) = profile_id);

-- ============================================================
-- 2. Rating types (extensible lookup table — add a new rating
--    type by inserting a row, never a schema migration)
-- ============================================================
CREATE TABLE public.rating_types (
  id text PRIMARY KEY CHECK (id ~ '^[a-z0-9_]{2,40}$'),
  target_type text NOT NULL CHECK (target_type = ANY (ARRAY['professor','subject'])),
  label text NOT NULL CHECK (char_length(label) BETWEEN 2 AND 60),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.rating_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rating types are publicly readable" ON public.rating_types
  FOR SELECT USING (true);
CREATE POLICY "admins can insert rating types" ON public.rating_types
  FOR INSERT WITH CHECK (is_admin((select auth.uid())));
CREATE POLICY "admins can update rating types" ON public.rating_types
  FOR UPDATE USING (is_admin((select auth.uid()))) WITH CHECK (is_admin((select auth.uid())));
CREATE POLICY "admins can delete rating types" ON public.rating_types
  FOR DELETE USING (is_admin((select auth.uid())));

INSERT INTO public.rating_types (id, target_type, label) VALUES
  ('teaching', 'professor', 'Teaching quality'),
  ('attitude', 'professor', 'Attitude'),
  ('clarity', 'professor', 'Clarity'),
  ('difficulty', 'subject', 'Difficulty'),
  ('workload', 'subject', 'Workload');

-- ============================================================
-- 3. Professor ratings (one rating per user, per rating type, per professor)
-- ============================================================
CREATE TABLE public.professor_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professor_id uuid NOT NULL REFERENCES public.professors(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating_type_id text NOT NULL REFERENCES public.rating_types(id),
  score smallint NOT NULL CHECK (score BETWEEN 1 AND 5),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (professor_id, user_id, rating_type_id)
);

CREATE INDEX idx_professor_ratings_professor_id ON public.professor_ratings(professor_id);
CREATE INDEX idx_professor_ratings_user_id ON public.professor_ratings(user_id);
CREATE INDEX idx_professor_ratings_rating_type_id ON public.professor_ratings(rating_type_id);

CREATE OR REPLACE FUNCTION public.check_professor_rating_type()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.rating_types
    WHERE id = NEW.rating_type_id AND target_type = 'professor'
  ) THEN
    RAISE EXCEPTION 'rating_type "%" is not a valid professor rating type', NEW.rating_type_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER professor_ratings_type_check
  BEFORE INSERT OR UPDATE ON public.professor_ratings
  FOR EACH ROW EXECUTE FUNCTION public.check_professor_rating_type();

ALTER TABLE public.professor_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "professor ratings are publicly readable" ON public.professor_ratings
  FOR SELECT USING (true);

CREATE POLICY "users can rate professors" ON public.professor_ratings
  FOR INSERT WITH CHECK (
    (select auth.uid()) = user_id AND NOT is_restricted((select auth.uid()))
  );

CREATE POLICY "users can change their own professor rating" ON public.professor_ratings
  FOR UPDATE USING (
    (select auth.uid()) = user_id AND NOT is_restricted((select auth.uid()))
  ) WITH CHECK (
    (select auth.uid()) = user_id AND NOT is_restricted((select auth.uid()))
  );

CREATE POLICY "users can remove their own professor rating" ON public.professor_ratings
  FOR DELETE USING ((select auth.uid()) = user_id);

-- ============================================================
-- 4. Subject ratings (one rating per user, per rating type, per subject)
-- ============================================================
CREATE TABLE public.subject_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating_type_id text NOT NULL REFERENCES public.rating_types(id),
  score smallint NOT NULL CHECK (score BETWEEN 1 AND 5),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (subject_id, user_id, rating_type_id)
);

CREATE INDEX idx_subject_ratings_subject_id ON public.subject_ratings(subject_id);
CREATE INDEX idx_subject_ratings_user_id ON public.subject_ratings(user_id);
CREATE INDEX idx_subject_ratings_rating_type_id ON public.subject_ratings(rating_type_id);

CREATE OR REPLACE FUNCTION public.check_subject_rating_type()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.rating_types
    WHERE id = NEW.rating_type_id AND target_type = 'subject'
  ) THEN
    RAISE EXCEPTION 'rating_type "%" is not a valid subject rating type', NEW.rating_type_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER subject_ratings_type_check
  BEFORE INSERT OR UPDATE ON public.subject_ratings
  FOR EACH ROW EXECUTE FUNCTION public.check_subject_rating_type();

ALTER TABLE public.subject_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subject ratings are publicly readable" ON public.subject_ratings
  FOR SELECT USING (true);

CREATE POLICY "users can rate subjects" ON public.subject_ratings
  FOR INSERT WITH CHECK (
    (select auth.uid()) = user_id AND NOT is_restricted((select auth.uid()))
  );

CREATE POLICY "users can change their own subject rating" ON public.subject_ratings
  FOR UPDATE USING (
    (select auth.uid()) = user_id AND NOT is_restricted((select auth.uid()))
  ) WITH CHECK (
    (select auth.uid()) = user_id AND NOT is_restricted((select auth.uid()))
  );

CREATE POLICY "users can remove their own subject rating" ON public.subject_ratings
  FOR DELETE USING ((select auth.uid()) = user_id);
;
