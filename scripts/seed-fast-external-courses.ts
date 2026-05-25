#!/usr/bin/env tsx
/**
 * scripts/seed-fast-external-courses.ts
 *
 * Seeds program_external_courses from data/external-courses/fast-launch.json.
 * Safe to re-run — upserts on (program_id, external_url), never duplicates.
 *
 * Usage:
 *   pnpm tsx scripts/seed-fast-external-courses.ts
 *   pnpm tsx scripts/seed-fast-external-courses.ts --dry-run
 *   pnpm tsx scripts/seed-fast-external-courses.ts --program it-help-desk
 *
 * Flags:
 *   --dry-run          Print what would be inserted/updated without writing
 *   --program <slug>   Only seed courses mapped to this program slug
 *   --reset            Delete all rows for matched programs before seeding
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// ── Args ──────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const RESET = args.includes('--reset');
const programFilter = (() => {
  const idx = args.indexOf('--program');
  return idx !== -1 ? args[idx + 1] : null;
})();

// ── Supabase (service role) ───────────────────────────────────────────────────
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('❌  Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const db = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false },
});

// ── Types ─────────────────────────────────────────────────────────────────────
interface ExternalCourseEntry {
  partner_name: string;
  title: string;
  description?: string;
  external_url: string;
  credential_type?: string;
  credential_name?: string;
  duration_display?: string;
  is_required: boolean;
  manual_completion_enabled: boolean;
  opens_in_new_tab: boolean;
  sort_order: number;
  program_slugs: string[];
  elevate_fee_cents?: number;
  fee_label?: string;
  support_included?: string[];
  payer_rule?: string;
}

// ── Load seed data ────────────────────────────────────────────────────────────
const seedPath = resolve(process.cwd(), 'data/external-courses/fast-launch.json');
const entries: ExternalCourseEntry[] = JSON.parse(readFileSync(seedPath, 'utf-8'));

// ── Resolve program slugs → UUIDs ─────────────────────────────────────────────
async function resolveProgramIds(slugs: string[]): Promise<Map<string, string>> {
  const { data, error } = await db
    .from('programs')
    .select('id, slug')
    .in('slug', slugs);

  if (error) throw new Error(`Program lookup failed: ${error.message}`);

  const map = new Map<string, string>();
  for (const row of data ?? []) map.set(row.slug, row.id);
  return map;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n🌱  Seeding external courses from fast-launch.json`);
  if (DRY_RUN) console.log('   (dry-run — no writes)\n');
  if (programFilter) console.log(`   Filtering to program: ${programFilter}\n`);

  // Collect all unique slugs across all entries
  const allSlugs = [...new Set(entries.flatMap((e) => e.program_slugs))];
  const programMap = await resolveProgramIds(allSlugs);

  const missing = allSlugs.filter((s) => !programMap.has(s));
  if (missing.length) {
    console.warn(`⚠️   Programs not found in DB (will skip): ${missing.join(', ')}`);
  }

  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  for (const entry of entries) {
    const slugsToSeed = programFilter
      ? entry.program_slugs.filter((s) => s === programFilter)
      : entry.program_slugs;

    for (const slug of slugsToSeed) {
      const programId = programMap.get(slug);
      if (!programId) {
        console.log(`   ⏭  skip  [${slug}] ${entry.title} — program not in DB`);
        skipped++;
        continue;
      }

      // Check for existing row
      const { data: existing } = await db
        .from('program_external_courses')
        .select('id, title')
        .eq('program_id', programId)
        .eq('external_url', entry.external_url)
        .maybeSingle();

      const payload = {
        program_id: programId,
        partner_name: entry.partner_name,
        title: entry.title,
        description: entry.description ?? null,
        external_url: entry.external_url,
        credential_type: entry.credential_type ?? null,
        credential_name: entry.credential_name ?? null,
        duration_display: entry.duration_display ?? null,
        is_required: entry.is_required,
        manual_completion_enabled: entry.manual_completion_enabled,
        opens_in_new_tab: entry.opens_in_new_tab,
        sort_order: entry.sort_order,
        is_active: true,
        // Elevate support fee fields
        elevate_fee_cents: entry.elevate_fee_cents ?? 0,
        fee_label: entry.fee_label ?? 'Elevate Program Support Fee',
        support_included: entry.support_included ?? [],
        payer_rule: entry.payer_rule ?? 'always_student',
        cost_cents: entry.elevate_fee_cents ?? 0,
        updated_at: new Date().toISOString(),
      };

      if (RESET && existing) {
        if (!DRY_RUN) {
          await db.from('program_external_courses').delete().eq('id', existing.id);
        }
        console.log(`   🗑  reset [${slug}] ${entry.title}`);
      }

      if (existing && !RESET) {
        if (!DRY_RUN) {
          await db
            .from('program_external_courses')
            .update(payload)
            .eq('id', existing.id);
        }
        console.log(`   ✏️  update [${slug}] ${entry.title}`);
        updated++;
      } else {
        if (!DRY_RUN) {
          const { error } = await db
            .from('program_external_courses')
            .insert(payload);
          if (error) {
            console.error(`   ❌  insert failed [${slug}] ${entry.title}: ${error.message}`);
            continue;
          }
        }
        console.log(`   ✅  insert [${slug}] ${entry.title}`);
        inserted++;
      }
    }
  }

  console.log(`\n📊  Done — inserted: ${inserted}  updated: ${updated}  skipped: ${skipped}`);
  if (DRY_RUN) console.log('   (dry-run — nothing was written)');
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
