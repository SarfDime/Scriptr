-- Flags carry the study of the row they point at, so the moderation queue can
-- be filtered by study without joining through two optional targets every time.
--
-- A flag on a user or a professor has no study and stays owner-only; that is
-- the same rule the RLS policy already applies through `flag_study_id()`.

alter table public.flags
  add column if not exists study_id uuid references public.studies(id) on delete set null;

update public.flags
   set study_id = public.flag_study_id(target_script_id, target_comment_id)
 where study_id is null;

create index if not exists flags_study_recent_idx
  on public.flags (study_id, created_at desc);

create or replace function public.set_flag_study_id()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.study_id := public.flag_study_id(new.target_script_id, new.target_comment_id);
  return new;
end;
$$;

revoke execute on function public.set_flag_study_id() from public;
revoke execute on function public.set_flag_study_id() from anon;
revoke execute on function public.set_flag_study_id() from authenticated;

drop trigger if exists set_flag_study_id on public.flags;
create trigger set_flag_study_id
  before insert or update of target_script_id, target_comment_id on public.flags
  for each row execute function public.set_flag_study_id();
