-- The achievements authored so far belong to the one study that has content.
--
-- Nothing in the platform scoped them before, so every definition was global by
-- omission. With study scoping in place they would keep counting across every
-- study, which is not what they were written for: they were written for LBE.
-- Global achievements will be added deliberately later, so this only fills rows
-- that still have no scope.
--
-- Existing awards are untouched: `profile_achievements` points at the definition
-- id, and the id does not change.

update public.achievement_definitions d
   set study_id = s.id
  from public.studies s
 where s.site_slug = 'lbe'
   and d.study_id is null;
