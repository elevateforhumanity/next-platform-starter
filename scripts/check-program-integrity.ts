/**
 * scripts/check-program-integrity.ts
 *
 * Checks every published program for missing required relations.
 * Exits with code 1 if any program is incomplete.
 *
 * Usage:
 *   pnpm tsx scripts/check-program-integrity.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { promises as fs } from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

type Check = { label: string; table: string };

const REQUIRED: Check[] = [
  { label: 'media', table: 'program_media' },
  { label: 'CTAs', table: 'program_ctas' },
  { label: 'tracks', table: 'program_tracks' },
  { label: 'modules', table: 'program_modules' },
];

const STRICT = process.env.STRICT_PROGRAM_INTEGRITY === 'true';
const REPORT_PATH = path.resolve(process.cwd(), 'audit-packet/program-integrity-report.json');

async function main() {
  const { data: programs, error } = await db
    .from('programs')
    .select('id, slug, title')
    .eq('published', true)
    .order('title');

  if (error) {
    console.error('Failed to fetch programs:', error.message);
    process.exit(1);
  }
  if (!programs?.length) {
    console.log('No published programs found.');
    return;
  }

  console.log(`Checking ${programs.length} published program(s)...\n`);

  const membership = new Map<string, Set<string>>();
  for (const check of REQUIRED) {
    const { data: rows, error: rowsError } = await db.from(check.table).select('program_id');
    if (rowsError) {
      console.error(`Failed to load ${check.table}:`, rowsError.message);
      process.exit(1);
    }
    membership.set(
      check.label,
      new Set((rows ?? []).map((row: { program_id: string }) => row.program_id)),
    );
  }

  let failures = 0;
  const report: Array<{ slug: string; title: string; missing: string[] }> = [];

  for (const program of programs) {
    const missing: string[] = [];

    for (const check of REQUIRED) {
      const present = membership.get(check.label)?.has(program.id) ?? false;
      if (!present) missing.push(check.label);
    }

    if (missing.length > 0) {
      console.log(`❌ ${program.slug} — missing: ${missing.join(', ')}`);
      failures++;
      report.push({ slug: program.slug, title: program.title ?? '', missing });
    } else {
      console.log(`✅ ${program.slug}`);
    }
  }

  await fs.mkdir(path.dirname(REPORT_PATH), { recursive: true });
  await fs.writeFile(
    REPORT_PATH,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        strict: STRICT,
        scannedPrograms: programs.length,
        incompletePrograms: failures,
        items: report,
      },
      null,
      2,
    ) + '\n',
    'utf8',
  );

  if (failures > 0) {
    console.log(`\nReport written: ${REPORT_PATH}`);
  }

  console.log(
    `\n${failures === 0 ? '✅ All programs complete.' : `⚠️ ${failures} program(s) incomplete.`}`,
  );

  if (failures > 0 && STRICT) {
    console.error('Strict mode enabled: failing due to incomplete programs.');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
