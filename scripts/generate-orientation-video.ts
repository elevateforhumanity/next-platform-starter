#!/usr/bin/env tsx
/**
 * Generates the barber apprenticeship orientation video.
 * Uses the handbook-sourced script in orientation-script.ts.
 * Each scene gets a matched b-roll clip + TTS narration (voice: onyx).
 * Output: public/videos/barber-orientation.mp4
 */

import { config } from 'dotenv';
import path from 'path';
config({ path: path.resolve(process.cwd(), '.env.local') });

import fs from 'fs';
import os from 'os';
import { execSync } from 'child_process';
import { ORIENTATION_SCENES } from './orientation-script';

const OPENAI_KEY = process.env.OPENAI_API_KEY!;
const BROLL_DIR = path.join(process.cwd(), 'public/videos/broll');
const OUT_PATH = path.join(process.cwd(), 'public/videos/barber-orientation.mp4');

function getFileDur(f: string): number {
  return parseFloat(
    execSync(`ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${f}"`, {
      encoding: 'utf8',
    }).trim(),
  );
}

async function generateTTS(text: string, outPath: string): Promise<void> {
  const res = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: { Authorization: `Bearer ${OPENAI_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'tts-1', voice: 'onyx', input: text, speed: 0.95 }),
  });
  if (!res.ok) throw new Error(`TTS failed: ${res.status} ${await res.text()}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(outPath, buf);
}

function buildScene(
  clipPath: string,
  audioPath: string,
  outPath: string,
  startOffset: number,
): void {
  const audioDur = getFileDur(audioPath);
  const clipDur = getFileDur(clipPath);
  const ss = startOffset % Math.max(1, clipDur - audioDur - 1);

  execSync(
    `ffmpeg -y -ss ${ss.toFixed(2)} -i "${clipPath}" -i "${audioPath}" ` +
      `-vf "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2:black,setsar=1,fps=24" ` +
      `-c:v libx264 -preset fast -crf 22 ` +
      `-c:a aac -b:a 128k ` +
      `-t ${audioDur.toFixed(2)} ` +
      `-map 0:v:0 -map 1:a:0 ` +
      `"${outPath}"`,
    { stdio: 'pipe', maxBuffer: 500 * 1024 * 1024 },
  );
}

async function main() {
  console.log('\n═══ Generating Barber Orientation Video ═══\n');
  console.log(`  ${ORIENTATION_SCENES.length} scenes\n`);

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'barber-orientation-'));
  const scenePaths: string[] = [];
  const clipOffsets: Record<string, number> = {};

  try {
    for (let i = 0; i < ORIENTATION_SCENES.length; i++) {
      const scene = ORIENTATION_SCENES[i];
      const clipPath = path.join(BROLL_DIR, `${scene.clipKey}.mp4`);
      const audioPath = path.join(tmpDir, `s${i}.mp3`);
      const scenePath = path.join(tmpDir, `s${i}.mp4`);
      const words = scene.narration.split(/\s+/).length;

      if (!fs.existsSync(clipPath)) {
        throw new Error(`Missing b-roll clip: ${scene.clipKey}.mp4`);
      }

      process.stdout.write(
        `  scene ${i + 1}/${ORIENTATION_SCENES.length} [${scene.clipKey}] "${scene.heading}" (${words}w)...`,
      );

      await generateTTS(scene.narration, audioPath);
      const dur = getFileDur(audioPath);

      const offset = clipOffsets[scene.clipKey] ?? 0;
      buildScene(clipPath, audioPath, scenePath, offset);
      clipOffsets[scene.clipKey] = offset + dur + 1;

      scenePaths.push(scenePath);
      process.stdout.write(` ${Math.round(dur)}s ✓\n`);
    }

    // Concat all scenes
    process.stdout.write(`\n  concat ${scenePaths.length} scenes...`);
    const listFile = path.join(tmpDir, 'list.txt');
    fs.writeFileSync(listFile, scenePaths.map((f) => `file '${f}'`).join('\n'));
    const rawPath = path.join(tmpDir, 'raw.mp4');
    execSync(`ffmpeg -y -f concat -safe 0 -i "${listFile}" -c copy "${rawPath}"`, {
      stdio: 'pipe',
      maxBuffer: 2000 * 1024 * 1024,
    });
    execSync(`ffmpeg -y -i "${rawPath}" -c copy -movflags +faststart "${OUT_PATH}"`, {
      stdio: 'pipe',
      maxBuffer: 2000 * 1024 * 1024,
    });

    const totalDur = getFileDur(OUT_PATH);
    const mins = Math.floor(totalDur / 60);
    const secs = Math.round(totalDur % 60);
    process.stdout.write(` ${mins}m ${secs}s ✅\n`);
    console.log(`\n  Output: ${OUT_PATH}`);
    console.log(`\n═══ Done ═══\n`);
  } finally {
    try {
      fs.rmSync(tmpDir, { recursive: true });
    } catch {}
  }
}

main().catch((e) => {
  console.error('Fatal:', e);
  process.exit(1);
});
