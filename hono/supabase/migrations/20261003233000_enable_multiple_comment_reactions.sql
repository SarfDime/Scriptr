ALTER TABLE public.comment_reactions
  DROP CONSTRAINT comment_reactions_unique_user;

ALTER TABLE public.comment_reactions
  ADD CONSTRAINT comment_reactions_unique_user_reaction_type
  UNIQUE (comment_id, user_id, reaction_type);
