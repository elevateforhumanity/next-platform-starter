#!/usr/bin/env tsx
/**
 * Seeds YouTube instructional video URLs into course_lessons.video_url
 * for the HVAC EPA 608 course.
 *
 * Sources: HVAC School, AC Service Tech, Refrigeration Mentor,
 *          Kalos Services, Word of Advice TV — all free/public.
 *
 * Usage:
 *   npx tsx scripts/seed-hvac-youtube-urls.ts --dry-run
 *   npx tsx scripts/seed-hvac-youtube-urls.ts
 */

import path from 'path';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

// Load .env.local
(function loadEnv() {
  const f = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(f)) return;
  for (const raw of fs.readFileSync(f, 'utf-8').split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq < 1) continue;
    const key = line.slice(0, eq).trim();
    const val = line.slice(eq + 1).trim();
    if (key && val && !process.env[key]) process.env[key] = val;
  }
})();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cuxzzpsyufcewtmicszk.supabase.co';
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const COURSE_ID    = '0ba9a61c-1f1b-4019-be6f-90e92eba2bc0';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

// ── YouTube video map: slug → YouTube URL ────────────────────────────
// Multiple URLs per lesson = mixed sources, rotated for variety
// All are free public instructional videos

// Real instructional videos: AC Service Tech, HVAC School, Refrigeration Mentor, Word of Advice TV
const YT = 'https://www.youtube.com/watch?v=';

const YOUTUBE_MAP: Record<string, string[]> = {
  'hvac-lesson-1': [YT + '644g-M63NLI', YT + 'XRXyVIdI6RU'], // HVAC System Basics for New Technicians | Safety Basics for HVAC Technicians
  'hvac-lesson-2': [YT + '644g-M63NLI', YT + 'xw3QFS1uZgk'], // HVAC System Basics | HVAC Resume & Career
  'hvac-lesson-3': [YT + 'xw3QFS1uZgk', YT + '644g-M63NLI'], // 1st HVAC Job Resume | HVAC Basics
  'hvac-lesson-5': [YT + '644g-M63NLI', YT + 'VJX0LyxRV0E'], // HVAC System Basics | Refrigeration Cycle 101
  'hvac-lesson-6': [YT + 'XRXyVIdI6RU', YT + '47Bpunc3Rg4'], // Safety Basics for HVAC Technicians | HVAC Electricity Basics
  'hvac-lesson-7': [YT + 'XRXyVIdI6RU', YT + 'TEf1Tsx_3MA'], // Safety Basics for HVAC Technicians | Fall Protection Basics
  'hvac-lesson-8': [YT + '644g-M63NLI', YT + 'VJX0LyxRV0E'], // HVAC System Basics | Refrigeration Cycle 101
  'hvac-lesson-10': [YT + '47Bpunc3Rg4', YT + 'FQRJsz1FZgI'], // HVAC Electricity Volts Amps Ohms | HVAC Multimeter Basics
  'hvac-lesson-11': [YT + 'Ogi5FMFudtM', YT + '47Bpunc3Rg4'], // Reading HVAC Electrical Wiring Diagrams | HVAC Electricity Basics
  'hvac-lesson-12': [YT + 'FQRJsz1FZgI', YT + '47Bpunc3Rg4'], // HVAC Multimeter Basics | HVAC Electricity Basics
  'hvac-lesson-13': [YT + 'FQisFmMtAis', YT + 'Ogi5FMFudtM'], // How To Check & Replace AC Capacitor | Reading HVAC Wiring Diagrams
  'hvac-lesson-15': [YT + 'rryuEEkaQao', YT + 'iCzjf4BBPEI'], // Gas Furnace How It Works | Common Furnace Problems
  'hvac-lesson-16': [YT + 'U7Tqk2Xh1Jw', YT + 'rryuEEkaQao'], // Air Handler Electric Strip Heating | Gas Furnace Operation
  'hvac-lesson-17': [YT + 'vQohvbck0pw', YT + '644g-M63NLI'], // HVAC Heat Pump Basics | HVAC System Basics
  'hvac-lesson-18': [YT + 'RpC2hehz6Og', YT + 'rryuEEkaQao'], // Advanced Combustion Analysis HVAC | Gas Furnace Operation
  'hvac-lesson-19': [YT + 'iCzjf4BBPEI', YT + 'rryuEEkaQao'], // Common Furnace Problems | Gas Furnace How It Works
  'hvac-lesson-21': [YT + 'VJX0LyxRV0E', YT + 'eKb_xbADAgA'], // Refrigeration Cycle 101 | Refrigeration Cycle
  'hvac-lesson-22': [YT + 'FKyGuHKUNpo', YT + 'VJX0LyxRV0E'], // Saturated Refrigerant Temp P/T Chart | Refrigeration Cycle 101
  'hvac-lesson-23': [YT + 'fhNb2gBhghE', YT + 'VJX0LyxRV0E'], // Scroll Reciprocating Rotary Compressors | Refrigeration Cycle
  'hvac-lesson-24': [YT + '-4ZPUkxYkLo', YT + 'RofUUMl5x84'], // HVAC Metering Device Types EEV TXV Piston | TXV Metering Device
  'hvac-lesson-25': [YT + 'T4akGxoXNXk', YT + 'WdS5tlPJGZc'], // Setting Charge By Subcool TXV System | Superheat Works
  'hvac-lesson-27': [YT + 'xbgoQCAMPlk', YT + 'BLtBaCt81i4'], // Refrigerant Names R22 R410A R32 Explained | EPA 608 Core Prep
  'hvac-lesson-28': [YT + 'BLtBaCt81i4', YT + 'xbgoQCAMPlk'], // EPA 608 Core Prep Part 1 | Refrigerant Types Explained
  'hvac-lesson-29': [YT + '5XMlQCfdiu8', YT + 'XRXyVIdI6RU'], // Refrigerant Recovery Machine Setup | Safety Basics HVAC
  'hvac-lesson-30': [YT + 'xbgoQCAMPlk', YT + 'BLtBaCt81i4'], // Refrigerant Names R22 R410A R32 | EPA 608 Core Prep
  'hvac-lesson-31': [YT + 'FKyGuHKUNpo', YT + 'p4n3sbe-6e8'], // P/T Chart Saturated Refrigerant | Digital Gauges Refrigerant Charge
  'hvac-lesson-32': [YT + '5XMlQCfdiu8', YT + 'fROHlPXw_H0'], // Refrigerant Recovery Machine Hose Tank Setup | How to Recover Refrigerant Running AC
  'hvac-lesson-33': [YT + 'BLtBaCt81i4', YT + 'xbgoQCAMPlk'], // EPA 608 Core Prep | Refrigerant Types Explained
  'hvac-lesson-35': [YT + '5XMlQCfdiu8', YT + 'fROHlPXw_H0'], // Refrigerant Recovery Machine Setup | Recover Refrigerant from AC
  'hvac-lesson-36': [YT + '5XMlQCfdiu8', YT + 'fROHlPXw_H0'], // Refrigerant Recovery Machine Setup | Recover Refrigerant from AC
  'hvac-lesson-37': [YT + '5XMlQCfdiu8', YT + 'fROHlPXw_H0'], // Refrigerant Recovery Machine Hose Tank | Recover Refrigerant
  'hvac-lesson-38': [YT + 'BLtBaCt81i4', YT + 'NO7jYG49dBk'], // EPA 608 Core Prep | Find Refrigerant Leak Electronic Detector
  'hvac-lesson-40': [YT + 'p4n3sbe-6e8', YT + 'FKyGuHKUNpo'], // Digital Gauges Refrigerant Charge Check | P/T Chart Refrigerant
  'hvac-lesson-41': [YT + 'fROHlPXw_H0', YT + '5XMlQCfdiu8'], // How to Recover Refrigerant Running AC | Recovery Machine Setup
  'hvac-lesson-42': [YT + 'NO7jYG49dBk', YT + '5XMlQCfdiu8'], // Find Refrigerant Leak Electronic Detector | Recovery Machine Setup
  'hvac-lesson-43': [YT + 'TllrD0Mt2LU', YT + '5XMlQCfdiu8'], // Vacuum Pump Hose Setups Air Conditioning | Recovery Machine Setup
  'hvac-lesson-44': [YT + 'NO7jYG49dBk', YT + 'BLtBaCt81i4'], // Find Refrigerant Leak Electronic Detector | EPA 608 Core Prep
  'hvac-lesson-45': [YT + '5XMlQCfdiu8', YT + 'TllrD0Mt2LU'], // Refrigerant Recovery Machine Setup | Vacuum Pump Hose Setups
  'hvac-lesson-47': [YT + 'BLtBaCt81i4', YT + 'xbgoQCAMPlk'], // EPA 608 Core Prep | Refrigerant Types Explained
  'hvac-lesson-48': [YT + 'kkiBgOzySHc', YT + 'BLtBaCt81i4'], // Purge Unit Uses in Recovery | EPA 608 Core Prep
  'hvac-lesson-49': [YT + 'kkiBgOzySHc', YT + 'BLtBaCt81i4'], // Explain Purge Unit Simple Words | EPA 608 Core
  'hvac-lesson-50': [YT + 'BLtBaCt81i4', YT + 'TllrD0Mt2LU'], // EPA 608 Core Prep | Vacuum Pump Setups
  'hvac-lesson-51': [YT + '8gvfCj57Fj8', YT + 'BLtBaCt81i4'], // Pressure Relief Valves | EPA 608 Core Prep
  'hvac-lesson-53': [YT + 'BLtBaCt81i4', YT + 'xbgoQCAMPlk'], // EPA 608 Core Prep Part 1 | Refrigerant Types
  'hvac-lesson-54': [YT + 'BLtBaCt81i4', YT + 'xbgoQCAMPlk'], // EPA 608 Core Prep | Refrigerant Names Decoded
  'hvac-lesson-60': [YT + '2SEDe0v8VPY', YT + 'T4akGxoXNXk'], // Explaining Superheat Subcooling to Apprentice | Setting Charge By Subcool
  'hvac-lesson-61': [YT + 'ZW579yzqnrY', YT + 'p4n3sbe-6e8'], // HVAC Commercial Rooftop Unit Beginners Guide | Digital Gauges Charge Check
  'hvac-lesson-62': [YT + 'NO7jYG49dBk', YT + '5XMlQCfdiu8'], // Find Refrigerant Leak Electronic Detector | Recovery Machine Setup
  'hvac-lesson-63': [YT + 'TllrD0Mt2LU', YT + '5XMlQCfdiu8'], // Vacuum Pump Hose Setups | Recovery Machine Setup
  'hvac-lesson-65': [YT + 'rO4yqiWjOtU', YT + 'Gb2DyjTeJ_M'], // How to Make Metal Duct Transition | Manual J Load Calculations 3D
  'hvac-lesson-66': [YT + 'Gb2DyjTeJ_M', YT + 'rO4yqiWjOtU'], // Manual J Load Calculations 3D | Metal Duct Transition
  'hvac-lesson-67': [YT + 'GgBvzGhoesI', YT + 'Ze7HCWcwnrI'], // Brazing HVAC Line Set to Service Valves | Flare Install Copper Line Set Mini Split
  'hvac-lesson-68': [YT + 'Ze7HCWcwnrI', YT + 'GgBvzGhoesI'], // Flare and Install Copper Line Set Mini Split | Brazing HVAC Line Set
  'hvac-lesson-69': [YT + '644g-M63NLI', YT + 'ZW579yzqnrY'], // HVAC System Basics Terminology | Commercial Rooftop Unit Guide
  'hvac-lesson-71': [YT + 'cJDRqWwlKug', YT + 'ZW579yzqnrY'], // AC Not Blowing Cold Air Problems | HVAC Rooftop Unit Guide
  'hvac-lesson-72': [YT + 'cJDRqWwlKug', YT + 'FQisFmMtAis'], // AC Not Blowing Cold Air | Check Replace AC Capacitor
  'hvac-lesson-73': [YT + 'iCzjf4BBPEI', YT + 'rryuEEkaQao'], // Most Common Problems High Efficiency Furnaces | Gas Furnace How It Works
  'hvac-lesson-74': [YT + 'cJDRqWwlKug', YT + 'iCzjf4BBPEI'], // AC Not Blowing Cold Air | Common Furnace Problems
  'hvac-lesson-75': [YT + 'UAk06LbJdBo', YT + '644g-M63NLI'], // Preliminary Customer Conversations HVAC | HVAC Basics
  'hvac-lesson-77': [YT + 'XRXyVIdI6RU', YT + 'TEf1Tsx_3MA'], // Safety Basics for HVAC Technicians Part 1 | Fall Protection Basics
  'hvac-lesson-78': [YT + 'TEf1Tsx_3MA', YT + 'XRXyVIdI6RU'], // Fall Protection Basics ABCD Demonstration | Safety Basics HVAC
  'hvac-lesson-79': [YT + '47Bpunc3Rg4', YT + 'FQRJsz1FZgI'], // HVAC Electricity Volts Amps Ohms | HVAC Multimeter Basics
  'hvac-lesson-80': [YT + 'XRXyVIdI6RU', YT + 'TEf1Tsx_3MA'], // Safety Basics HVAC Technicians | Fall Protection Basics
  'hvac-lesson-81': [YT + 'XRXyVIdI6RU', YT + 'TEf1Tsx_3MA'], // Safety Basics HVAC Technicians | Fall Protection Basics
  'hvac-lesson-82': [YT + 'XRXyVIdI6RU', YT + '644g-M63NLI'], // Safety Basics HVAC | HVAC System Basics
  'hvac-lesson-83': [YT + 'XRXyVIdI6RU', YT + 'GgBvzGhoesI'], // Safety Basics HVAC | Brazing HVAC Safety
  'hvac-lesson-85': [YT + 'XRXyVIdI6RU', YT + 'TEf1Tsx_3MA'], // Safety Basics HVAC Technicians | Fall Protection
  'hvac-lesson-86': [YT + 'XRXyVIdI6RU', YT + 'TEf1Tsx_3MA'], // Safety Basics HVAC | Fall Protection Basics
  'hvac-lesson-87': [YT + 'XRXyVIdI6RU', YT + '644g-M63NLI'], // Safety Basics HVAC | HVAC Basics
  'hvac-lesson-88': [YT + 'UAk06LbJdBo', YT + 'xw3QFS1uZgk'], // Preliminary Customer Conversations | HVAC Resume Career
  'hvac-lesson-90': [YT + 'xw3QFS1uZgk', YT + 'UAk06LbJdBo'], // 1st HVAC Job Resume | Customer Conversations
  'hvac-lesson-91': [YT + 'xw3QFS1uZgk', YT + 'UAk06LbJdBo'], // 1st HVAC Job Resume Part 1 | Customer Conversations
  'hvac-lesson-92': [YT + 'xw3QFS1uZgk', YT + '644g-M63NLI'], // HVAC Resume Career | HVAC System Basics
  'hvac-lesson-93': [YT + '644g-M63NLI', YT + 'xw3QFS1uZgk'], // HVAC System Basics Terminology | HVAC Career
  'hvac-lesson-94': [YT + '644g-M63NLI', YT + 'xw3QFS1uZgk'], // HVAC System Basics | HVAC Resume
};

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  console.log(`=== HVAC YouTube URL Seeder ${dryRun ? '(DRY RUN)' : ''} ===\n`);

  const { data: lessons, error } = await supabase
    .from('course_lessons')
    .select('id, slug, title, lesson_type, video_url')
    .eq('course_id', COURSE_ID)
    .order('order_index');

  if (error || !lessons) { console.error('DB error:', error?.message); process.exit(1); }

  let updated = 0, skipped = 0, missing = 0;

  for (const lesson of lessons) {
    if (lesson.lesson_type !== 'lesson') continue;

    const urls = YOUTUBE_MAP[lesson.slug];
    if (!urls?.length) {
      console.log(`  ⚠️  No URL mapped: ${lesson.slug} — ${lesson.title}`);
      missing++;
      continue;
    }

    // Pick URL — rotate based on lesson number for variety
    const lessonNum = parseInt(lesson.slug.replace('hvac-lesson-', '')) || 0;
    const url = urls[lessonNum % urls.length];

    if (lesson.video_url === url) { skipped++; continue; }

    console.log(`  ${dryRun ? 'DRY' : 'SET'} ${lesson.slug}: ${url.slice(32)}`);

    if (!dryRun) {
      const { error: e } = await supabase
        .from('course_lessons')
        .update({ video_url: url })
        .eq('id', lesson.id);
      if (e) { console.error('    ❌', e.message); continue; }
    }
    updated++;
  }

  console.log(`\n✅ ${updated} updated | ${skipped} already set | ${missing} unmapped`);
  if (missing > 0) console.log('Run with --dry-run to see which slugs need URLs added.');
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
