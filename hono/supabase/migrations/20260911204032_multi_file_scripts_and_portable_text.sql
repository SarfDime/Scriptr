
-- 1. title -> Portable Text (jsonb array of blocks), size-capped
ALTER TABLE public.scripts DROP CONSTRAINT IF EXISTS scripts_title_check;
ALTER TABLE public.scripts DROP COLUMN title;
ALTER TABLE public.scripts ADD COLUMN title jsonb NOT NULL;
ALTER TABLE public.scripts ADD CONSTRAINT scripts_title_portable_text_check
  CHECK (jsonb_typeof(title) = 'array' AND octet_length(title::text) <= 2000);

-- 2. description -> Portable Text (jsonb array of blocks), size-capped, still nullable
ALTER TABLE public.scripts DROP COLUMN description;
ALTER TABLE public.scripts ADD COLUMN description jsonb;
ALTER TABLE public.scripts ADD CONSTRAINT scripts_description_portable_text_check
  CHECK (description IS NULL OR (jsonb_typeof(description) = 'array' AND octet_length(description::text) <= 50000));

-- 3. Replace single file_url/file_type with a one-to-many script_files table
ALTER TABLE public.scripts DROP CONSTRAINT IF EXISTS scripts_file_type_check;
ALTER TABLE public.scripts DROP COLUMN file_url;
ALTER TABLE public.scripts DROP COLUMN file_type;

CREATE TABLE public.script_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  script_id uuid NOT NULL REFERENCES public.scripts(id) ON DELETE CASCADE,
  file_url text NOT NULL,
  file_type text NOT NULL CHECK (
    file_type = ANY (ARRAY['pdf','jpg','jpeg','png','webp','md','doc','docx','xls','xlsx'])
  ),
  file_size_bytes integer NOT NULL CHECK (file_size_bytes > 0),
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_script_files_script_id ON public.script_files(script_id);

ALTER TABLE public.script_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "script files are publicly readable" ON public.script_files
  FOR SELECT USING (true);

CREATE POLICY "authors can attach files to their own scripts" ON public.script_files
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.scripts s
      WHERE s.id = script_id
        AND s.author_id = (select auth.uid())
        AND NOT is_restricted((select auth.uid()))
    )
    OR is_admin((select auth.uid()))
  );

CREATE POLICY "authors and admins can delete script files" ON public.script_files
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.scripts s
      WHERE s.id = script_id AND s.author_id = (select auth.uid())
    )
    OR is_admin((select auth.uid()))
  );
;
