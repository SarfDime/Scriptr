-- Achievement catalogue pass: friendlier names for the four seeded rows and a
-- wider ladder across all four metrics.
--
-- Ids are unchanged for the existing rows. An award is permanent and references
-- its definition by id, so renaming is safe (holders just see the new copy)
-- while changing an id would orphan or drop their award.
--
-- New rows are plain data: the award helper reads definitions on the next
-- qualifying action, so nobody needs backfilling and nothing else has to change.
-- Thresholds climb inside a metric; rarity climbs with the effort.

UPDATE public.achievement_definitions
  SET title = 'Fresh Off the Press',
      description = 'Your first script is out in the wild. Somebody is about to study from it.',
      rarity = 'common'
  WHERE id = 'first_upload';

UPDATE public.achievement_definitions
  SET title = 'Script Hoarder',
      description = 'Ten scripts shared. Your folder is turning into a library.',
      rarity = 'rare'
  WHERE id = 'prolific_uploader';

UPDATE public.achievement_definitions
  SET title = 'Vote Magnet',
      description = 'Fifty votes across your scripts. People go looking for your notes now.',
      rarity = 'epic'
  WHERE id = 'popular_creator';

UPDATE public.achievement_definitions
  SET title = 'Thread Goblin',
      description = 'Twenty-five comments. You basically live in the discussion at this point.',
      rarity = 'rare'
  WHERE id = 'active_commenter';

INSERT INTO public.achievement_definitions (id, entity_type, metric, threshold, title, description, rarity) VALUES
  -- scripts_uploaded
  ('script_stack', 'profile', 'scripts_uploaded', 3,
   'Starter Stack', 'Three scripts in. The collection has officially begun.', 'common'),
  ('syllabus_keeper', 'profile', 'scripts_uploaded', 25,
   'Syllabus Keeper', 'Twenty-five scripts shared — the whole semester is archived for the next generation.', 'epic'),

  -- comments_posted
  ('first_word', 'profile', 'comments_posted', 1,
   'First Word', 'You broke the silence with a comment.', 'common'),
  ('study_buddy', 'profile', 'comments_posted', 10,
   'Study Buddy', 'Ten comments. Somebody''s question got answered because of you.', 'uncommon'),
  ('seminar_speaker', 'profile', 'comments_posted', 100,
   'Seminar Speaker', 'A hundred comments. The discussion tends to start with you.', 'epic'),

  -- total_script_votes
  ('seal_of_approval', 'profile', 'total_script_votes', 1,
   'Seal of Approval', 'Your first upvote landed. Validation tastes good, doesn''t it?', 'common'),
  ('crowd_pleaser', 'profile', 'total_script_votes', 10,
   'Crowd Pleaser', 'Ten votes across your scripts. The crowd is paying attention.', 'uncommon'),
  ('campus_legend', 'profile', 'total_script_votes', 250,
   'Campus Legend', 'Two hundred and fifty votes. Your scripts are basically folklore now.', 'legendary'),

  -- total_script_downloads
  ('someone_noticed', 'profile', 'total_script_downloads', 1,
   'Someone Noticed', 'Your script was downloaded for the first time.', 'common'),
  ('in_demand', 'profile', 'total_script_downloads', 10,
   'In Demand', 'Ten downloads. Study groups are passing your notes around.', 'uncommon'),
  ('exam_season_hero', 'profile', 'total_script_downloads', 100,
   'Exam Season Hero', 'A hundred downloads — you are somebody''s last-minute rescue.', 'rare'),
  ('viral_syllabus', 'profile', 'total_script_downloads', 500,
   'Viral Syllabus', 'Five hundred downloads. Half the faculty has a copy by now.', 'epic')
ON CONFLICT (id) DO NOTHING;
