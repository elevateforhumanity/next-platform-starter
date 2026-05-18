/**
 * Apply migration 007 — alter existing tables to add missing columns,
 * create document_field_mappings, indexes, and RLS policies.
 */
const PAT = process.env.SUPABASE_ACCESS_TOKEN || '';
const PROJECT = 'cuxzzpsyufcewtmicszk';

async function q(sql) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT}/database/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${PAT}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sql }),
  });
  const body = await res.text();
  const preview = sql.replace(/\s+/g, ' ').slice(0, 90);
  if (res.ok) console.log('✅', preview);
  else console.error('❌', res.status, body.slice(0, 200), '\n   SQL:', preview);
  return res.ok;
}

const statements = [
  // ── documents: add extraction columns ──
  `ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS ocr_text TEXT`,
  `ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS ocr_confidence DECIMAL(5,4)`,
  `ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS extracted_data JSONB DEFAULT '{}'`,
  `ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ`,
  `ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS processed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL`,
  `ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS extraction_status TEXT DEFAULT 'pending'`,

  // ── grant_applications: add all new columns ──
  `ALTER TABLE public.grant_applications ADD COLUMN IF NOT EXISTS opportunity_id UUID`,
  `ALTER TABLE public.grant_applications ADD COLUMN IF NOT EXISTS opportunity_title TEXT`,
  `ALTER TABLE public.grant_applications ADD COLUMN IF NOT EXISTS opportunity_number TEXT`,
  `ALTER TABLE public.grant_applications ADD COLUMN IF NOT EXISTS agency_name TEXT`,
  `ALTER TABLE public.grant_applications ADD COLUMN IF NOT EXISTS cfda_number TEXT`,
  `ALTER TABLE public.grant_applications ADD COLUMN IF NOT EXISTS deadline DATE`,
  `ALTER TABLE public.grant_applications ADD COLUMN IF NOT EXISTS award_ceiling BIGINT`,
  `ALTER TABLE public.grant_applications ADD COLUMN IF NOT EXISTS award_floor BIGINT`,
  `ALTER TABLE public.grant_applications ADD COLUMN IF NOT EXISTS opportunity_url TEXT`,
  `ALTER TABLE public.grant_applications ADD COLUMN IF NOT EXISTS org_id UUID`,
  `ALTER TABLE public.grant_applications ADD COLUMN IF NOT EXISTS legal_name TEXT`,
  `ALTER TABLE public.grant_applications ADD COLUMN IF NOT EXISTS ein TEXT`,
  `ALTER TABLE public.grant_applications ADD COLUMN IF NOT EXISTS uei TEXT`,
  `ALTER TABLE public.grant_applications ADD COLUMN IF NOT EXISTS sam_status TEXT`,
  `ALTER TABLE public.grant_applications ADD COLUMN IF NOT EXISTS org_address TEXT`,
  `ALTER TABLE public.grant_applications ADD COLUMN IF NOT EXISTS contact_name TEXT`,
  `ALTER TABLE public.grant_applications ADD COLUMN IF NOT EXISTS contact_email TEXT`,
  `ALTER TABLE public.grant_applications ADD COLUMN IF NOT EXISTS contact_phone TEXT`,
  `ALTER TABLE public.grant_applications ADD COLUMN IF NOT EXISTS project_title TEXT`,
  `ALTER TABLE public.grant_applications ADD COLUMN IF NOT EXISTS executive_summary TEXT`,
  `ALTER TABLE public.grant_applications ADD COLUMN IF NOT EXISTS problem_statement TEXT`,
  `ALTER TABLE public.grant_applications ADD COLUMN IF NOT EXISTS project_description TEXT`,
  `ALTER TABLE public.grant_applications ADD COLUMN IF NOT EXISTS target_population TEXT`,
  `ALTER TABLE public.grant_applications ADD COLUMN IF NOT EXISTS geographic_area TEXT`,
  `ALTER TABLE public.grant_applications ADD COLUMN IF NOT EXISTS goals_and_objectives TEXT`,
  `ALTER TABLE public.grant_applications ADD COLUMN IF NOT EXISTS evaluation_plan TEXT`,
  `ALTER TABLE public.grant_applications ADD COLUMN IF NOT EXISTS sustainability_plan TEXT`,
  `ALTER TABLE public.grant_applications ADD COLUMN IF NOT EXISTS budget_narrative TEXT`,
  `ALTER TABLE public.grant_applications ADD COLUMN IF NOT EXISTS budget_total BIGINT`,
  `ALTER TABLE public.grant_applications ADD COLUMN IF NOT EXISTS partner_agencies TEXT`,
  `ALTER TABLE public.grant_applications ADD COLUMN IF NOT EXISTS attached_document_ids UUID[]`,
  `ALTER TABLE public.grant_applications ADD COLUMN IF NOT EXISTS notes TEXT`,
  `ALTER TABLE public.grant_applications ADD COLUMN IF NOT EXISTS created_by UUID`,

  // ── grant_opportunities: add missing columns ──
  `ALTER TABLE public.grant_opportunities ADD COLUMN IF NOT EXISTS opportunity_number TEXT`,
  `ALTER TABLE public.grant_opportunities ADD COLUMN IF NOT EXISTS agency_code TEXT`,
  `ALTER TABLE public.grant_opportunities ADD COLUMN IF NOT EXISTS cfda_number TEXT`,
  `ALTER TABLE public.grant_opportunities ADD COLUMN IF NOT EXISTS assistance_listing TEXT`,
  `ALTER TABLE public.grant_opportunities ADD COLUMN IF NOT EXISTS posted_date DATE`,
  `ALTER TABLE public.grant_opportunities ADD COLUMN IF NOT EXISTS close_date DATE`,
  `ALTER TABLE public.grant_opportunities ADD COLUMN IF NOT EXISTS archive_date DATE`,
  `ALTER TABLE public.grant_opportunities ADD COLUMN IF NOT EXISTS award_floor BIGINT`,
  `ALTER TABLE public.grant_opportunities ADD COLUMN IF NOT EXISTS estimated_funding BIGINT`,
  `ALTER TABLE public.grant_opportunities ADD COLUMN IF NOT EXISTS eligibility_text TEXT`,
  `ALTER TABLE public.grant_opportunities ADD COLUMN IF NOT EXISTS applicant_types TEXT[]`,
  `ALTER TABLE public.grant_opportunities ADD COLUMN IF NOT EXISTS funding_categories TEXT[]`,
  `ALTER TABLE public.grant_opportunities ADD COLUMN IF NOT EXISTS imported_at TIMESTAMPTZ DEFAULT NOW()`,

  // ── document_field_mappings: create ──
  `CREATE TABLE IF NOT EXISTS public.document_field_mappings (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id     UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    field_key       TEXT NOT NULL,
    field_value     TEXT,
    target_table    TEXT,
    target_column   TEXT,
    target_row_id   UUID,
    approved        BOOLEAN NOT NULL DEFAULT FALSE,
    approved_by     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    approved_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,

  // ── indexes ──
  `CREATE INDEX IF NOT EXISTS idx_grant_applications_status ON public.grant_applications (status, deadline)`,
  `CREATE INDEX IF NOT EXISTS idx_grant_applications_org ON public.grant_applications (org_id)`,
  `CREATE INDEX IF NOT EXISTS idx_grant_opps_close_date ON public.grant_opportunities (close_date DESC NULLS LAST)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_grant_opps_number ON public.grant_opportunities (opportunity_number) WHERE opportunity_number IS NOT NULL`,
  `CREATE INDEX IF NOT EXISTS idx_doc_field_mappings_doc ON public.document_field_mappings (document_id)`,

  // ── RLS ──
  `ALTER TABLE public.document_field_mappings ENABLE ROW LEVEL SECURITY`,
  `DO $pol$ BEGIN
    CREATE POLICY "Admins manage document field mappings"
      ON public.document_field_mappings FOR ALL
      USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin','staff')));
  EXCEPTION WHEN duplicate_object THEN NULL; END $pol$`,

  `ALTER TABLE public.grant_applications ENABLE ROW LEVEL SECURITY`,
  `DO $pol$ BEGIN
    CREATE POLICY "Admins manage grant applications"
      ON public.grant_applications FOR ALL
      USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin','staff')));
  EXCEPTION WHEN duplicate_object THEN NULL; END $pol$`,

  `ALTER TABLE public.grant_opportunities ENABLE ROW LEVEL SECURITY`,
  `DO $pol$ BEGIN
    CREATE POLICY "Admins manage grant opportunities"
      ON public.grant_opportunities FOR ALL
      USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin','staff')));
  EXCEPTION WHEN duplicate_object THEN NULL; END $pol$`,
];

let ok = 0, fail = 0;
for (const sql of statements) {
  const passed = await q(sql);
  passed ? ok++ : fail++;
}
console.log(`\n${ok} ok, ${fail} failed`);
