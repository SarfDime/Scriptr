-- A rating criterion's name is authored in both languages:
--   { "en": "Difficulty", "mk": "Тежина" }
-- with at least one language filled (any subset allowed). The API validates the
-- keys and the per-language 2-60 character rule
-- (`isLocalizedRatingLabel` in shared/utils/rating-label.utils.ts); the column is a
-- backstop for the shape.
--
-- Replaces the single `label`, which was English-only and rendered untranslated
-- in the Macedonian UI. `label` is kept (as nullable) for one deploy so a build
-- that still reads it keeps working; the project removes it once this shape is
-- live everywhere (see docs/PROGRESS.md).

ALTER TABLE public.rating_types ADD COLUMN labels jsonb;

-- The existing label becomes the English one. The criteria seeded with the
-- table get their Macedonian label here; a criterion an admin added later is
-- translated from the admin page.
UPDATE public.rating_types
SET labels =
  jsonb_build_object('en', label) ||
  CASE id
    WHEN 'teaching' THEN jsonb_build_object('mk', 'Квалитет на настава')
    WHEN 'attitude' THEN jsonb_build_object('mk', 'Однос')
    WHEN 'clarity' THEN jsonb_build_object('mk', 'Јасност')
    WHEN 'difficulty' THEN jsonb_build_object('mk', 'Тежина')
    WHEN 'workload' THEN jsonb_build_object('mk', 'Обем на работа')
    ELSE '{}'::jsonb
  END;

ALTER TABLE public.rating_types ALTER COLUMN labels SET NOT NULL;

ALTER TABLE public.rating_types ADD CONSTRAINT rating_types_labels_check CHECK (
  jsonb_typeof(labels) = 'object'
  -- Two 60-character labels, plus their keys.
  AND octet_length(labels::text) <= 1000
  AND (labels ? 'en' OR labels ? 'mk')
  AND (
    NOT labels ? 'en'
    OR (
      jsonb_typeof(labels->'en') = 'string'
      AND char_length(labels->>'en') BETWEEN 2 AND 60
    )
  )
  AND (
    NOT labels ? 'mk'
    OR (
      jsonb_typeof(labels->'mk') = 'string'
      AND char_length(labels->>'mk') BETWEEN 2 AND 60
    )
  )
);

-- Nothing writes `label` any more; dropping the NOT NULL is what lets the new
-- code insert a criterion with only `labels`. The column itself goes in a
-- follow-up migration, after every deployment reads `labels`.
ALTER TABLE public.rating_types ALTER COLUMN label DROP NOT NULL;
