alter table public.subjects drop column faculty_id;
create index subjects_name_idx on public.subjects(name);;
