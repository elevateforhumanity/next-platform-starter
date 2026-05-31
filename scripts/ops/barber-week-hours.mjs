#!/usr/bin/env node
/**
 * Log 40 approved OJL hours for the current ISO week for barber apprentices.
 * Default: Natalia Roa, Jordan White, Mercedes Wellington (production IDs).
 *
 *   node scripts/ops/barber-week-hours.mjs
 *   node scripts/ops/barber-week-hours.mjs --hours 40 --dry-run
 */
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { createClient } from '@supabase/supabase-js';

const ROOT = process.cwd();
const BARBER_APPRENTICES = [
  { id: '2d761d18-6ff9-4355-b9dd-5ff55903906b', name: 'Natalia Roa' },
  { id: 'b35f3289-614b-4c6e-b029-73617fc46655', name: 'Jordan White' },
  { id: '70483e3b-30f1-4c58-8046-d068ab7356ee', name: 'Mercedes Wellington' },
];

function loadEnvLocal() {
  const p = join(ROOT, '.env.local');
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i < 0) continue;
    const k = t.slice(0, i);
    let v = t.slice(i + 1);
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'")))
      v = v.slice(1, -1);
    if (!process.env[k]) process.env[k] = v;
  }
}

function fridayOfWeek(d = new Date()) {
  const x = new Date(d);
  const day = x.getUTCDay();
  const diff = day <= 5 ? 5 - day : 5 - day + 7;
  x.setUTCDate(x.getUTCDate() + diff);
  return x.toISOString().slice(0, 10);
}

function mondayOfWeek(d = new Date()) {
  const x = new Date(d);
  const day = x.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setUTCDate(x.getUTCDate() + diff);
  return x.toISOString().slice(0, 10);
}

loadEnvLocal();

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const hoursIdx = args.indexOf('--hours');
const hours = hoursIdx >= 0 ? parseFloat(args[hoursIdx + 1]) : 40;

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key || key === 'placeholder') {
  console.error('Missing real Supabase credentials in .env.local');
  process.exit(1);
}

const db = createClient(url, key, { auth: { persistSession: false } });
const workDate = fridayOfWeek();
const weekStart = mondayOfWeek();
const programSlug = 'barber-apprenticeship';
const note = `Week of ${weekStart} — ${hours}h OJL (admin batch ${new Date().toISOString().slice(0, 10)})`;

console.log(`Barber week hours: ${hours}h each, work_date=${workDate}, program=${programSlug}`);
if (dryRun) console.log('DRY RUN — no writes\n');

for (const apprentice of BARBER_APPRENTICES) {
  const { data: existing } = await db
    .from('hour_entries')
    .select('id, hours_claimed, status')
    .eq('user_id', apprentice.id)
    .eq('program_slug', programSlug)
    .eq('work_date', workDate)
    .eq('source_type', 'ojl')
    .maybeSingle();

  if (existing) {
    console.log(`${apprentice.name}: already has entry ${existing.id} (${existing.hours_claimed}h, ${existing.status})`);
    if (!dryRun && Number(existing.hours_claimed) !== hours) {
      const { error } = await db
        .from('hour_entries')
        .update({
          hours_claimed: hours,
          accepted_hours: hours,
          status: 'approved',
          notes: note,
          approved_at: new Date().toISOString(),
          approved_by: 'scripts/ops/barber-week-hours.mjs',
        })
        .eq('id', existing.id);
      if (error) console.error('  update failed:', error.message);
      else console.log('  → updated to', hours, 'approved');
    }
    continue;
  }

  const row = {
    user_id: apprentice.id,
    program_slug: programSlug,
    work_date: workDate,
    hours_claimed: hours,
    accepted_hours: hours,
    source_type: 'ojl',
    category: 'on-the-job',
    notes: note,
    entered_by_email: 'ops@elevateforhumanity.org',
    status: 'approved',
    approved_at: new Date().toISOString(),
    approved_by: 'scripts/ops/barber-week-hours.mjs',
  };

  if (dryRun) {
    console.log(`${apprentice.name}: would insert`, row);
    continue;
  }

  const { data, error } = await db.from('hour_entries').insert(row).select('id').single();
  if (error) console.error(`${apprentice.name}: INSERT failed:`, error.message);
  else console.log(`${apprentice.name}: inserted hour_entries ${data.id} (${hours}h approved)`);
}

console.log('\nDone.');
