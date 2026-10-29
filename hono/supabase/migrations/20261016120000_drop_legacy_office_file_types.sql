ALTER TABLE public.script_files
  DROP CONSTRAINT script_files_file_type_check;

ALTER TABLE public.script_files
  ADD CONSTRAINT script_files_file_type_check
  CHECK (
    file_type = ANY (
      ARRAY[
        'pdf'::text,
        'jpg'::text,
        'jpeg'::text,
        'png'::text,
        'webp'::text,
        'md'::text,
        'docx'::text,
        'xlsx'::text
      ]
    )
  );
