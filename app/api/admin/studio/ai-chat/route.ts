/**
 * POST /api/admin/studio/ai-chat
 *
 * Course-aware AI chat endpoint for the Studio AI panel.
 * Streams responses via SSE. Requires admin auth.
 *
 * Body:
 *   courseId      — current course being edited
 *   courseContext — string summary built by CourseProvider.buildAIContext()
 *   messages      — rolling conversation history (max 12 entries)
 *   activePanel   — which studio panel is active (blueprint|curriculum|quiz|media|publish)
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { logger } from '@/lib/logger';
import { aiChatStream } from '@/lib/ai/ai-service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SYSTEM_BASE = `You are the AI assistant embedded in the Elevate LMS Course Studio.
You help instructional designers and administrators build high-quality workforce training courses.

Your capabilities:
- Suggest course structure, module breakdowns, and lesson sequences
- Generate lesson content, learning objectives, and competency checks
- Create quiz questions aligned to lesson content and industry standards
- Review curriculum for gaps, compliance issues, and quality
- Guide publishing readiness

Rules:
- Always respond with awareness of the current course context provided
- Be specific and actionable — avoid generic advice
- When generating content, match the tone and level of the existing curriculum
- Flag compliance or standards gaps when you see them
- Keep responses concise unless asked for detail`;

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  let body: {
    courseId?: string;
    courseContext?: string;
    messages?: Array<{ role: string; content: string }>;
    activePanel?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { courseId, courseContext, messages = [], activePanel = 'blueprint' } = body;

  if (!courseId) {
    return NextResponse.json({ error: 'courseId required' }, { status: 400 });
  }

  // Build system prompt with course context
  const systemPrompt = [
    SYSTEM_BASE,
    courseContext ? `\n--- Current Course Context ---\n${courseContext}` : '',
    `\nActive panel: ${activePanel}`,
  ].filter(Boolean).join('\n');

  // Validate and sanitize messages
  const safeMessages = messages
    .filter(m => ['user', 'assistant', 'system'].includes(m.role) && typeof m.content === 'string')
    .slice(-12) // max 12 messages in context
    .map(m => ({ role: m.role as 'user' | 'assistant' | 'system', content: m.content }));

  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const delta of aiChatStream({
          model: 'gpt-4.1-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            ...safeMessages,
          ],
          temperature: 0.7,
          maxTokens: 1000,
        })) {
          const sseData = JSON.stringify({ choices: [{ delta: { content: delta } }] });
          controller.enqueue(encoder.encode(`data: ${sseData}\n\n`));
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      } catch (err) {
        logger.error('[studio/ai-chat] stream error', err instanceof Error ? err : undefined, { courseId });
        const errData = JSON.stringify({ choices: [{ delta: { content: '\n\nSorry, the AI assistant encountered an error. Please try again.' } }] });
        controller.enqueue(encoder.encode(`data: ${errData}\n\n`));
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // prevent nginx from buffering chunks
    },
  });
}
