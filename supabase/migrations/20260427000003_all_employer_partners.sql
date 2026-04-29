-- Seed all employer partners across Elevate's program network.
-- These are hiring partners, clinical sites, and apprenticeship employers
-- that appear on the /about/partners page and in MOU workflows.
-- Apply in Supabase Dashboard → SQL Editor

-- Ensure the partners table has the columns added in migration 20260427000002
ALTER TABLE public.partners
  ADD COLUMN IF NOT EXISTS mou_version       TEXT;
ALTER TABLE public.partners
  ADD COLUMN IF NOT EXISTS mou_pdf_url       TEXT;
ALTER TABLE public.partners
  ADD COLUMN IF NOT EXISTS mou_sent_at       TIMESTAMPTZ;
ALTER TABLE public.partners
  ADD COLUMN IF NOT EXISTS partner_type_detail TEXT;

-- ── Healthcare Employer Partners ──────────────────────────────────────────────

INSERT INTO public.partners (name, partner_type, partner_type_detail, city, state, description, is_active, display_order)
VALUES
  ('Eskenazi Health',           'employer', 'healthcare', 'Indianapolis', 'IN', 'Safety-net hospital system — CNA and medical assistant hiring partner.', true, 200),
  ('IU Health',                 'employer', 'healthcare', 'Indianapolis', 'IN', 'Statewide health system — clinical placement and hiring partner.', true, 201),
  ('Community Health Network',  'employer', 'healthcare', 'Indianapolis', 'IN', 'Regional health network — CNA and phlebotomy hiring partner.', true, 202),
  ('Franciscan Health',         'employer', 'healthcare', 'Indianapolis', 'IN', 'Catholic health system — clinical hiring partner.', true, 203),
  ('American Senior Communities','employer', 'healthcare', 'Indianapolis', 'IN', 'Long-term care employer — CNA hiring partner.', true, 204),
  ('Trilogy Health Services',   'employer', 'healthcare', 'Indianapolis', 'IN', 'Senior living employer — CNA and medication aide hiring partner.', true, 205)
ON CONFLICT (name) DO UPDATE SET
  partner_type         = EXCLUDED.partner_type,
  partner_type_detail  = EXCLUDED.partner_type_detail,
  is_active            = EXCLUDED.is_active,
  updated_at           = now();

-- ── Skilled Trades Employer Partners ─────────────────────────────────────────

INSERT INTO public.partners (name, partner_type, partner_type_detail, city, state, description, is_active, display_order)
VALUES
  ('Gaylor Electric',           'employer', 'electrical',    'Indianapolis', 'IN', 'Commercial electrical contractor — apprenticeship hiring partner.', true, 300),
  ('Hagerman Group',            'employer', 'construction',  'Indianapolis', 'IN', 'General contractor — skilled trades hiring partner.', true, 301),
  ('Rieth-Riley Construction',  'employer', 'construction',  'Indianapolis', 'IN', 'Heavy civil contractor — equipment operator hiring partner.', true, 302),
  ('Summers Plumbing Heating',  'employer', 'plumbing',      'Indianapolis', 'IN', 'Plumbing and HVAC contractor — apprenticeship hiring partner.', true, 303),
  ('Midwest Mole',              'employer', 'construction',  'Indianapolis', 'IN', 'Underground utility contractor — skilled trades hiring partner.', true, 304)
ON CONFLICT (name) DO UPDATE SET
  partner_type         = EXCLUDED.partner_type,
  partner_type_detail  = EXCLUDED.partner_type_detail,
  is_active            = EXCLUDED.is_active,
  updated_at           = now();

-- ── CDL / Transportation Employer Partners ────────────────────────────────────

INSERT INTO public.partners (name, partner_type, partner_type_detail, city, state, description, is_active, display_order)
VALUES
  ('Celadon Trucking',          'employer', 'cdl_transportation', 'Indianapolis', 'IN', 'Regional trucking company — CDL-A hiring partner.', true, 400),
  ('Ruan Transportation',       'employer', 'cdl_transportation', 'Indianapolis', 'IN', 'Dedicated contract carrier — CDL hiring partner.', true, 401),
  ('Heartland Express',         'employer', 'cdl_transportation', 'Indianapolis', 'IN', 'Truckload carrier — CDL-A hiring partner.', true, 402)
ON CONFLICT (name) DO UPDATE SET
  partner_type         = EXCLUDED.partner_type,
  partner_type_detail  = EXCLUDED.partner_type_detail,
  is_active            = EXCLUDED.is_active,
  updated_at           = now();

-- ── Workforce / Government Partners ──────────────────────────────────────────

INSERT INTO public.partners (name, partner_type, city, state, description, is_active, display_order)
VALUES
  ('WorkOne Indianapolis',      'workforce',   'Indianapolis', 'IN', 'Indiana Department of Workforce Development — WIOA funding and referrals.', true, 10),
  ('Indiana DWD',               'government',  'Indianapolis', 'IN', 'Indiana Department of Workforce Development — state workforce agency.', true, 11),
  ('FSSA Indiana',              'government',  'Indianapolis', 'IN', 'Indiana Family and Social Services Administration — SNAP-ET contract.', true, 12),
  ('Marion County WorkOne',     'workforce',   'Indianapolis', 'IN', 'Local workforce board — WIOA Title I services and co-enrollment.', true, 13)
ON CONFLICT (name) DO UPDATE SET
  partner_type = EXCLUDED.partner_type,
  is_active    = EXCLUDED.is_active,
  updated_at   = now();

-- ── Certification / Credential Partners ──────────────────────────────────────

INSERT INTO public.partners (name, partner_type, city, state, description, is_active, display_order)
VALUES
  ('NHA — National Healthcareer Association', 'certification', 'Leawood', 'KS', 'Credential body for CNA, phlebotomy, EKG, and medical assistant certifications.', true, 20),
  ('ESCO Group',                              'certification', 'Stuart',  'FL', 'EPA 608 certification testing for HVAC technicians.', true, 21),
  ('NCCER',                                   'certification', 'Alachua', 'FL', 'National Center for Construction Education and Research — craft credentials.', true, 22),
  ('Indiana IPLA',                            'certification', 'Indianapolis', 'IN', 'Indiana Professional Licensing Agency — cosmetology and barbering licenses.', true, 23)
ON CONFLICT (name) DO UPDATE SET
  partner_type = EXCLUDED.partner_type,
  is_active    = EXCLUDED.is_active,
  updated_at   = now();
