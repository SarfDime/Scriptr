-- The upload route stores objects under <prefix>/<random uuid>.<ext> and used to
-- discard the uploader's file name, so the UI could only say "File 1". Keep the
-- original name for display. Nullable on purpose: rows created before this
-- migration have no recoverable name and fall back to the positional label.
-- script_files has table-level grants, so the new column needs no extra grant.
alter table public.script_files
  add column file_name text;

alter table public.script_files
  add constraint script_files_file_name_length
  check (file_name is null or char_length(file_name) between 1 and 255);
