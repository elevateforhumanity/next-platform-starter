// Inspect live DB state before applying pending migrations.
// Read-only. Run: node scripts/inspect-pre-migration.mjs
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SKEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SKEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL/SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

async function q(sql) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SKEY,
      Authorization: `Bearer ${SKEY}`,
    },
    body: JSON.stringify({ sql }),
  });
  const text = await r.text();
  if (!r.ok) return { error: text.slice(0, 300) };
  try {
    return { data: JSON.parse(text) };
  } catch {
    return { data: text };
  }
}

const TABLES_M7 = [
  // FAMILY 1
  'program_enrollments', 'training_enrollments', 'apprenticeship_enrollments', 'cohort_enrollments',
  // FAMILY 2
  'audit_logs', 'admin_audit_events', 'admin_audit_log', 'ai_audit_log',
  // FAMILY 3
  'profiles', 'user_profiles', 'instructor_profiles',
  // FAMILY 4
  'lesson_progress', 'module_progress', 'user_progress', 'video_progress',
  // FAMILY 5
  'notifications', 'admin_notifications', 'apprentice_notifications', 'alert_notifications', 'announcement_recipients',
  // FAMILY 6
  'documents', 'user_documents', 'enrollment_documents', 'apprentice_documents', 'compliance_documents',
  // FAMILY 7
  'apprenticeship_hours', 'apprentice_hours', 'apprentice_hours_log',
  // FAMILY 9
  'user_settings', 'user_preferences', 'notification_preferences', 'feature_flags',
];

const NEW_TABLES = [
  'rag_embeddings', 'platform_events', 'mentorships', 'mentor_sessions', 'mentor_messages', 'mentor_resources',
  'wioa_participants', 'wioa_cases', 'ita_vouchers', 'ai_plan_executions',
];

console.log('\n=== Checking exec_sql RPC ===');
const ping = await q("SELECT 1 AS ok;");
if (ping.error) { console.error('exec_sql failed:', ping.error); process.exit(1); }
console.log('✓ RPC ok');

console.log('\n=== Migration #7 affected tables (exists / rows) ===');
for (const t of TABLES_M7) {
  const r = await q(`SELECT to_regclass('public.${t}') IS NOT NULL AS exists,
    (SELECT count(*) FROM public.${t}) AS rows;`);
  if (r.error) {
    // Likely doesn't exist
    const e = await q(`SELECT to_regclass('public.${t}') IS NOT NULL AS exists;`);
    const exists = e.data?.[0]?.exists ?? '?';
    console.log(`  ${t.padEnd(38)} exists=${exists}  rows=ERR`);
  } else {
    const row = r.data?.[0] ?? {};
    console.log(`  ${t.padEnd(38)} exists=${row.exists}  rows=${row.rows}`);
  }
}

console.log('\n=== New tables that pending migrations create (should NOT exist yet) ===');
for (const t of NEW_TABLES) {
  const r = await q(`SELECT to_regclass('public.${t}') IS NOT NULL AS exists;`);
  console.log(`  ${t.padEnd(28)} exists=${r.data?.[0]?.exists ?? '?'}`);
}

console.log('\n=== Programs state (migration #6 target) ===');
const ps = await q(`SELECT status, count(*) FROM public.programs GROUP BY status ORDER BY status;`);
console.log(ps.data);

console.log('\n=== Programs that would be archived by #6 (currently active) ===');
const dupes = await q(`SELECT slug, status FROM public.programs WHERE slug IN (
  'ai-forklift-safety-certification-1774495387731','ai-advanced-project-management-1774494313718',
  'pub-path-test-1773772605941','gen-acceptance-test-elec-1773765247614',
  'cna-training','cna-cert','cpr-cert','hvac-2024','barber','barber-2024','cosmetology',
  'hair-stylist-esthetician-apprenticeship','nail-technician','nail-tech-apprenticeship',
  'hair-stylist-nail-tech-apprenticeship','phlebotomy-technician','peer-support',
  'peer-recovery-specialist-jri','certified-recovery-specialist','tax-prep','health-safety',
  'dsp-training','bookkeeping-fundamentals','entrepreneurship-small-business','forklift-operator',
  'it-support','it-support-specialist','building-services-technician-apprenticeship',
  'recovery-coach','ems-apprenticeship'
) ORDER BY status, slug;`);
console.log(dupes.data);

console.log('\n=== Courses table existence ===');
const courses = await q(`SELECT to_regclass('public.courses') IS NOT NULL AS exists, count(*) AS rows FROM public.courses;`);
console.log(courses.data ?? courses.error);
