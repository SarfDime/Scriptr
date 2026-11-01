-- Atomic, race-free vote_score adjustment. A regular voter has no RLS UPDATE
-- path on someone else's script row (scripts UPDATE is author-or-admin only),
-- so this runs as security definer to make the single, narrow exception:
-- bump vote_score by exactly +1/-1, clamped at zero, in one statement.

create or replace function public.adjust_vote_score(p_script_id uuid, p_delta integer)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  new_score integer;
begin
  update scripts
  set vote_score = greatest(0, vote_score + p_delta)
  where id = p_script_id
  returning vote_score into new_score;

  return new_score;
end;
$$;

revoke all on function public.adjust_vote_score(uuid, integer) from public;
grant execute on function public.adjust_vote_score(uuid, integer) to authenticated;
;
