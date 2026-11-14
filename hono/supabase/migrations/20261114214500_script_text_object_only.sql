-- Script text is one object per language:
--   { "en": <Portable Text>, "mk": <Portable Text> }
-- with at least one language filled and any subset allowed. The API validates
-- the language keys, the Portable Text allow-list and the per-language byte
-- limits (`shared/utils/localized-portable-text.ts`); the column is a backstop
-- for the shape and the combined size cap.
--
-- The pre-localization array shape was accepted while
-- `hono/scripts/backfill-script-locales.ts` was still needed. Every row has
-- been rewrapped, so the array branch is gone and the shape is enforced.

ALTER TABLE public.scripts DROP CONSTRAINT IF EXISTS scripts_title_portable_text_check;
ALTER TABLE public.scripts ADD CONSTRAINT scripts_title_portable_text_check
  CHECK (
    jsonb_typeof(title) = 'object'
    -- Two languages at the 2 KiB title cap, plus their keys.
    AND octet_length(title::text) <= 4200
  );

ALTER TABLE public.scripts DROP CONSTRAINT IF EXISTS scripts_description_portable_text_check;
ALTER TABLE public.scripts ADD CONSTRAINT scripts_description_portable_text_check
  CHECK (
    description IS NULL
    OR (
      jsonb_typeof(description) = 'object'
      -- Two languages at the 50 KiB description cap, plus their keys.
      AND octet_length(description::text) <= 102400
    )
  );
