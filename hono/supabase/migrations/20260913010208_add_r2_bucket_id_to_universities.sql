alter table public.universities
  add column r2_bucket_id text;

alter table public.universities
  add constraint universities_r2_bucket_id_key unique (r2_bucket_id);

alter table public.universities
  add constraint universities_r2_bucket_id_format check (
    r2_bucket_id is null
    or r2_bucket_id ~ '^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$'
  );
;
