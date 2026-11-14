-- Script titles and descriptions now hold one value per language:
--   { "en": <Portable Text>, "mk": <Portable Text> }
-- with at least one language filled and any subset allowed. The API validates
-- the language keys, the Portable Text allow-list and the per-language byte
-- limits (`shared/utils/localized-portable-text.ts`); what the column keeps is a
-- backstop: an object or the legacy array, within the combined size cap.
--
-- The array branch stays until every row has been rewrapped by
-- `hono/scripts/backfill-script-locales.ts`; once none is left, the constraint
-- narrows to 'object' only (and this comment goes with it).

ALTER TABLE public.scripts DROP CONSTRAINT IF EXISTS scripts_title_portable_text_check;
ALTER TABLE public.scripts ADD CONSTRAINT scripts_title_portable_text_check
  CHECK (
    jsonb_typeof(title) IN ('array', 'object')
    -- Two languages at the 2 KiB title cap, plus their keys.
    AND octet_length(title::text) <= 4200
  );

ALTER TABLE public.scripts DROP CONSTRAINT IF EXISTS scripts_description_portable_text_check;
ALTER TABLE public.scripts ADD CONSTRAINT scripts_description_portable_text_check
  CHECK (
    description IS NULL
    OR (
      jsonb_typeof(description) IN ('array', 'object')
      -- Two languages at the 50 KiB description cap, plus their keys.
      AND octet_length(description::text) <= 102400
    )
  );
