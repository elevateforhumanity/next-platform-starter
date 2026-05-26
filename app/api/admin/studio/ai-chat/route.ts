/**
 * POST /api/admin/studio/ai-chat
 *
 * Course-aware AI chat with tool execution.
 * Streams text deltas via SSE. When the AI calls a tool, emits a
 * tool_call event so the client can dispatch it to /api/admin/studio/tool-execute.
 *
 * SSE event types:
 *   data: {"type":"delta","content":"..."}   — text chunk
 *   data: {"type":"tool_call","name":"...","args":{...}}  — AI wants to run a tool
 *   data: [DONE]
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { logger } from '@/lib/logger';
import { STUDIO_TOOLS } from '@/lib/studio/tools';
import OpenAI from 'openai';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SYSTEM_BASE = `You are the AI operator embedded in the Elevate LMS Course Studio.
You do not just advise — you act. When a user asks you to create, generate, update, or publish,
call the appropriate tool immediately. Do not ask for confirmation unless the action is destructive.

Your tools:
- createLesson: add a lesson to the course
- createModule: add a module to the course
- generateQuiz: create quiz questions for a lesson
- attachVideo: attach a video URL to a lesson
- publishCourse: publish the course (only when explicitly requested)
- updateCourseTitle: update course title or description

Rules:
- Match content to the course context provided
- For HVAC/EPA/OSHA content, use accurate technical terminology
- After calling a tool, briefly confirm what was done
- If you need a lesson_id or module_id, use the IDs from the course context
- Keep text responses concise`;

function getOpenAIClient(): OpenAI | null {
  const key = process.env.OPENAI_API_KEY;
  if (!key || key === 'placeholder-build-key' || key === 'sk-placeholder-build-key') return null;
  return new OpenAI({ apiKey: key });
}

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
  if (!courseId) return NextResponse.json({ error: 'courseId required' }, { status: 400 });

  const openai = getOpenAIClient();
  if (!openai) {
    // No API key — return a static message
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      start(controller) {
        const msg = JSON.stringify({ type: 'delta', content: 'AI assistant is not configured. Set OPENAI_API_KEY to enable tool execution.' });
        controller.enqueue(encoder.encode(`data: ${msg}\n\n`));
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      },
    });
    return new Response(readable, {
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
    });
  }

  const systemPrompt = [
    SYSTEM_BASE,
    courseContext ? `\n--- Current Course Context ---\n${courseContext}` : '',
    `\nActive panel: ${activePanel}`,
  ].filter(Boolean).join('\n');

  const safeMessages = messages
    .filter(m => ['user', 'assistant'].includes(m.role) && typeof m.content === 'string')
    .slice(-12)
    .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));

  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      const send = (obj: Record<string, unknown>) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));

      try {
        const stream = await openai.chat.completions.create({
          model: 'gpt-4.1-mini',
          messages: [{ role: 'system', content: systemPrompt }, ...safeMessages],
          tools: STUDIO_TOOLS as OpenAI.Chat.Completions.ChatCompletionTool[],
          tool_choice: 'auto',
          temperature: 0.7,
          max_tokens: 1200,
          stream: true,
        });

        // Accumulate tool call chunks
        const toolCallAccum: Record<number, { name: string; args: string }> = {};

        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta;
          if (!delta) continue;

          // Text delta
          if (delta.content) {
            send({ type: 'delta', content: delta.content });
          }

          // Tool call chunks — accumulate across stream
          if (delta.tool_calls) {
            for (const tc of delta.tool_calls) {
              const idx = tc.index ?? 0;
              if (!toolCallAccum[idx]) toolCallAccum[idx] = { name: '', args: '' };
              if (tc.function?.name) toolCallAccum[idx].name += tc.function.name;
              if (tc.function?.arguments) toolCallAccum[idx].args += tc.function.arguments;
            }
          }

          // Emit accumulated tool calls when stream finishes
          if (chunk.choices[0]?.finish_reason === 'tool_calls') {
            for (const tc of Object.values(toolCallAccum)) {
              let args: Record<string, unknown> = {};
              try { args = JSON.parse(tc.args); } catch { /* malformed args */ }
              send({ type: 'tool_call', name: tc.name, args });
            }
          }
        }

        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      } catch (err) {
        logger.error('[studio/ai-chat] stream error', err instanceof Error ? err : undefined, { courseId });
        send({ type: 'delta', content: '\n\nSorry, the AI assistant encountered an error. Please try again.' });
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
      'X-Accel-Buffering': 'no',
    },
  });
}
