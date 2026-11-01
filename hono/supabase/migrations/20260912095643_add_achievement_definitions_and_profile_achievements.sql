
-- ============================================================
-- Achievement definitions (extensible lookup table — add a new
-- achievement by inserting a row, never a schema migration).
-- entity_type controls which earned-achievement table it can be
-- referenced from (see the trigger on profile_achievements below).
-- Add a new value to the CHECK list only when a genuinely new
-- entity type gains achievements (e.g. 'script').
-- ============================================================
CREATE TABLE public.achievement_definitions (
  id text PRIMARY KEY CHECK (id ~ '^[a-z0-9_]{2,60}$'),
  entity_type text NOT NULL CHECK (entity_type = ANY (ARRAY['profile'])),
  metric text NOT NULL CHECK (char_length(metric) BETWEEN 2 AND 60),
  threshold integer NOT NULL CHECK (threshold > 0),
  title text NOT NULL CHECK (char_length(title) BETWEEN 2 AND 100),
  description text CHECK (description IS NULL OR char_length(description) <= 500),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.achievement_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "achievement definitions are publicly readable" ON public.achievement_definitions
  FOR SELECT USING (true);
CREATE POLICY "admins can insert achievement definitions" ON public.achievement_definitions
  FOR INSERT WITH CHECK (is_admin((select auth.uid())));
CREATE POLICY "admins can update achievement definitions" ON public.achievement_definitions
  FOR UPDATE USING (is_admin((select auth.uid()))) WITH CHECK (is_admin((select auth.uid())));
CREATE POLICY "admins can delete achievement definitions" ON public.achievement_definitions
  FOR DELETE USING (is_admin((select auth.uid())));

INSERT INTO public.achievement_definitions (id, entity_type, metric, threshold, title, description) VALUES
  ('first_upload', 'profile', 'scripts_uploaded', 1, 'First Upload', 'Uploaded your first script'),
  ('prolific_uploader', 'profile', 'scripts_uploaded', 10, 'Prolific Uploader', 'Uploaded 10 scripts'),
  ('popular_creator', 'profile', 'total_script_votes', 50, 'Popular Creator', 'Your scripts collectively received 50 votes'),
  ('active_commenter', 'profile', 'comments_posted', 25, 'Active Commenter', 'Posted 25 comments');

-- ============================================================
-- Earned achievements, per profile. Real FK + cascade delete,
-- unlike a polymorphic table (see explanation above).
-- ============================================================
CREATE TABLE public.profile_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  achievement_id text NOT NULL REFERENCES public.achievement_definitions(id),
  earned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (profile_id, achievement_id)
);

CREATE INDEX idx_profile_achievements_profile_id ON public.profile_achievements(profile_id);
CREATE INDEX idx_profile_achievements_achievement_id ON public.profile_achievements(achievement_id);

CREATE OR REPLACE FUNCTION public.check_profile_achievement_type()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.achievement_definitions
    WHERE id = NEW.achievement_id AND entity_type = 'profile'
  ) THEN
    RAISE EXCEPTION 'achievement "%" is not a valid profile achievement', NEW.achievement_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER profile_achievements_type_check
  BEFORE INSERT OR UPDATE ON public.profile_achievements
  FOR EACH ROW EXECUTE FUNCTION public.check_profile_achievement_type();

ALTER TABLE public.profile_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profile achievements are publicly readable" ON public.profile_achievements
  FOR SELECT USING (true);
CREATE POLICY "admins can award achievements" ON public.profile_achievements
  FOR INSERT WITH CHECK (is_admin((select auth.uid())));
CREATE POLICY "admins can revoke achievements" ON public.profile_achievements
  FOR DELETE USING (is_admin((select auth.uid())));

-- ============================================================
-- Drop the now-redundant jsonb column (table is empty; safe cut)
-- ============================================================
ALTER TABLE public.profiles DROP COLUMN achievements;
;
