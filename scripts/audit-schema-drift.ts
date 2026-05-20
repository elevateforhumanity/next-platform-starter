#!/usr/bin/env tsx
/**
 * Schema drift auditor.
 *
 * Scans all TypeScript source files for Supabase .select() calls, extracts
 * column names, and cross-references against the live Supabase schema
 * (via PostgREST OpenAPI) or migration history as fallback.
 *
 * Usage:
 *   pnpm audit:schema
 *   pnpm audit:schema:strict          # exit 1 if any drift found (CI)
 *   pnpm tsx scripts/audit-schema-drift.ts --table program_enrollments
 *   pnpm tsx scripts/audit-schema-drift.ts --source migrations  # force migration fallback
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const args = process.argv.slice(2);
const filterTable = args.find((a, i) => args[i - 1] === '--table') ?? null;
const failOnDrift = args.includes('--fail-on-drift');
const forceMigrations = args.includes('--source') && args[args.indexOf('--source') + 1] === 'migrations';

type TableSchema = Map<string, Set<string>>;

// --- Live schema via PostgREST OpenAPI (authoritative) ----------------------

async function fetchLiveSchema(supabaseUrl: string, serviceKey: string): Promise<TableSchema | null> {
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
    });
    if (!res.ok) return null;
    const swagger = await res.json() as any;
    const schema: TableSchema = new Map();
    for (const [tableName, defn] of Object.entries(swagger.definitions ?? {})) {
      const cols = new Set(
        Object.keys((defn as any).properties ?? {}).map((c: string) => c.toLowerCase())
      );
      schema.set(tableName.toLowerCase(), cols);
    }
    return schema;
  } catch {
    return null;
  }
}

// --- Migration file fallback ------------------------------------------------

function parseMigrations(migrationsDir: string): TableSchema {
  const schema: TableSchema = new Map();
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort()
    .map((f) => path.join(migrationsDir, f));

  for (const file of files) {
    const sql = fs.readFileSync(file, 'utf8');

    // CREATE TABLE
    const createRe = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?(\w+)\s*\(([^;]+?)\);/gis;
    let m: RegExpExecArray | null;
    while ((m = createRe.exec(sql)) !== null) {
      const t = m[1].toLowerCase();
      if (!schema.has(t)) schema.set(t, new Set());
      const lineRe = /^\s+"?(\w+)"?\s+\w/gm;
      let lm: RegExpExecArray | null;
      while ((lm = lineRe.exec(m[2])) !== null) {
        const col = lm[1].toLowerCase();
        if (!['primary','unique','check','foreign','constraint','index'].includes(col))
          schema.get(t)!.add(col);
      }
    }

    // ALTER TABLE ... ADD COLUMN (single-line)
    const addRe = /ALTER\s+TABLE\s+(?:public\.)?(\w+)\s+ADD\s+COLUMN\s+(?:IF\s+NOT\s+EXISTS\s+)?"?(\w+)"?\s+\w/gi;
    while ((m = addRe.exec(sql)) !== null) {
      const t = m[1].toLowerCase();
      if (!schema.has(t)) schema.set(t, new Set());
      schema.get(t)!.add(m[2].toLowerCase());
    }

    // ALTER TABLE ... (multi-line ADD COLUMN block)
    const multiRe = /ALTER\s+TABLE\s+(?:public\.)?(\w+)\s*\n([\s\S]*?)(?=;\s*\n|ALTER\s+TABLE|CREATE\s+)/gi;
    while ((m = multiRe.exec(sql)) !== null) {
      const t = m[1].toLowerCase();
      const blockRe = /ADD\s+COLUMN\s+(?:IF\s+NOT\s+EXISTS\s+)?"?(\w+)"?\s+\w/gi;
      let lm: RegExpExecArray | null;
      while ((lm = blockRe.exec(m[2])) !== null) {
        if (!schema.has(t)) schema.set(t, new Set());
        schema.get(t)!.add(lm[1].toLowerCase());
      }
    }
  }
  return schema;
}

// --- PostgREST select string parser -----------------------------------------
//
// Handles: nested selects `table(col)`, aliases `alias:col`, JSON paths `col->x`,
// join hints `!inner`, aggregates `count()`.

function parseSelectColumns(selectStr: string): string[] {
  // Remove nested relational selects iteratively
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
      if (t.includes(':')) t = t.split(':').pop()!;
      if (t.includes('->')) t = t.split('->')[0];
      t = t.replace(/^!/, '').replace(/\(.*$/, '').replace(/[^a-z0-9_]/gi, '');
      return t.toLowerCase();
    })
    .filter(
      (t) =>
        t.length > 0 &&
        !/^(select|from|where|join|on|and|or|inner|left|right|outer|count|sum|avg|min|max|not|null|true|false)$/.test(t),
    );
}

// --- Source file scanner ----------------------------------------------------

interface SelectCall {
  file: string;
  line: number;
  table: string;
  columns: string[] | 'dynamic';
}

function extractSelectCalls(srcDirs: string[]): SelectCall[] {
  const results: SelectCall[] = [];
  const patterns = srcDirs.map((d) => `${d}/**/*.{ts,tsx}`);
  const files = patterns.flatMap((p) =>
    glob.sync(p, { ignore: ['**/node_modules/**', '**/.next/**', '**/dist/**'] }),
  );

  for (const file of files) {
    const src = fs.readFileSync(file, 'utf8');
    const fromRe = /\.from\(\s*['"`](\w+)['"`]\s*\)/g;
    let fm: RegExpExecArray | null;
    while ((fm = fromRe.exec(src)) !== null) {
      const table = fm[1].toLowerCase();
      if (filterTable && table !== filterTable.toLowerCase()) continue;
      const lineNum = src.slice(0, fm.index).split('\n').length;
      const ahead = src.slice(fm.index, fm.index + 500);
      const selectRe = /\.select\(\s*(`[^`]*`|'[^']*'|"[^"]*"|\w+)\s*\)/;
      const sm = selectRe.exec(ahead);
      if (!sm) continue;
      const raw = sm[1];
      let columns: string[] | 'dynamic';
      if (/^[`'"]/.test(raw)) {
        const inner = raw.slice(1, -1);
        columns = inner.includes('${') ? 'dynamic' : parseSelectColumns(inner);
      } else {
        columns = 'dynamic';
      }
      results.push({ file, line: lineNum, table, columns });
    }
  }
  return results;
}

// --- Drift detection --------------------------------------------------------

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
    const directCols = call.columns.filter((c) => c.length > 0 && !c.includes(' ') && c !== '*');
    const unknown = directCols.filter((c) => !knownCols.has(c.toLowerCase()));
    if (!tableKnown || unknown.length > 0) {
      drifts.push({ file: call.file, line: call.line, table: call.table, unknownColumns: unknown, tableKnown });
    }
  }
  return drifts;
}

// --- Main -------------------------------------------------------------------

async function main() {
  const root = path.resolve(__dirname, '..');
  const migrationsDir = path.join(root, 'supabase', 'migrations');
  const srcDirs = ['app', 'lib', 'components'].map((d) => path.join(root, d));

  // Load env
  let supabaseUrl = '';
  let serviceKey = '';
  try {
    const env = fs.readFileSync(path.join(root, '.env.local'), 'utf8');
    for (const line of env.split('\n')) {
      const m = line.match(/^([^#=\s]+)=(.+)/);
      if (!m) continue;
      if (m[1] === 'NEXT_PUBLIC_SUPABASE_URL') supabaseUrl = m[2].trim();
      if (m[1] === 'SUPABASE_SERVICE_ROLE_KEY') serviceKey = m[2].trim();
    }
  } catch {}

  let schema: TableSchema;
  let schemaSource: string;

  if (!forceMigrations && supabaseUrl && serviceKey) {
    process.stdout.write('Fetching live schema from Supabase...');
    const live = await fetchLiveSchema(supabaseUrl, serviceKey);
    if (live) {
      schema = live;
      schemaSource = `live Supabase (${schema.size} tables)`;
    } else {
      process.stdout.write(' failed, falling back to migrations\n');
      schema = parseMigrations(migrationsDir);
      schemaSource = `migrations (${schema.size} tables — may have false positives)`;
    }
  } else {
    schema = parseMigrations(migrationsDir);
    schemaSource = `migrations (${schema.size} tables — may have false positives)`;
  }
  console.log(` ${schemaSource}`);

  process.stdout.write('Scanning source files...');
  const calls = extractSelectCalls(srcDirs);
  console.log(` ${calls.length} .select() calls found\n`);

  const drifts = auditDrift(calls, schema);

  if (drifts.length === 0) {
    console.log('No schema drift detected.\n');
    process.exit(0);
  }

  const byTable = new Map<string, DriftResult[]>();
  for (const d of drifts) {
    if (!byTable.has(d.table)) byTable.set(d.table, []);
    byTable.get(d.table)!.push(d);
  }

  console.log(`Schema drift detected in ${drifts.length} location(s):\n`);
  for (const [table, results] of byTable) {
    const label = results[0].tableKnown ? table : `${table} (TABLE NOT IN SCHEMA)`;
    console.log(`  Table: ${label}`);
    console.log(`  ${'─'.repeat(60)}`);
    for (const r of results) {
      const relPath = path.relative(root, r.file);
      if (!r.tableKnown) {
        console.log(`    ${relPath}:${r.line}  — table not found in schema`);
      } else {
        console.log(`    ${relPath}:${r.line}  — unknown columns: ${r.unknownColumns.join(', ')}`);
      }
    }
    console.log('');
  }

  if (failOnDrift) process.exit(1);
}

main();
