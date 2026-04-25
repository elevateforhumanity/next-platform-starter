/**
 * POST /api/admin/courses/[courseId]/generate-videos
 *
 * Generates b-roll + TTS videos for course lessons that have no video_url
 * or have broken local paths. Fully DB-driven — nothing touches Netlify.
 *
 * Pipeline per lesson:
 *   1. Build narration from lesson content
 *   2. OpenAI TTS → Supabase lesson-audio bucket
 *   3. Pexels b-roll clips → Supabase course-videos/broll/ (cached)
 *   4. ffmpeg assembly → Supabase course-videos/{slug}.mp4
 *   5. Update course_lessons.video_url
 *
 * Body: { lessonId?: string, force?: boolean }
 *   lessonId — regenerate a single lesson (optional)
 *   force    — regenerate even if video_url already set (optional)
 *
 * NOTE: ffmpeg must be available in the runtime environment.
 * On Netlify this will fail — run on Railway or locally.
 */

import { NextRequest, NextResponse } from 'next/server';
import { execSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { getAdminClient } from '@/lib/supabase/admin';
import { safeError, safeInternalError } from '@/lib/api/safe-error';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 min — Railway only

// ── B-roll topic map ─────────────────────────────────────────────────
const BROLL_MAP: Record<string, string> = {
  'infection-control':       'barber disinfecting tools',
  'disinfecting-clippers':   'barber cleaning clippers',
  'disinfecting-scissors':   'barber cleaning scissors',
  'washing-hands-barber':    'person washing hands professional',
  'ppe-barber':              'barber wearing gloves mask',
  'blood-exposure-protocol': 'medical gloves safety protocol',
  'disposing-single-use':    'disposing single use items',
  'osha-barbershop':         'workplace safety professional',
  'cleaning-barber-station': 'barber cleaning workstation',
  'barber-cutting-hair':     'barber cutting hair client',
  'barber-beard-trim':       'barber trimming beard',
  'barber-lineup':           'barber lineup fade haircut',
  'barber-shaving':          'barber straight razor shaving',
  'barber-shampoo':          'barber washing hair client',
  'barber-styling':          'barber styling hair product',
  'client-consultation':     'barber talking client consultation',
  'first-impression-barber': 'professional barber greeting client',
  'professional-appearance': 'professional grooming appearance',
  'ethics-professional':     'professional handshake business',
  'ergonomics-posture':      'professional standing posture ergonomics',
  'hair-color-chemical':     'hair color chemical application',
  'chemical-handling':       'chemical safety handling gloves',
  'patch-test':              'skin patch test allergy',
  'ph-scale-hair':           'hair science laboratory',
  'relaxer-texturizer':      'hair relaxer chemical treatment',
  'sds-safety-data-sheet':   'safety data sheet chemical',
  'apprentice-training':     'apprentice learning mentor training',
  'indiana-license-renewal': 'professional license certificate',
  'barber-license-exam':     'exam test professional certification',
  'state-board-exam-prep':   'studying exam preparation',
  'client-retention':        'happy customer barber shop',
  'handling-complaints':     'customer service professional',
  'smart-goals-planning':    'planning goals whiteboard',
  'time-management-barber':  'time management schedule professional',
  'logging-hours-timesheet': 'timesheet hours logging work',
  'burnout-wellness':        'wellness mental health professional',
  'neck-strip-cape':         'barber cape neck strip client',
  'barbershop-intro':        'barbershop interior professional',
  'default':                 'barbershop professional barber',
};

function pickBrollKey(text: string): string {
  const t = text.toLowerCase();
  if (/infect|sanitiz|disinfect|steril/.test(t))    return 'infection-control';
  if (/clipper/.test(t))                             return 'disinfecting-clippers';
  if (/scissor|shear/.test(t))                       return 'disinfecting-scissors';
  if (/wash.*hand|hand.*wash/.test(t))               return 'washing-hands-barber';
  if (/ppe|glove|mask|protective/.test(t))           return 'ppe-barber';
  if (/blood|exposure|pathogen/.test(t))             return 'blood-exposure-protocol';
  if (/dispos|single.use|razor/.test(t))             return 'disposing-single-use';
  if (/osha|regulation|compliance/.test(t))          return 'osha-barbershop';
  if (/clean.*station|station.*clean/.test(t))       return 'cleaning-barber-station';
  if (/fade|taper|blend|cut/.test(t))                return 'barber-cutting-hair';
  if (/beard|trim/.test(t))                          return 'barber-beard-trim';
  if (/lineup|edge/.test(t))                         return 'barber-lineup';
  if (/shav|straight razor/.test(t))                 return 'barber-shaving';
  if (/shampoo|wash.*hair/.test(t))                  return 'barber-shampoo';
  if (/style|product|pomade/.test(t))                return 'barber-styling';
  if (/consult|intake|assess/.test(t))               return 'client-consultation';
  if (/first impression|greeting|welcome/.test(t))   return 'first-impression-barber';
  if (/professional.*appear|dress|image/.test(t))    return 'professional-appearance';
  if (/ethic|conduct|boundary/.test(t))              return 'ethics-professional';
  if (/ergonomic|posture|stance/.test(t))            return 'ergonomics-posture';
  if (/color|colour|dye/.test(t))                    return 'hair-color-chemical';
  if (/chemical|hazard/.test(t))                     return 'chemical-handling';
  if (/patch test|allerg/.test(t))                   return 'patch-test';
  if (/ph|acid|alkaline/.test(t))                    return 'ph-scale-hair';
  if (/relaxer|texturiz/.test(t))                    return 'relaxer-texturizer';
  if (/sds|safety data/.test(t))                     return 'sds-safety-data-sheet';
  if (/apprentice|mentor|train/.test(t))             return 'apprentice-training';
  if (/licens|renew/.test(t))                        return 'indiana-license-renewal';
  if (/exam|test|board/.test(t))                     return 'barber-license-exam';
  if (/retention|loyal|repeat/.test(t))              return 'client-retention';
  if (/complaint|conflict|difficult/.test(t))        return 'handling-complaints';
  if (/goal|plan|objective/.test(t))                 return 'smart-goals-planning';
  if (/time|schedul|priorit/.test(t))                return 'time-management-barber';
  if (/hour|timesheet|log/.test(t))                  return 'logging-hours-timesheet';
  if (/burnout|wellness|stress|mental/.test(t))      return 'burnout-wellness';
  if (/cape|neck strip/.test(t))                     return 'neck-strip-cape';
  return 'default';
}

function buildNarration(title: string, content: string): string {
  const clean = content
    .replace(/^#{1,4}\s+/gm, '').replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1').replace(/`(.*?)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^\s*[-*+]\s+/gm, '').replace(/^\s*\d+\.\s+/gm, '')
    .replace(/\n{3,}/g, '\n\n').trim();
  const intro = `Welcome. Today's lesson is ${title}. Let's get into it.\n\n`;
  const outro = `\n\nThat wraps up ${title}. Complete the quiz and flashcard review before moving on. Great work today.`;
  return intro + clean.slice(0, 4096 - intro.length - outro.length - 10) + outro;
}

async function generateTTS(text: string, outPath: string): Promise<void> {
  const res = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: JSON.stringify({ model: 'tts-1-hd', input: text, voice: 'onyx', response_format: 'mp3', speed: 0.95 }),
  });
  if (!res.ok) throw new Error(`TTS failed: ${await res.text()}`);
  fs.writeFileSync(outPath, Buffer.from(await res.arrayBuffer()));
}

async function fetchPexelsClipUrl(query: string): Promise<string | null> {
  const res = await fetch(
    `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=5&orientation=landscape&size=medium`,
    { headers: { Authorization: process.env.PEXELS_API_KEY! } }
  );
  if (!res.ok) return null;
  const data = await res.json() as any;
  for (const video of (data.videos || [])) {
    const files = (video.video_files || []).sort((a: any, b: any) => b.width - a.width);
    const file = files.find((f: any) => f.width <= 1920 && f.file_type === 'video/mp4');
    if (file?.link) return file.link;
  }
  return null;
}

async function uploadToSupabase(
  buf: Buffer, bucket: string, storagePath: string, contentType: string
): Promise<string> {
  const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const SUPA_SVC = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const res = await fetch(`${SUPA_URL}/storage/v1/object/${bucket}/${storagePath}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${SUPA_SVC}`, 'Content-Type': contentType, 'x-upsert': 'true' },
    body: buf,
  });
  if (!res.ok) throw new Error(`Upload failed: ${await res.text()}`);
  return `${SUPA_URL}/storage/v1/object/public/${bucket}/${storagePath}`;
}

async function getOrFetchBroll(brollKey: string, tmpDir: string): Promise<string> {
  const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const storagePath = `broll/${brollKey}.mp4`;
  const publicUrl = `${SUPA_URL}/storage/v1/object/public/course-videos/${storagePath}`;
  const check = await fetch(publicUrl, { method: 'HEAD' });
  if (check.ok) return publicUrl;

  const query = BROLL_MAP[brollKey] || BROLL_MAP['default'];
  const clipUrl = await fetchPexelsClipUrl(query);
  if (!clipUrl) throw new Error(`No Pexels clip: ${query}`);

  const tmpPath = path.join(tmpDir, `${brollKey}.mp4`);
  const trimPath = path.join(tmpDir, `${brollKey}-trim.mp4`);
  execSync(`curl -sL "${clipUrl}" -o "${tmpPath}"`, { stdio: 'pipe' });
  execSync(`ffmpeg -y -i "${tmpPath}" -t 30 -c copy "${trimPath}" 2>/dev/null`, { stdio: 'pipe' });

  const buf = fs.readFileSync(trimPath);
  const url = await uploadToSupabase(buf, 'course-videos', storagePath, 'video/mp4');
  fs.unlinkSync(tmpPath);
  fs.unlinkSync(trimPath);
  return url;
}

function getAudioDuration(audioPath: string): number {
  try {
    return parseFloat(
      execSync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${audioPath}"`, { stdio: 'pipe' }).toString().trim()
    ) || 60;
  } catch { return 60; }
}

async function processLesson(
  lesson: { id: string; title: string; slug: string | null; content: string | null },
  tmpDir: string
): Promise<string> {
  const slug = lesson.slug || `lesson-${lesson.id.slice(0, 8)}`;

  // TTS
  const audioPath = path.join(tmpDir, `${slug}.mp3`);
  await generateTTS(buildNarration(lesson.title, lesson.content || ''), audioPath);
  const audioUrl = await uploadToSupabase(fs.readFileSync(audioPath), 'lesson-audio', `barber/${slug}.mp3`, 'audio/mpeg');
  fs.unlinkSync(audioPath);

  // B-roll
  const sections = (lesson.content || lesson.title).split('\n## ').slice(0, 3);
  const brollKeys = [...new Set(sections.map(s => pickBrollKey(s)))].slice(0, 3);
  if (!brollKeys.length) brollKeys.push('default');
  const brollUrls: string[] = [];
  for (const key of brollKeys) {
    try { brollUrls.push(await getOrFetchBroll(key, tmpDir)); }
    catch { brollUrls.push(await getOrFetchBroll('default', tmpDir)); }
  }

  // Download b-roll to tmp
  const clipPaths: string[] = [];
  for (let i = 0; i < brollUrls.length; i++) {
    const p = path.join(tmpDir, `clip-${slug}-${i}.mp4`);
    execSync(`curl -sL "${brollUrls[i]}" -o "${p}"`, { stdio: 'pipe' });
    clipPaths.push(p);
  }

  // Re-download audio for assembly
  const audioPath2 = path.join(tmpDir, `${slug}-asm.mp3`);
  execSync(`curl -sL "${audioUrl}" -o "${audioPath2}"`, { stdio: 'pipe' });
  const duration = getAudioDuration(audioPath2);

  // Concat list
  const concatPath = path.join(tmpDir, `concat-${slug}.txt`);
  let concatContent = clipPaths.map(p => `file '${p}'`).join('\n') + '\n';
  if (clipPaths.length * 30 < duration) concatContent += clipPaths.map(p => `file '${p}'`).join('\n') + '\n';
  fs.writeFileSync(concatPath, concatContent);

  // Assemble
  const videoPath = path.join(tmpDir, `${slug}.mp4`);
  execSync(
    `ffmpeg -y -f concat -safe 0 -i "${concatPath}" -i "${audioPath2}" -map 0:v:0 -map 1:a:0 -c:v libx264 -preset fast -crf 23 -c:a aac -b:a 128k -t ${duration} -vf "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2,setsar=1" "${videoPath}" 2>/dev/null`,
    { stdio: 'pipe', timeout: 300000 }
  );

  const videoUrl = await uploadToSupabase(fs.readFileSync(videoPath), 'course-videos', `barber/${slug}.mp4`, 'video/mp4');

  // Cleanup
  for (const p of [...clipPaths, audioPath2, concatPath, videoPath]) { try { fs.unlinkSync(p); } catch {} }

  return videoUrl;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const { courseId } = await params;
  const body = await request.json().catch(() => ({}));
  const { lessonId, force = false } = body as { lessonId?: string; force?: boolean };

  // Check ffmpeg available
  try { execSync('which ffmpeg', { stdio: 'pipe' }); }
  catch { return safeError('ffmpeg not available in this environment. Run on Railway.', 503); }

  if (!process.env.OPENAI_API_KEY) return safeError('OPENAI_API_KEY not set', 503);
  if (!process.env.PEXELS_API_KEY) return safeError('PEXELS_API_KEY not set', 503);

  const sb = getAdminClient();

  // Fetch lessons to process
  let query = sb
    .from('course_lessons')
    .select('id, title, slug, content, lesson_type, video_url')
    .eq('course_id', courseId)
    .order('order_index');

  if (lessonId) {
    query = query.eq('id', lessonId) as any;
  } else if (!force) {
    query = query.or('video_url.is.null,video_url.like./videos/%') as any;
  }

  const { data: lessons, error } = await query;
  if (error) return safeInternalError(error, 'Failed to fetch lessons');
  if (!lessons?.length) return NextResponse.json({ ok: true, generated: 0, message: 'All lessons already have videos' });

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vid-gen-'));
  const results: { id: string; title: string; video_url?: string; error?: string }[] = [];

  for (const lesson of lessons) {
    try {
      const videoUrl = await processLesson(lesson as any, tmpDir);
      await sb.from('course_lessons').update({ video_url: videoUrl }).eq('id', lesson.id);
      results.push({ id: lesson.id, title: lesson.title, video_url: videoUrl });
    } catch (err: any) {
      results.push({ id: lesson.id, title: lesson.title, error: err.message });
    }
  }

  try { fs.rmSync(tmpDir, { recursive: true }); } catch {}

  const ok = results.filter(r => r.video_url).length;
  const failed = results.filter(r => r.error).length;

  return NextResponse.json({ ok: true, generated: ok, failed, results });
}
