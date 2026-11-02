-- Rarity is data, not code: one of five ordered tiers on each achievement
-- definition, so an admin can pick it when adding a definition later without a
-- schema change. The ordering (common -> legendary) lives in
-- shared/config/achievements.ts (ACHIEVEMENT_RARITIES); the CHECK below only
-- guards the set of valid values.
--
-- `achievement_definitions` has table-level grants (no column-level ACLs), so
-- the new column is readable by the existing public SELECT policy with no
-- extra GRANT.
ALTER TABLE public.achievement_definitions
  ADD COLUMN rarity text NOT NULL DEFAULT 'common'
  CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary'));

UPDATE public.achievement_definitions SET rarity = 'common' WHERE id = 'first_upload';
UPDATE public.achievement_definitions SET rarity = 'uncommon' WHERE id = 'active_commenter';
UPDATE public.achievement_definitions SET rarity = 'rare' WHERE id = 'prolific_uploader';
UPDATE public.achievement_definitions SET rarity = 'epic' WHERE id = 'popular_creator';
