#!/usr/bin/env tsx
/**
 * Copy large objects from Supabase course-videos → Cloudflare R2 (course-videos/ prefix).
 *
 * Usage:
 *   pnpm tsx scripts/migrate-course-videos-to-r2.ts --dry-run
 *   pnpm tsx scripts/migrate-course-videos-to-r2.ts --execute
 *   pnpm tsx scripts/migrate-course-videos-to-r2.ts --execute --prefix generated-lessons/
 *
 * Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, CLOUDFLARE_R2_*
 */

import { isR2Configured, uploadToR2 } from '../lib/cloudflare-r2';
import { shouldUploadCourseMediaToR2 } from '../lib/video/upload-lesson-media';

const BUCKET = 'course-videos';

async function listObjects(prefix: string): Promise<{ name: string }[]> {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key) throw new Error('Supabase credentials missing');

  const out: { name: string }[] = [];
  let offset = 0;
  const limit = 1000;

  for (;;) {
    const res = await fetch(
      `${base}/storage/v1/object/list/${BUCKET}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prefix, limit, offset, sortBy: { column: 'name', order: 'asc' } }),
      },
    );
    if (!res.ok) {
      throw new Error(`List failed: ${await res.text()}`);
    }
    const batch = (await res.json()) as { name: string }[];
    if (!batch?.length) break;
    for (const item of batch) {
      if (item.name && !item.name.endsWith('/')) out.push(item);
    }
    if (batch.length < limit) break;
    offset += limit;
  }
  return out;
}

async function downloadObject(storagePath: string): Promise<Buffer> {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const res = await fetch(`${base}/storage/v1/object/${BUCKET}/${storagePath}`, {
    headers: { Authorization: `Bearer ${key}` },
  });
  if (!res.ok) throw new Error(`Download ${storagePath}: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

async function main() {
  const dryRun = !process.argv.includes('--execute');
  const prefixArg = process.argv.find((a) => a.startsWith('--prefix='));
  const prefix = prefixArg?.split('=')[1] ?? '';

  if (!isR2Configured()) {
    console.error('Cloudflare R2 not configured (CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_R2_ACCESS_KEY_ID, CLOUDFLARE_R2_SECRET_ACCESS_KEY)');
    process.exit(1);
  }

  console.log(dryRun ? '=== DRY RUN ===' : '=== EXECUTE ===');
  const objects = await listObjects(prefix);
  const videos = objects.filter((o) => o.name.endsWith('.mp4'));
  console.log(`Found ${videos.length} MP4 objects under ${prefix || '(root)'}`);

  let migrated = 0;
  let skipped = 0;

  for (const { name: storagePath } of videos) {
    if (dryRun) {
      console.log(`  would migrate: ${storagePath}`);
      migrated++;
      continue;
    }

    const buf = await downloadObject(storagePath);
    if (!shouldUploadCourseMediaToR2(buf, 'video/mp4')) {
      skipped++;
      continue;
    }

    const result = await uploadToR2(buf, `course-videos/${storagePath}`, 'video/mp4');
    if (!result.success) {
      console.error(`  failed: ${storagePath} — ${result.error}`);
      continue;
    }
    console.log(`  ok: ${storagePath} → ${result.url?.slice(0, 80)}…`);
    migrated++;
  }

  console.log(`\nDone. migrated=${migrated} skipped=${skipped} (update DB video_url separately if needed)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
