-- adjust_vote_score took a raw delta, which meant any authenticated client
-- could call the RPC directly with an arbitrary value and inflate a script's
-- vote_score without ever touching the votes table's one-vote constraint.
-- Replacing it with a single atomic toggle keyed off auth.uid() internally:
-- no client-supplied delta, no separate insert-then-rpc round trip to drift
-- out of sync, and the restriction check now lives in the same statement
-- instead of relying on the caller to hit RLS and translate the error.

drop function if exists public.adjust_vote_score(uuid, integer);

create or replace function public.toggle_vote(p_script_id uuid)
returns table(voted boolean, vote_score integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_existing_id uuid;
  v_new_score integer;
  v_voted boolean;
begin
  if v_user_id is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  if is_restricted(v_user_id) then
    raise exception 'Your account is restricted from voting' using errcode = '42501';
  end if;

  select id into v_existing_id
  from votes
  where user_id = v_user_id and script_id = p_script_id;

  if v_existing_id is not null then
    delete from votes where id = v_existing_id;
    v_voted := false;
    update scripts
      set vote_score = greatest(0, vote_score - 1)
      where id = p_script_id
      returning scripts.vote_score into v_new_score;
  else
    insert into votes (user_id, script_id, value) values (v_user_id, p_script_id, 1);
    v_voted := true;
    update scripts
      set vote_score = vote_score + 1
      where id = p_script_id
      returning scripts.vote_score into v_new_score;
  end if;

  if v_new_score is null then
    raise exception 'Script not found' using errcode = 'P0002';
  end if;

  return query select v_voted, v_new_score;
end;
$$;

revoke all on function public.toggle_vote(uuid) from public;
revoke all on function public.toggle_vote(uuid) from anon;
grant execute on function public.toggle_vote(uuid) to authenticated;
;
