#!/usr/bin/env tsx
/**
 * Schema drift auditor.
 *
 * Scans all TypeScript source files for Supabase .select() calls, extracts
 * the column names being requested, then cross-references them against the
 * canonical column list derived from supabase/migrations/*.sql.
 *
 * Usage:
 *   pnpm tsx scripts/audit-schema-drift.ts
 *   pnpm tsx scripts/audit-schema-drift.ts --table program_enrollments
 *   pnpm tsx scripts/audit-schema-drift.ts --fail-on-drift   # exit 1 if any drift found
 *
 * Output: a table of every .select() call with columns that cannot be
 * confirmed in the migration history, grouped by table name.
 *
 * Limitations:
 * - Column extraction uses regex, not a full TS parser. Dynamic selects
 *   (template literals, variables) are flagged as "dynamic — skipped".
 * - Migration parsing is additive: it finds CREATE TABLE + ADD COLUMN
 *   statements. It does not model DROP COLUMN or RENAME COLUMN, so a
 *   dropped column may still appear as "known". Run against a live DB
 *   for authoritative results when credentials are available.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── CLI args ──────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const filterTable = args.find((a, i) => args[i - 1] === '--table') ?? null;
const failOnDrift = args.includes('--fail-on-drift');

// ─── Step 1: Build known-columns map from migrations ──────────────────────────

type TableSchema = Map<string, Set<string>>; // table → Set<column>

function parseMigrations(migrationsDir: string): TableSchema {
  const schema: TableSchema = new Map();

  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort()
    .map((f) => path.join(migrationsDir, f));

  for (const file of files) {
    const sql = fs.readFileSync(file, 'utf8');

    // CREATE TABLE [IF NOT EXISTS] [public.]table_name ( col type, ... )
    const createTableRe =
      /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?(\w+)\s*\(([^;]+?)\);/gis;
    let m: RegExpExecArray | null;

    while ((m = createTableRe.exec(sql)) !== null) {
      const tableName = m[1].toLowerCase();
      const body = m[2];
      if (!schema.has(tableName)) schema.set(tableName, new Set());
      const cols = schema.get(tableName)!;

      // Each line that starts with an identifier (not a constraint keyword)
      const lineRe = /^\s+"?(\w+)"?\s+\w/gm;
      let lm: RegExpExecArray | null;
      while ((lm = lineRe.exec(body)) !== null) {
        const col = lm[1].toLowerCase();
        if (!['primary', 'unique', 'check', 'foreign', 'constraint', 'index'].includes(col)) {
          cols.add(col);
        }
      }
    }

    // ALTER TABLE [public.]table ADD COLUMN [IF NOT EXISTS] col type  (single-line)
    const addColRe =
      /ALTER\s+TABLE\s+(?:public\.)?(\w+)\s+ADD\s+COLUMN\s+(?:IF\s+NOT\s+EXISTS\s+)?"?(\w+)"?\s+\w/gi;
    while ((m = addColRe.exec(sql)) !== null) {
      const tableName = m[1].toLowerCase();
      const col = m[2].toLowerCase();
      if (!schema.has(tableName)) schema.set(tableName, new Set());
      schema.get(tableName)!.add(col);
    }

    // ALTER TABLE [public.]table\n  ADD COLUMN ... ,\n  ADD COLUMN ...  (multi-line block)
    const multiAlterRe =
      /ALTER\s+TABLE\s+(?:public\.)?(\w+)\s*\n([\s\S]*?)(?=;\s*\n|ALTER\s+TABLE|CREATE\s+)/gi;
    while ((m = multiAlterRe.exec(sql)) !== null) {
      const tableName = m[1].toLowerCase();
      const block = m[2];
      const addColLineRe =
        /ADD\s+COLUMN\s+(?:IF\s+NOT\s+EXISTS\s+)?"?(\w+)"?\s+\w/gi;
      let lm: RegExpExecArray | null;
      while ((lm = addColLineRe.exec(block)) !== null) {
        const col = lm[1].toLowerCase();
        if (!schema.has(tableName)) schema.set(tableName, new Set());
        schema.get(tableName)!.add(col);
      }
    }
  }

  return schema;
}

// ─── PostgREST select string parser ───────────────────────────────────────────
//
// Supabase .select() strings use PostgREST syntax:
//   "id, title, profiles ( id, email ), programs ( title )"
//
// Rules:
//   - `table_name ( col, col )` is a nested/relational select — `table_name` is
//     NOT a column on the parent table. Strip these entirely.
//   - `alias:column` — `alias` is not a column name, `column` is.
//   - `column->path` / `column->>path` — JSON path; `column` is the real column.
//   - `!inner`, `!left` — join hints, not columns.
//   - `count()`, `sum()` — aggregate hints, not columns.
//
// Returns only the direct column names on the parent table.
function parseSelectColumns(selectStr: string): string[] {
  // Remove nested relational selects: word followed by ( ... )
  // Do this iteratively to handle nesting
  let s = selectStr;
  let prev = '';
  while (prev !== s) {
    prev = s;
    s = s.replace(/\w+\s*\([^()]*\)/g, '');
  }

  return s
    .split(/[\s,\n]+/)
    .map((t) => {
      t = t.trim();
      // Strip alias prefix: "alias:column" → "column"
      if (t.includes(':')) t = t.split(':').pop()!;
      // Strip JSON path: "column->path" → "column"
      if (t.includes('->')) t = t.split('->')[0];
      // Strip join hints and aggregates
      t = t.replace(/^!/, '').replace(/\(.*$/, '');
      // Keep only valid identifier characters
      t = t.replace(/[^a-z0-9_]/gi, '');
      return t.toLowerCase();
    })
    .filter(
      (t) =>
        t.length > 0 &&
        !/^(select|from|where|join|on|and|or|inner|left|right|outer|count|sum|avg|min|max|not|null|true|false)$/.test(
          t,
        ),
    );
}

// ─── Step 2: Scan source files for .from('table').select(...) ─────────────────

interface SelectCall {
  file: string;
  line: number;
  table: string;
  columns: string[] | 'dynamic';
  raw: string;
}

function extractSelectCalls(srcDirs: string[]): SelectCall[] {
  const results: SelectCall[] = [];

  const patterns = srcDirs.map((d) => `${d}/**/*.{ts,tsx}`);
  const files = patterns.flatMap((p) =>
    glob.sync(p, { ignore: ['**/node_modules/**', '**/.next/**', '**/dist/**'] }),
  );

  for (const file of files) {
    const src = fs.readFileSync(file, 'utf8');
    const lines = src.split('\n');

    // Match .from('table') followed (within ~5 lines) by .select(...)
    // We do a two-pass: find all .from() positions, then look ahead for .select()
    const fromRe = /\.from\(\s*['"`](\w+)['"`]\s*\)/g;
    let fm: RegExpExecArray | null;

    while ((fm = fromRe.exec(src)) !== null) {
      const table = fm[1].toLowerCase();
      if (filterTable && table !== filterTable.toLowerCase()) continue;

      // Find the line number
      const lineNum = src.slice(0, fm.index).split('\n').length;

      // Look ahead up to 500 chars for a .select(...)
      const ahead = src.slice(fm.index, fm.index + 500);
      const selectRe = /\.select\(\s*(`[^`]*`|'[^']*'|"[^"]*"|\w+)\s*\)/;
      const sm = selectRe.exec(ahead);
      if (!sm) continue;

      const raw = sm[1];
      let columns: string[] | 'dynamic';

      if (/^[`'"]/.test(raw)) {
        // Strip quotes/backticks
        const inner = raw.slice(1, -1);
        // If it contains ${...} it's dynamic
        if (inner.includes('${')) {
          columns = 'dynamic';
        } else {
          columns = parseSelectColumns(inner);
        }
      } else {
        // Variable reference — dynamic
        columns = 'dynamic';
      }

      results.push({ file, line: lineNum, table, columns, raw: sm[0] });
    }
  }

  return results;
}

// ─── Step 3: Cross-reference and report ───────────────────────────────────────

interface DriftResult {
  file: string;
  line: number;
  table: string;
  unknownColumns: string[];
  tableKnown: boolean;
}

function auditDrift(calls: SelectCall[], schema: TableSchema): DriftResult[] {
  const drifts: DriftResult[] = [];

  for (const call of calls) {
    if (call.columns === 'dynamic') continue;

    const tableKnown = schema.has(call.table);
    const knownCols = schema.get(call.table) ?? new Set<string>();

    // Filter out relational sub-selects (contain spaces — they're table names, not columns)
    const directCols = call.columns.filter(
      (c) => c.length > 0 && !c.includes(' ') && c !== '*',
    );

    const unknown = directCols.filter((c) => !knownCols.has(c.toLowerCase()));

    if (!tableKnown || unknown.length > 0) {
      drifts.push({
        file: call.file,
        line: call.line,
        table: call.table,
        unknownColumns: unknown,
        tableKnown,
      });
    }
  }

  return drifts;
}

// ─── Main ──────────────────────────────────────────────────────────────────────

function main() {
  const root = path.resolve(__dirname, '..');
  const migrationsDir = path.join(root, 'supabase', 'migrations');
  const srcDirs = ['app', 'lib', 'components'].map((d) => path.join(root, d));

  console.log('Building schema from migrations...');
  const schema = parseMigrations(migrationsDir);
  console.log(`  ${schema.size} tables indexed from migrations\n`);

  console.log('Scanning source files for .select() calls...');
  const calls = extractSelectCalls(srcDirs);
  console.log(`  ${calls.length} .select() calls found\n`);

  const drifts = auditDrift(calls, schema);

  if (drifts.length === 0) {
    console.log('✅  No schema drift detected.\n');
    process.exit(0);
  }

  // Group by table
  const byTable = new Map<string, DriftResult[]>();
  for (const d of drifts) {
    if (!byTable.has(d.table)) byTable.set(d.table, []);
    byTable.get(d.table)!.push(d);
  }

  console.log(`⚠️  Schema drift detected in ${drifts.length} location(s):\n`);

  for (const [table, results] of byTable) {
    const tableLabel = results[0].tableKnown ? table : `${table} (TABLE NOT IN MIGRATIONS)`;
    console.log(`  Table: ${tableLabel}`);
    console.log(`  ${'─'.repeat(60)}`);
    for (const r of results) {
      const relPath = path.relative(root, r.file);
      if (!r.tableKnown) {
        console.log(`    ${relPath}:${r.line}  — table not found in migrations`);
      } else {
        console.log(
          `    ${relPath}:${r.line}  — unknown columns: ${r.unknownColumns.join(', ')}`,
        );
      }
    }
    console.log('');
  }

  console.log(
    'Note: migrations are additive only. DROP COLUMN / RENAME COLUMN are not modelled.\n' +
      'Verify flagged columns against the live database before removing them.\n',
  );

  if (failOnDrift) {
    process.exit(1);
  }
}

main();
