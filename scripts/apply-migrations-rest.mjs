/**
 * Apply pending migrations via Supabase REST API (exec_sql RPC or direct table ops).
 * Falls back to checking table existence via REST when exec_sql is unavailable.
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://cuxzzpsyufcewtmicszk.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_KEY) {
  console.error('SUPABASE_SERVICE_ROLE_KEY is required to probe migration tables via REST.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

// Split SQL into individual statements (strip comments, split on ;)
function splitStatements(sql) {
  return sql
    .replace(/--[^\n]*/g, '')
    .split(/;\s*\n/)
    .map(s => s.trim())
    .filter(s => s.length > 10);
}

async function tableExists(tableName) {
  const { data, error } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public')
    .eq('table_name', tableName)
    .limit(1);
  if (error) {
    // Try direct REST probe
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${tableName}?select=id&limit=1`, {
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` }
    });
    return res.status !== 404 && res.status !== 400;
  }
  return (data?.length ?? 0) > 0;
}

async function checkTables() {
  const tables = [
    'curriculum_uploads',
    'contract_templates',
    'contract_template_fields',
    'contract_prefill_runs',
    'contract_signature_fields',
    'contract_exports',
    'contract_audit_logs',
    'grant_applications',
    'grant_opportunities',
    'document_field_mappings',
  ];

  console.log('\nChecking table existence via REST API...\n');
  for (const t of tables) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${t}?select=id&limit=1`, {
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` }
    });
    const exists = res.status === 200 || res.status === 206;
    const status = exists ? '✅' : '❌ MISSING';
    console.log(`  ${status} ${t} (HTTP ${res.status})`);
  }
}

await checkTables();

console.log('\n─────────────────────────────────────────────────────');
console.log('Migration files are ready in supabase/migrations/');
console.log('Apply these in Supabase Dashboard SQL Editor:');
console.log('  https://supabase.com/dashboard/project/cuxzzpsyufcewtmicszk/sql');
console.log('');
console.log('Files to apply (in order):');
const files = [
  'supabase/migrations/20260701000006_curriculum_uploads.sql',
  'supabase/migrations/20260701000007_document_intel_and_grant_applications.sql',
  'supabase/migrations/20260701000008_contract_automation.sql',
];
for (const f of files) {
  try {
    const content = readFileSync(f, 'utf-8');
    console.log(`\n  📄 ${f} (${content.length} chars)`);
  } catch {
    console.log(`  ⚠️  ${f} — not found`);
  }
}
console.log('\n─────────────────────────────────────────────────────\n');
