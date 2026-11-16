-- `labels` replaced `label` in 20261115013000_rating_type_labels.sql; nothing
-- reads or writes the English-only column any more.
ALTER TABLE public.rating_types DROP COLUMN label;
