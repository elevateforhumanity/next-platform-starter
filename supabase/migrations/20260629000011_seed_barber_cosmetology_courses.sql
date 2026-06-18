-- Seed comprehensive courses for beauty apprenticeships with Milady-aligned modules
-- These courses will be visible in the LMS and Host Shop Admin

-- Check if barber course exists, if not create it
INSERT INTO public.courses (
  program_id,
  slug,
  title,
  short_description,
  description,
  status,
  is_active,
  category,
  duration_hours,
  passing_score,
  published_at,
  created_at,
  updated_at
)
SELECT 
  p.id,
  'barber-apprenticeship-course',
  'Barber Apprenticeship - Complete Course',
  '2,000-hour DOL registered apprenticeship with Milady Standards',
  'Comprehensive barber apprenticeship covering all Milady standards, Indiana state board exam preparation, and hands-on OJT training. Compliant with DOL registered apprenticeship requirements.',
  'published',
  true,
  'Barber Apprenticeship',
  2000,
  80,
  now(),
  now(),
  now()
FROM public.programs p
WHERE p.slug = 'barber-apprenticeship'
  AND NOT EXISTS (SELECT 1 FROM public.courses WHERE slug = 'barber-apprenticeship-course')
ON CONFLICT (slug) DO NOTHING;

-- Check if cosmetology course exists, if not create it
INSERT INTO public.courses (
  program_id,
  slug,
  title,
  short_description,
  description,
  status,
  is_active,
  category,
  duration_hours,
  passing_score,
  published_at,
  created_at,
  updated_at
)
SELECT 
  p.id,
  'cosmetology-apprenticeship-course',
  'Cosmetology Apprenticeship - Complete Course',
  '2,000-hour apprenticeship with Milady Standards & State Board Prep',
  'Indiana cosmetology license apprenticeship following Milady standards, preparing for Indiana cosmetology license exam.',
  'published',
  true,
  'Cosmetology',
  2000,
  80,
  now(),
  now(),
  now()
FROM public.programs p
WHERE p.slug = 'cosmetology-apprenticeship'
  AND NOT EXISTS (SELECT 1 FROM public.courses WHERE slug = 'cosmetology-apprenticeship-course')
ON CONFLICT (slug) DO NOTHING;

-- Esthetician course
INSERT INTO public.courses (
  program_id,
  slug,
  title,
  short_description,
  description,
  status,
  is_active,
  category,
  duration_hours,
  passing_score,
  published_at,
  created_at,
  updated_at
)
SELECT 
  p.id,
  'esthetician-apprenticeship-course',
  'Esthetician Apprenticeship - Complete Course',
  '700-hour Indiana esthetician license with Milady Standards',
  'Comprehensive esthetics apprenticeship covering advanced skin care, facial treatments, and Indiana state board exam preparation.',
  'published',
  true,
  'Esthetician',
  700,
  80,
  now(),
  now(),
  now()
FROM public.programs p
WHERE p.slug = 'esthetician-apprenticeship'
  AND NOT EXISTS (SELECT 1 FROM public.courses WHERE slug = 'esthetician-apprenticeship-course')
ON CONFLICT (slug) DO NOTHING;

-- Nail technician course
INSERT INTO public.courses (
  program_id,
  slug,
  title,
  short_description,
  description,
  status,
  is_active,
  category,
  duration_hours,
  passing_score,
  published_at,
  created_at,
  updated_at
)
SELECT 
  p.id,
  'nail-technician-apprenticeship-course',
  'Nail Technician Apprenticeship - Complete Course',
  '400-hour Indiana nail technician license with Milady Standards',
  'Complete nail technician apprenticeship covering manicures, pedicures, nail enhancements, and Indiana state board exam prep.',
  'published',
  true,
  'Nail Technology',
  400,
  80,
  now(),
  now(),
  now()
FROM public.programs p
WHERE p.slug = 'nail-technician-apprenticeship'
  AND NOT EXISTS (SELECT 1 FROM public.courses WHERE slug = 'nail-technician-apprenticeship-course')
ON CONFLICT (slug) DO NOTHING;

-- Verify courses
SELECT slug, title, category, duration_hours, is_active 
FROM public.courses 
WHERE slug LIKE '%apprenticeship-course'
ORDER BY category;
