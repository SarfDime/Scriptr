-- Every metric now has exactly one achievement per rarity tier: 4 metrics x 5
-- tiers = 20 definitions, with thresholds climbing inside each metric.
--
-- `script_stack` moves to uncommon, `popular_creator` to rare and
-- `campus_legend` to epic so each ladder has exactly one row per tier; the
-- legendary slots are new. Rarity is display-only, so moving a tier changes
-- the badge colour and ordering and nothing else. Ids and award rows are
-- untouched.

UPDATE public.achievement_definitions
  SET rarity = 'uncommon'
  WHERE id = 'script_stack';

UPDATE public.achievement_definitions
  SET rarity = 'rare'
  WHERE id = 'popular_creator';

UPDATE public.achievement_definitions
  SET rarity = 'epic'
  WHERE id = 'campus_legend';

INSERT INTO public.achievement_definitions (id, entity_type, metric, threshold, title, description, rarity) VALUES
  ('library_of_scriptr', 'profile', 'scripts_uploaded', 50,
   'Library of Scriptr', 'Fifty scripts shared. You are essentially the faculty archive now.', 'legendary'),
  ('voice_of_the_faculty', 'profile', 'comments_posted', 250,
   'Voice of the Faculty', 'Two hundred and fifty comments. Yours is the answer everyone waits for.', 'legendary'),
  ('script_royalty', 'profile', 'total_script_votes', 1000,
   'Script Royalty', 'A thousand votes across your scripts. They have their own fan club at this point.', 'legendary'),
  ('greatest_hits', 'profile', 'total_script_downloads', 2000,
   'Greatest Hits', 'Two thousand downloads. Somewhere, a printing press is jealous.', 'legendary')
ON CONFLICT (id) DO NOTHING;
