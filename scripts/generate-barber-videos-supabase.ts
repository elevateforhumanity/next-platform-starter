#!/usr/bin/env tsx
/**
 * Barber course video generator — fully DB-driven, zero Netlify dependency.
 *
 * Pipeline per lesson:
 *   1. Fetch lesson content from course_lessons (Supabase)
 *   2. Build narration script from content
 *   3. Generate TTS MP3 via OpenAI → upload to Supabase lesson-audio bucket
 *   4. Download b-roll clips from Pexels → upload to Supabase course-videos/broll/
 *   5. Assemble final video with ffmpeg (b-roll + TTS audio overlay)
 *   6. Upload assembled MP4 to Supabase course-videos/barber/
 *   7. Update course_lessons.video_url → Supabase public URL
 *
 * Nothing touches public/ or the Netlify deploy.
 * All assets live in Supabase Storage.
 *
 * Usage:
 *   pnpm tsx scripts/generate-barber-videos-supabase.ts
 *   pnpm tsx scripts/generate-barber-videos-supabase.ts --lesson-id <uuid>
 *   pnpm tsx scripts/generate-barber-videos-supabase.ts --force   # regenerate existing
 *   pnpm tsx scripts/generate-barber-videos-supabase.ts --dry-run
 */

import { config } from 'dotenv';
import path from 'path';
config({ path: path.resolve(process.cwd(), '.env.local') });

import fs from 'fs';
import os from 'os';
import { execSync } from 'child_process';
import { createClient } from '@supabase/supabase-js';

const DRY_RUN = process.argv.includes('--dry-run');
const FORCE = process.argv.includes('--force');
const LESSON_ARG =
  process.argv.find((a) => a.startsWith('--lesson-id='))?.split('=')[1] ||
  (process.argv.indexOf('--lesson-id') !== -1
    ? process.argv[process.argv.indexOf('--lesson-id') + 1]
    : null);

const OPENAI_KEY = process.env.OPENAI_API_KEY!;
const PEXELS_KEY = process.env.PEXELS_API_KEY!;
const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPA_SVC = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const COURSE_ID = '3fb5ce19-1cde-434c-a8c6-f138d7d7aa17';

const sb = createClient(SUPA_URL, SUPA_SVC);

// ── B-roll topic map ─────────────────────────────────────────────────
// Maps scene keywords → Pexels search query
const BROLL_MAP: Record<string, string> = {
  'infection-control': 'barber disinfecting tools',
  'disinfecting-clippers': 'barber cleaning clippers',
  'disinfecting-scissors': 'barber cleaning scissors',
  'washing-hands-barber': 'person washing hands professional',
  'ppe-barber': 'barber wearing gloves mask',
  'blood-exposure-protocol': 'medical gloves safety protocol',
  'disposing-single-use': 'disposing single use items',
  'osha-barbershop': 'workplace safety professional',
  'cleaning-barber-station': 'barber cleaning workstation',
  'barber-cutting-hair': 'barber cutting hair client',
  'barber-beard-trim': 'barber trimming beard',
  'barber-lineup': 'barber lineup fade haircut',
  'barber-shaving': 'barber straight razor shaving',
  'barber-shampoo': 'barber washing hair client',
  'barber-styling': 'barber styling hair product',
  'client-consultation': 'barber talking client consultation',
  'first-impression-barber': 'professional barber greeting client',
  'professional-appearance': 'professional grooming appearance',
  'ethics-professional': 'professional handshake business',
  'ergonomics-posture': 'professional standing posture ergonomics',
  'hair-color-chemical': 'hair color chemical application',
  'chemical-handling': 'chemical safety handling gloves',
  'patch-test': 'skin patch test allergy',
  'ph-scale-hair': 'hair science laboratory',
  'relaxer-texturizer': 'hair relaxer chemical treatment',
  'sds-safety-data-sheet': 'safety data sheet chemical',
  'apprentice-training': 'apprentice learning mentor training',
  'indiana-license-renewal': 'professional license certificate',
  'barber-license-exam': 'exam test professional certification',
  'state-board-exam-prep': 'studying exam preparation',
  'client-retention': 'happy customer barber shop',
  'handling-complaints': 'customer service professional',
  'smart-goals-planning': 'planning goals whiteboard',
  'time-management-barber': 'time management schedule professional',
  'logging-hours-timesheet': 'timesheet hours logging work',
  'burnout-wellness': 'wellness mental health professional',
  'neck-strip-cape': 'barber cape neck strip client',
  'barbershop-intro': 'barbershop interior professional',
  default: 'barbershop professional barber',
};

// ── Keyword → b-roll key ─────────────────────────────────────────────
function pickBrollKey(text: string): string {
  const t = text.toLowerCase();
  if (/infect|sanitiz|disinfect|steril/.test(t)) return 'infection-control';
  if (/clipper/.test(t)) return 'disinfecting-clippers';
  if (/scissor|shear/.test(t)) return 'disinfecting-scissors';
  if (/wash.*hand|hand.*wash/.test(t)) return 'washing-hands-barber';
  if (/ppe|glove|mask|protective/.test(t)) return 'ppe-barber';
  if (/blood|exposure|pathogen/.test(t)) return 'blood-exposure-protocol';
  if (/dispos|single.use|razor/.test(t)) return 'disposing-single-use';
  if (/osha|regulation|compliance/.test(t)) return 'osha-barbershop';
  if (/clean.*station|station.*clean/.test(t)) return 'cleaning-barber-station';
  if (/fade|taper|blend|cut/.test(t)) return 'barber-cutting-hair';
  if (/beard|trim/.test(t)) return 'barber-beard-trim';
  if (/lineup|edge/.test(t)) return 'barber-lineup';
  if (/shav|straight razor/.test(t)) return 'barber-shaving';
  if (/shampoo|wash.*hair/.test(t)) return 'barber-shampoo';
  if (/style|product|pomade/.test(t)) return 'barber-styling';
  if (/consult|intake|assess/.test(t)) return 'client-consultation';
  if (/first impression|greeting|welcome/.test(t)) return 'first-impression-barber';
  if (/professional.*appear|dress|image/.test(t)) return 'professional-appearance';
  if (/ethic|conduct|boundary/.test(t)) return 'ethics-professional';
  if (/ergonomic|posture|stance/.test(t)) return 'ergonomics-posture';
  if (/color|colour|dye/.test(t)) return 'hair-color-chemical';
  if (/chemical|hazard/.test(t)) return 'chemical-handling';
  if (/patch test|allerg/.test(t)) return 'patch-test';
  if (/ph|acid|alkaline/.test(t)) return 'ph-scale-hair';
  if (/relaxer|texturiz/.test(t)) return 'relaxer-texturizer';
  if (/sds|safety data/.test(t)) return 'sds-safety-data-sheet';
  if (/apprentice|mentor|train/.test(t)) return 'apprentice-training';
  if (/licens|renew/.test(t)) return 'indiana-license-renewal';
  if (/exam|test|board/.test(t)) return 'barber-license-exam';
  if (/retention|loyal|repeat/.test(t)) return 'client-retention';
  if (/complaint|conflict|difficult/.test(t)) return 'handling-complaints';
  if (/goal|plan|objective/.test(t)) return 'smart-goals-planning';
  if (/time|schedul|priorit/.test(t)) return 'time-management-barber';
  if (/hour|timesheet|log/.test(t)) return 'logging-hours-timesheet';
  if (/burnout|wellness|stress|mental/.test(t)) return 'burnout-wellness';
  if (/cape|neck strip/.test(t)) return 'neck-strip-cape';
  return 'default';
}

// ── Pexels: fetch clip URL ───────────────────────────────────────────
const pexelsCache = new Map<string, string>();

async function fetchPexelsClipUrl(query: string): Promise<string | null> {
  if (pexelsCache.has(query)) return pexelsCache.get(query)!;

  const url = `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=5&orientation=landscape&size=medium`;
  const res = await fetch(url, { headers: { Authorization: PEXELS_KEY } });
  if (!res.ok) return null;

  const data = (await res.json()) as any;
  const videos = data.videos || [];
  if (!videos.length) return null;

  // Pick the best quality file ≤ 1080p
  for (const video of videos) {
    const files = (video.video_files || []).sort((a: any, b: any) => b.width - a.width);
    const file = files.find((f: any) => f.width <= 1920 && f.file_type === 'video/mp4');
    if (file?.link) {
      pexelsCache.set(query, file.link);
      return file.link;
    }
  }
  return null;
}

// ── Download clip to tmp ─────────────────────────────────────────────
async function downloadClip(url: string, outPath: string): Promise<void> {
  execSync(`curl -sL "${url}" -o "${outPath}"`, { stdio: 'pipe' });
}

// ── Upload to Supabase ───────────────────────────────────────────────
async function uploadToSupabase(
  localPath: string,
  bucket: string,
  storagePath: string,
  contentType: string,
): Promise<string> {
  const buf = fs.readFileSync(localPath);
  const res = await fetch(`${SUPA_URL}/storage/v1/object/${bucket}/${storagePath}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SUPA_SVC}`,
      'Content-Type': contentType,
      'x-upsert': 'true',
    },
    body: buf,
  });
  if (!res.ok) throw new Error(`Upload failed (${res.status}): ${await res.text()}`);
  return `${SUPA_URL}/storage/v1/object/public/${bucket}/${storagePath}`;
}

// ── Check if clip already in Supabase ────────────────────────────────
async function getOrFetchBroll(brollKey: string, tmpDir: string): Promise<string> {
  const storagePath = `broll/${brollKey}.mp4`;
  const publicUrl = `${SUPA_URL}/storage/v1/object/public/course-videos/${storagePath}`;

  // Check if already uploaded
  const check = await fetch(publicUrl, { method: 'HEAD' });
  if (check.ok) return publicUrl;

  // Download from Pexels
  const query = BROLL_MAP[brollKey] || BROLL_MAP['default'];
  const clipUrl = await fetchPexelsClipUrl(query);
  if (!clipUrl) throw new Error(`No Pexels clip found for: ${query}`);

  const tmpPath = path.join(tmpDir, `${brollKey}.mp4`);
  await downloadClip(clipUrl, tmpPath);

  // Trim to 30s max with ffmpeg
  const trimPath = path.join(tmpDir, `${brollKey}-trim.mp4`);
  execSync(`ffmpeg -y -i "${tmpPath}" -t 30 -c copy "${trimPath}" 2>/dev/null`, { stdio: 'pipe' });

  // Upload to Supabase
  const url = await uploadToSupabase(trimPath, 'course-videos', storagePath, 'video/mp4');
  fs.unlinkSync(tmpPath);
  fs.unlinkSync(trimPath);
  return url;
}

// ── Build narration ──────────────────────────────────────────────────
function buildNarration(title: string, content: string): string {
  const clean = content
    .replace(/^#{1,4}\s+/gm, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`(.*?)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  const intro = `Welcome. Today's lesson is ${title}. Let's get into it.\n\n`;
  const outro = `\n\nThat wraps up ${title}. Complete the quiz and flashcard review before moving on. Great work today.`;
  const maxBody = 4096 - intro.length - outro.length - 10;
  return intro + clean.slice(0, maxBody) + outro;
}

// ── OpenAI TTS ───────────────────────────────────────────────────────
async function generateTTS(text: string, outPath: string): Promise<void> {
  const res = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_KEY}` },
    body: JSON.stringify({
      model: 'tts-1-hd',
      input: text,
      voice: 'onyx',
      instructions: `You are Elizabeth Greene, director of Elevate for Humanity barbering apprenticeship in Indiana. Speak directly to your apprentices — confident, clear, practical. Steady professional pace. Natural pauses between paragraphs.`,
      response_format: 'mp3',
      speed: 0.95,
    }),
  });
  if (!res.ok) throw new Error(`TTS failed (${res.status}): ${await res.text()}`);
  fs.writeFileSync(outPath, Buffer.from(await res.arrayBuffer()));
}

// ── Get audio duration ───────────────────────────────────────────────
function getAudioDuration(audioPath: string): number {
  try {
    const out = execSync(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${audioPath}"`,
      { stdio: 'pipe' },
    )
      .toString()
      .trim();
    return parseFloat(out) || 60;
  } catch {
    return 60;
  }
}

// ── Assemble video: b-roll loop + TTS audio ──────────────────────────
async function assembleVideo(
  audioPath: string,
  brollUrls: string[],
  outPath: string,
  tmpDir: string,
): Promise<void> {
  const audioDuration = getAudioDuration(audioPath);

  // Download b-roll clips to tmp
  const clipPaths: string[] = [];
  for (let i = 0; i < brollUrls.length; i++) {
    const clipPath = path.join(tmpDir, `clip-${i}.mp4`);
    execSync(`curl -sL "${brollUrls[i]}" -o "${clipPath}"`, { stdio: 'pipe' });
    clipPaths.push(clipPath);
  }

  // Build ffmpeg concat list — loop clips to fill audio duration
  const concatPath = path.join(tmpDir, 'concat.txt');
  const segmentDuration = audioDuration / Math.max(brollUrls.length, 1);
  let concatContent = '';
  for (const clipPath of clipPaths) {
    concatContent += `file '${clipPath}'\n`;
  }
  // Repeat if needed
  const totalClipDuration = clipPaths.length * segmentDuration;
  if (totalClipDuration < audioDuration) {
    for (const clipPath of clipPaths) {
      concatContent += `file '${clipPath}'\n`;
    }
  }
  fs.writeFileSync(concatPath, concatContent);

  // Assemble: concat b-roll, overlay TTS audio, trim to audio length
  execSync(
    `ffmpeg -y \
      -f concat -safe 0 -i "${concatPath}" \
      -i "${audioPath}" \
      -map 0:v:0 -map 1:a:0 \
      -c:v libx264 -preset fast -crf 23 \
      -c:a aac -b:a 128k \
      -t ${audioDuration} \
      -vf "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2,setsar=1" \
      "${outPath}" 2>/dev/null`,
    { stdio: 'pipe', timeout: 300000 },
  );

  // Cleanup clip files
  for (const p of clipPaths) {
    try {
      fs.unlinkSync(p);
    } catch {}
  }
  try {
    fs.unlinkSync(concatPath);
  } catch {}
}

// ── Main ─────────────────────────────────────────────────────────────
async function main() {
  if (!OPENAI_KEY) {
    console.error('❌ OPENAI_API_KEY not set');
    process.exit(1);
  }
  if (!PEXELS_KEY) {
    console.error('❌ PEXELS_API_KEY not set');
    process.exit(1);
  }

  // Fetch lessons
  let query = sb
    .from('course_lessons')
    .select('id, title, slug, content, lesson_type, video_url, order_index')
    .eq('course_id', COURSE_ID)
    .order('order_index');

  if (LESSON_ARG) {
    query = query.eq('id', LESSON_ARG) as any;
  } else if (!FORCE) {
    // Only lessons with broken/missing video_url
    query = query.or('video_url.is.null,video_url.like./videos/%') as any;
  }

  const { data: lessons, error } = await query;
  if (error) {
    console.error('DB error:', error.message);
    process.exit(1);
  }
  if (!lessons?.length) {
    console.log('✅ All lessons have valid video URLs');
    return;
  }

  console.log(`\n═══ Generating videos for ${lessons.length} barber lessons ═══`);
  console.log(`    Storage: Supabase course-videos bucket (no Netlify)`);
  console.log(`    B-roll:  Pexels → Supabase (cached per clip key)\n`);

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'barber-vid-'));
  let ok = 0,
    failed = 0;

  for (const lesson of lessons) {
    const idx = lessons.indexOf(lesson) + 1;
    console.log(`\n[${idx}/${lessons.length}] ${lesson.title} (${lesson.lesson_type})`);

    if (DRY_RUN) {
      console.log(`  [DRY RUN] Would generate video`);
      continue;
    }

    try {
      const slug = lesson.slug || `lesson-${lesson.id.slice(0, 8)}`;
      const audioPath = path.join(tmpDir, `${slug}.mp3`);
      const videoPath = path.join(tmpDir, `${slug}.mp4`);
      const audioStore = `barber/${slug}.mp3`;
      const videoStore = `barber/${slug}.mp4`;

      // 1. TTS
      process.stdout.write('  → TTS narration... ');
      const narration = buildNarration(lesson.title, lesson.content || '');
      await generateTTS(narration, audioPath);
      const audioSize = fs.statSync(audioPath).size;
      console.log(`${(audioSize / 1024).toFixed(0)}KB`);

      // 2. Upload audio
      process.stdout.write('  → Uploading audio... ');
      const audioUrl = await uploadToSupabase(audioPath, 'lesson-audio', audioStore, 'audio/mpeg');
      console.log('✅');

      // 3. Pick b-roll clips (2-3 clips per lesson based on content sections)
      const sections = (lesson.content || lesson.title).split('\n## ').slice(0, 3);
      const brollKeys = [...new Set(sections.map((s) => pickBrollKey(s)))].slice(0, 3);
      if (brollKeys.length === 0) brollKeys.push('default');

      process.stdout.write(`  → B-roll clips [${brollKeys.join(', ')}]... `);
      const brollUrls: string[] = [];
      for (const key of brollKeys) {
        try {
          const url = await getOrFetchBroll(key, tmpDir);
          brollUrls.push(url);
        } catch (e: any) {
          console.log(`\n    ⚠️  ${key}: ${e.message} — using default`);
          const fallback = await getOrFetchBroll('default', tmpDir);
          brollUrls.push(fallback);
        }
      }
      console.log(`✅ (${brollUrls.length} clips)`);

      // 4. Assemble video
      process.stdout.write('  → Assembling video (ffmpeg)... ');
      await assembleVideo(audioPath, brollUrls, videoPath, tmpDir);
      const videoSize = fs.statSync(videoPath).size;
      console.log(`${(videoSize / 1024 / 1024).toFixed(1)}MB`);

      // 5. Upload video
      process.stdout.write('  → Uploading to Supabase... ');
      const videoUrl = await uploadToSupabase(videoPath, 'course-videos', videoStore, 'video/mp4');
      console.log('✅');

      // 6. Update DB
      const { error: updateErr } = await sb
        .from('course_lessons')
        .update({ video_url: videoUrl })
        .eq('id', lesson.id);
      if (updateErr) throw new Error(`DB update: ${updateErr.message}`);

      console.log(`  ✅ ${videoUrl.split('/').pop()}`);

      // Cleanup
      try {
        fs.unlinkSync(audioPath);
      } catch {}
      try {
        fs.unlinkSync(videoPath);
      } catch {}

      ok++;
    } catch (err: any) {
      console.error(`  ❌ ${err.message}`);
      failed++;
    }
  }

  try {
    fs.rmSync(tmpDir, { recursive: true });
  } catch {}

  console.log(`\n═══ Done: ${ok} generated, ${failed} failed ═══\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
