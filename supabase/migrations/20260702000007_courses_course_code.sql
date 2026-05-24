-- Add course_code to public.courses
-- Used by the course builder pipeline to generate short enrollment codes
-- (e.g. "HVAC608", "BARB417") that are human-readable and deterministic.
--
-- Apply in Supabase Dashboard → SQL Editor before running the pipeline.

ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS course_code TEXT;

-- Unique constraint — one code per course, nulls allowed during migration window
DO $$ BEGIN
  ALTER TABLE public.courses ADD CONSTRAINT courses_course_code_key UNIQUE (course_code);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Backfill existing rows using the same deterministic algorithm as generateCourseCode()
-- in lib/course-builder/pipeline.ts:
--   prefix = first 4 alpha chars of slug (uppercase)
--   suffix = first numeric run in slug (last 3 digits), or 3-digit hash
UPDATE public.courses
SET course_code = (
  UPPER(SUBSTRING(REGEXP_REPLACE(slug, '[^a-z]', '', 'gi'), 1, 4))
  ||
  LPAD(
    COALESCE(
      SUBSTRING(slug FROM '[0-9]+'),
      CAST(
        (
          (
            SELECT SUM(ASCII(c) * POW(31, pos))::BIGINT
            FROM UNNEST(STRING_TO_ARRAY(slug, NULL)) WITH ORDINALITY AS t(c, pos)
          ) % 900 + 100
        ) AS TEXT
      )
    ),
    3, '0'
  )
)
WHERE course_code IS NULL;
