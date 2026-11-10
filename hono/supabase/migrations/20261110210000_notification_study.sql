-- Notifications carry the study their content belongs to.
--
-- A notification is a personal row — the reader only ever sees their own — so
-- this is not a permission key. It is what lets a content notification point at
-- the study site (`/study/<site_slug>/…`) and, later, filter a tray by study.
-- Account-wide notifications (announcements, restrictions, achievements that are
-- not study-scoped) keep it null.

alter table public.notifications
  add column if not exists study_id uuid
    references public.studies(id) on delete cascade;

create index if not exists notifications_study_recent_idx
  on public.notifications (study_id, created_at desc);

-- Backfill: a flag alert is the only notification whose study can be recovered
-- from rows already stored (it names its target in `data`).
update public.notifications n
   set study_id = public.flag_study_id(
     case when n.data ->> 'target_type' = 'script'
       then (n.data ->> 'target_id')::uuid end,
     case when n.data ->> 'target_type' = 'comment'
       then (n.data ->> 'target_id')::uuid end
   )
 where n.study_id is null
   and n.type = 'flag_threshold';

-- A script's study is guaranteed by its subject (composite FK), but nothing
-- points at `studies` directly, so PostgREST cannot join a script to its study
-- and the generated types have no relationship to embed. The direct FK is what
-- makes `study:studies(site_slug)` work — it is a constraint, not a second
-- source of truth: the trigger still derives `study_id` from the subject.
alter table public.scripts
  drop constraint if exists scripts_study_id_fkey;

alter table public.scripts
  add constraint scripts_study_id_fkey
  foreign key (study_id) references public.studies(id);
