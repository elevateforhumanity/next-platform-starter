#!/usr/bin/env tsx
/**
 * scripts/enrich-blueprint-lessons.ts
 *
 * Reads a blueprint, runs LQS validation to find failing lessons, then uses
 * Groq to generate full LQS-compliant content for each one. Patches the
 * blueprint TS file in-place — no manual editing required.
 *
 * Usage:
 *   pnpm tsx scripts/enrich-blueprint-lessons.ts --blueprint barber-apprenticeship-v1
 *   pnpm tsx scripts/enrich-blueprint-lessons.ts --blueprint barber-apprenticeship-v1 --dry-run
 *   pnpm tsx scripts/enrich-blueprint-lessons.ts --blueprint barber-apprenticeship-v1 --slug barber-lesson-8
 */

import { config } from 'dotenv';
import path from 'path';

config({ path: path.resolve(process.cwd(), '.env.local') });

import fs from 'fs';
import { getBlueprintById, getBlueprintByProgramSlug } from '../lib/curriculum/blueprints';
import { validateBlueprintLessons } from '../lib/curriculum/lqs-validator';
import { groqJSON } from '../lib/groq-client';
import type { BlueprintLessonRef } from '../lib/curriculum/blueprints/types';

function getArg(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag);
  return idx !== -1 ? process.argv[idx + 1] : undefined;
}

const blueprintArg = getArg('--blueprint');
const slugFilter = getArg('--slug'); // enrich a single lesson by slug
const dryRun = process.argv.includes('--dry-run');

if (!blueprintArg) {
  console.error('Usage: pnpm tsx scripts/enrich-blueprint-lessons.ts --blueprint <id> [--slug <slug>] [--dry-run]');
  process.exit(1);
}

// ── Prompt builder ─────────────────────────────────────────────────────────

function buildPrompt(lesson: BlueprintLessonRef, programTitle: string, moduleTitle: string): string {
  return `You are a barber curriculum author for a DOL-registered Indiana Barber Apprenticeship program.

Write a lesson. Output ONLY a raw JSON object — no markdown, no fences, no preamble.

Lesson: ${lesson.title}
Module: ${moduleTitle}
Objective: ${lesson.objective || 'Master the practical and theoretical components of this lesson.'}

Content requirements (all 7 must appear — each section 60-120 words):
1. Tools/equipment/materials list (ul, at least 6 items)
2. IF/THEN decision block for hair type, skin, or client variation (p or ul, 2+ scenarios)
3. Sanitation/disinfection reference with specific product or method (p)
4. One "do NOT" contraindication with consequence (p strong)
5. One failure mode: specific cause + step-by-step recovery (p)
6. Visual execution cues: angles, positioning, appearance descriptors (p)
7. Step-by-step procedure (ol, 6-10 steps, each step 15-25 words)

Total content: 500-700 words. Use compact HTML — no whitespace between tags.

JSON schema (output this exact shape, nothing else):
{"content":"<h2>Overview</h2><p>...</p><h2>Tools Required</h2><ul><li>...</li></ul><h2>Procedure</h2><ol><li>...</li></ol><h2>Safety</h2><p>...</p><h2>Visual Cues</h2><p>...</p>","quizQuestions":[{"id":"${lesson.slug}-q1","question":"...","options":["A. ...","B. ...","C. ...","D. ..."],"correctAnswer":0,"explanation":"..."},{"id":"${lesson.slug}-q2","question":"...","options":["A. ...","B. ...","C. ...","D. ..."],"correctAnswer":1,"explanation":"..."},{"id":"${lesson.slug}-q3","question":"...","options":["A. ...","B. ...","C. ...","D. ..."],"correctAnswer":0,"explanation":"..."},{"id":"${lesson.slug}-q4","question":"SCENARIO: A client presents with [condition]. What do you do?","options":["A. ...","B. ...","C. ...","D. ..."],"correctAnswer":2,"explanation":"..."},{"id":"${lesson.slug}-q5","question":"SCENARIO: During the service you notice [issue]. Correct response?","options":["A. ...","B. ...","C. ...","D. ..."],"correctAnswer":1,"explanation":"..."}]}

Rules: correctAnswer is 0-based index. Questions 4-5 must be scenario-based. No literal newlines in the JSON string values.`;
}

// ── AI content generation via groqJSON (Groq + Gemini fallback) ──────────────

async function generateLessonContent(
  lesson: BlueprintLessonRef,
  programTitle: string,
  moduleTitle: string,
): Promise<{ content: string; quizQuestions: any[] } | null> {
  const prompt = buildPrompt(lesson, programTitle, moduleTitle);

  try {
    const result = await groqJSON<{ content: string; quizQuestions: any[] }>(prompt);

    if (!result.content || !Array.isArray(result.quizQuestions)) {
      console.error(`  ✗ Unexpected shape from AI for ${lesson.slug}`);
      return null;
    }

    return result;
  } catch (err: any) {
    console.error(`  ✗ AI generation error for ${lesson.slug}: ${err.message}`);
    return null;
  }
}

function countWords(text: string): number {
  return text
    .replace(/<[^>]*>/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function lessonPassesLqs(lesson: BlueprintLessonRef): { passed: boolean; violations: string[] } {
  const [result] = validateBlueprintLessons([lesson]);
  return {
    passed: result?.passed ?? false,
    violations: (result?.violations ?? []).map((v) => v.category),
  };
}

// ── Blueprint file patcher ─────────────────────────────────────────────────

function escapeForTemplateLiteral(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$\{/g, '\\${');
}

function patchBlueprintFile(
  filePath: string,
  slug: string,
  newContent: string,
  newQuizQuestions: any[],
): boolean {
  let src = fs.readFileSync(filePath, 'utf-8');

  // Find the lesson block by slug
  const slugMarker = `slug: '${slug}'`;
  const slugIdx = src.indexOf(slugMarker);
  if (slugIdx === -1) {
    console.error(`  ✗ Could not find slug ${slug} in blueprint file`);
    return false;
  }

  // Replace content template literal
  const contentStart = src.indexOf('content: `', slugIdx);
  const nextSlugIdx = src.indexOf("slug: 'barber-", slugIdx + slugMarker.length);
  const searchEnd = nextSlugIdx !== -1 ? nextSlugIdx : src.length;

  if (contentStart === -1 || contentStart > searchEnd) {
    // No existing content block — this shouldn't happen but handle gracefully
    console.error(`  ✗ No content block found for ${slug}`);
    return false;
  }

  const contentEnd = src.indexOf('`,', contentStart) + 2;
  if (contentEnd <= contentStart) {
    console.error(`  ✗ Could not find end of content block for ${slug}`);
    return false;
  }

  const escapedContent = escapeForTemplateLiteral(newContent);
  const newContentBlock = `content: \`${escapedContent}\`,`;
  src = src.slice(0, contentStart) + newContentBlock + src.slice(contentEnd);

  // Now handle quizQuestions — replace existing block or insert after content
  const quizStart = src.indexOf('quizQuestions: [', slugIdx);
  const newSlugIdx = src.indexOf("slug: 'barber-", slugIdx + slugMarker.length);
  const searchEnd2 = newSlugIdx !== -1 ? newSlugIdx : src.length;

  const questionsJson = JSON.stringify(newQuizQuestions, null, 10)
    .split('\n')
    .map((line, i) => (i === 0 ? line : '          ' + line))
    .join('\n');

  if (quizStart !== -1 && quizStart < searchEnd2) {
    // Find end of existing quizQuestions block
    let depth = 0;
    let qEnd = quizStart + 'quizQuestions: '.length;
    for (let i = qEnd; i < src.length; i++) {
      if (src[i] === '[') depth++;
      else if (src[i] === ']') {
        depth--;
        if (depth === 0) {
          qEnd = i + 1;
          break;
        }
      }
    }
    // Replace quiz block
    src = src.slice(0, quizStart) + `quizQuestions: ${questionsJson}` + src.slice(qEnd);
  } else {
    // Insert quizQuestions before the closing brace of the lesson object
    // Find the content block end again (after our replacement)
    const insertAfter = src.indexOf(newContentBlock, slugIdx) + newContentBlock.length;
    src = src.slice(0, insertAfter) + `\n          quizQuestions: ${questionsJson},` + src.slice(insertAfter);
  }

  fs.writeFileSync(filePath, src, 'utf-8');
  return true;
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  const blueprint =
    (await getBlueprintById(blueprintArg!)) ??
    (await getBlueprintByProgramSlug(blueprintArg!));

  if (!blueprint) {
    console.error(`No blueprint found for "${blueprintArg}"`);
    process.exit(1);
  }

  console.log(`\nBlueprint: ${blueprint.id} (${blueprint.programSlug})`);

  // Find blueprint file path
  const blueprintFile = path.join(
    process.cwd(),
    'lib/curriculum/blueprints',
    `${blueprint.programSlug}.ts`,
  );

  if (!fs.existsSync(blueprintFile)) {
    console.error(`Blueprint file not found: ${blueprintFile}`);
    process.exit(1);
  }

  // Collect all lessons
  const allLessons: Array<{ lesson: BlueprintLessonRef; moduleTitle: string }> = [];
  for (const mod of blueprint.modules) {
    for (const lesson of mod.lessons ?? []) {
      allLessons.push({ lesson, moduleTitle: mod.title });
    }
  }

  // Run LQS to find failures
  const lqsResults = validateBlueprintLessons(allLessons.map((l) => l.lesson));
  const failures = lqsResults.filter((r) => !r.passed);

  if (failures.length === 0) {
    console.log('\n✅ All lessons already pass LQS — nothing to enrich.\n');
    process.exit(0);
  }

  // Filter to single slug if requested
  const toEnrich = slugFilter
    ? failures.filter((f) => f.slug === slugFilter)
    : failures;

  console.log(`\nLQS failures to fix: ${toEnrich.length} / ${failures.length} total\n`);

  if (toEnrich.length === 0 && slugFilter) {
    console.log(`Lesson "${slugFilter}" is not in the failure list — already passing or not found.`);
    process.exit(0);
  }

  let enriched = 0;
  let failed = 0;
  const maxAttempts = 4;

  for (let i = 0; i < toEnrich.length; i++) {
    const failure = toEnrich[i];
    const entry = allLessons.find((l) => l.lesson.slug === failure.slug);
    if (!entry) continue;

    console.log(`[${i + 1}/${toEnrich.length}] ${failure.slug} — "${entry.lesson.title}"`);
    console.log(`  Violations: ${failure.violations.map((v) => v.category).join(', ')}`);

    if (dryRun) {
      console.log(`  (dry-run — skipping generation)\n`);
      continue;
    }

    // Throttle to avoid rate limits
    if (i > 0) {
      await new Promise((resolve) => setTimeout(resolve, 400));
    }

    let generated: { content: string; quizQuestions: any[] } | null = null;
    let lqsCheck: { passed: boolean; violations: string[] } = { passed: false, violations: [] };

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      generated = await generateLessonContent(
        entry.lesson,
        blueprint.credentialTitle,
        entry.moduleTitle,
      );

      if (!generated) {
        console.log(`  Attempt ${attempt}/${maxAttempts}: generation failed`);
        continue;
      }

      const candidateLesson: BlueprintLessonRef = {
        ...entry.lesson,
        content: generated.content,
        quizQuestions: generated.quizQuestions,
      };

      lqsCheck = lessonPassesLqs(candidateLesson);
      const words = countWords(generated.content);

      if (lqsCheck.passed && words >= 500) {
        break;
      }

      console.log(
        `  Attempt ${attempt}/${maxAttempts}: retrying (words=${words}, LQS=${lqsCheck.passed ? 'pass' : 'fail'}${lqsCheck.violations.length ? `, violations=${lqsCheck.violations.join(', ')}` : ''})`,
      );

      if (attempt === maxAttempts) {
        generated = null;
      }
    }

    if (!generated) {
      failed++;
      console.log(`  ✗ Could not generate LQS-compliant content after ${maxAttempts} attempts — skipping\n`);
      continue;
    }

    const patched = patchBlueprintFile(
      blueprintFile,
      failure.slug,
      generated.content,
      generated.quizQuestions,
    );

    if (patched) {
      enriched++;
      const finalWords = countWords(generated.content);
      console.log(`  ✓ Patched (${finalWords} words, ${generated.quizQuestions.length} questions)\n`);
    } else {
      failed++;
      console.log(`  ✗ Patch failed\n`);
    }
  }

  console.log(`\n─────────────────────────────────────────────`);
  console.log(`Enriched: ${enriched} / ${toEnrich.length}`);
  if (failed > 0) console.log(`Failed:   ${failed}`);

  if (!dryRun && enriched > 0) {
    console.log(`\nNext: run the LQS validator to confirm all lessons now pass:`);
    console.log(`  pnpm tsx scripts/seed-course-from-blueprint.ts --blueprint ${blueprint.id} --program <programId> --dry-run\n`);
  }
}

main().catch((err) => {
  console.error('Enrichment failed:', err.message);
  process.exit(1);
});
