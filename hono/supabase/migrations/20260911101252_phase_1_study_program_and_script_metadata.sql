create table public.study_programs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  faculty_id uuid not null references public.faculties(id) on delete restrict,
  sanity_id text unique,
  created_at timestamptz not null default now(),
  unique (faculty_id, name)
);

alter table public.subjects
  add column study_program_id uuid references public.study_programs(id) on delete restrict;

update public.subjects
set study_program_id = null
where study_program_id is null;

alter table public.subjects
  alter column study_program_id set not null,
  drop column year,
  drop column exam_session;

alter table public.scripts
  add column exam_session text,
  add column additional_reading text[] not null default '{}';

create index study_programs_faculty_id_idx on public.study_programs(faculty_id);
create index subjects_study_program_id_idx on public.subjects(study_program_id);;
