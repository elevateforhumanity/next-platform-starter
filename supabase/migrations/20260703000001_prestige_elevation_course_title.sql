-- Align LMS course display name with Prestige Elevation branding (barber RTI).
-- Safe to re-run. Apply manually in Supabase SQL Editor.

UPDATE public.courses
SET
  title = 'Prestige Elevation Barber Curriculum',
  description = 'Prestige Elevation Barber Curriculum — 500 hours of related technical instruction (RTI) for the Indiana DOL barber apprenticeship pathway.',
  updated_at = now()
WHERE id = '3fb5ce19-1cde-434c-a8c6-f138d7d7aa17';

-- Verify:
-- SELECT id, title, slug, status FROM public.courses WHERE id = '3fb5ce19-1cde-434c-a8c6-f138d7d7aa17';
