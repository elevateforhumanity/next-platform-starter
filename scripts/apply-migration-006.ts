/**
 * Applies migration 20260701000006_curriculum_uploads.sql
 *
 * Uses the Supabase Management API (requires SUPABASE_ACCESS_TOKEN).
 * Get a personal access token from: https://supabase.com/dashboard/account/tokens
 *
 * Usage:
 *   SUPABASE_ACCESS_TOKEN=<pat> pnpm tsx scripts/apply-migration-006.ts
 *
 * Or if credentials are in .env.local:
 *   pnpm tsx --env-file=.env.local scripts/apply-migration-006.ts
 */

const PROJECT_REF = process.env.SUPABASE_PROJECT_REF || 'cuxzzpsyufcewtmicszk';
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;

if (!ACCESS_TOKEN) {
  console.error('❌ SUPABASE_ACCESS_TOKEN is required.');
  console.error('   Get one from: https://supabase.com/dashboard/account/tokens');
  console.error('   Run: SUPABASE_ACCESS_TOKEN=<token> pnpm tsx scripts/apply-migration-006.ts');
  process.exit(1);
}

const ENDPOINT = `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`;

async function sql(query: string, label: string): Promise<boolean> {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ACCESS_TOKEN}` },
    body: JSON.stringify({ query }),
  });
  const json = await res.json().catch(() => ({})) as Record<string, unknown>;
  if (!res.ok || json.error || json.message) {
    const msg = (json.error ?? json.message ?? `HTTP ${res.status}`) as string;
    // "already exists" errors are fine — migration is idempotent
    if (/already exists/i.test(msg)) {
      console.log(`✓ ${label} (already exists — skipped)`);
      return true;
    }
    console.error(`✗ ${label}: ${msg}`);
    return false;
  }
  console.log(`✓ ${label}`);
  return true;
}

async function main() {
  console.log(`\nApplying migration 20260701000006 to project ${PROJECT_REF}...\n`);

  const steps = [
    [
      'create curriculum_uploads table',
      `create table if not exists public.curriculum_uploads (
        id          uuid        primary key default gen_random_uuid(),
        title       text,
        category    text        not null default 'curriculum',
        file_name   text        not null,
        file_path   text        not null,
        file_type   text,
        file_size   bigint,
        public_url  text,
        status      text        not null default 'uploaded',
        created_by  uuid        references auth.users(id) on delete set null,
        created_at  timestamptz not null default now(),
        updated_at  timestamptz not null default now()
      )`,
    ],
    [
      'create created_at index',
      `create index if not exists curriculum_uploads_created_at_idx
       on public.curriculum_uploads (created_at desc)`,
    ],
    [
      'create category index',
      `create index if not exists curriculum_uploads_category_idx
       on public.curriculum_uploads (category)`,
    ],
    [
      'enable RLS',
      `alter table public.curriculum_uploads enable row level security`,
    ],
    [
      'create admin RLS policy',
      `do $$
       begin
         if not exists (
           select 1 from pg_policies
           where schemaname = 'public'
             and tablename  = 'curriculum_uploads'
             and policyname = 'Admins can manage curriculum uploads'
         ) then
           create policy "Admins can manage curriculum uploads"
             on public.curriculum_uploads for all
             using (true) with check (true);
         end if;
       end $$`,
    ],
    [
      'create curriculum storage bucket',
      `insert into storage.buckets (id, name, public)
       values ('curriculum', 'curriculum', true)
       on conflict (id) do nothing`,
    ],
    [
      'create storage upload policy',
      `do $$
       begin
         if not exists (
           select 1 from pg_policies
           where schemaname = 'storage' and tablename = 'objects'
             and policyname = 'Authenticated users can upload curriculum'
         ) then
           create policy "Authenticated users can upload curriculum"
             on storage.objects for insert to authenticated
             with check (bucket_id = 'curriculum');
         end if;
       end $$`,
    ],
    [
      'create storage delete policy',
      `do $$
       begin
         if not exists (
           select 1 from pg_policies
           where schemaname = 'storage' and tablename = 'objects'
             and policyname = 'Authenticated users can delete curriculum'
         ) then
           create policy "Authenticated users can delete curriculum"
             on storage.objects for delete to authenticated
             using (bucket_id = 'curriculum');
         end if;
       end $$`,
    ],
    [
      'create storage public read policy',
      `do $$
       begin
         if not exists (
           select 1 from pg_policies
           where schemaname = 'storage' and tablename = 'objects'
             and policyname = 'Public can read curriculum'
         ) then
           create policy "Public can read curriculum"
             on storage.objects for select to public
             using (bucket_id = 'curriculum');
         end if;
       end $$`,
    ],
  ] as [string, string][];

  let failed = 0;
  for (const [label, query] of steps) {
    const ok = await sql(query, label);
    if (!ok) failed++;
  }

  console.log(`\n${failed === 0 ? '✅ Migration complete.' : `⚠️  ${failed} step(s) failed — check errors above.`}\n`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
