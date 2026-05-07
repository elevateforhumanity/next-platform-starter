/**
 * /api/devstudio/chat
 *
 * AI coding assistant for Dev Studio. Admin-only.
 * Provider chain (all free, no OpenAI):
 *   1. Groq — llama-3.3-70b-versatile (14,400 req/day free)
 *   2. Gemini — gemini-1.5-flash (1,500 req/day free)
 */

import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { hydrateProcessEnv } from '@/lib/secrets';
import { isGroqConfigured, getGroqClient } from '@/lib/groq-client';
import { isGeminiConfigured } from '@/lib/gemini-client';
import { GoogleGenerativeAI } from '@google/generative-ai';

async function _POST(req: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    // Ensure runtime secrets from app_secrets table are merged into process.env.
    // ECS injects SSM params at container start, but hydrateProcessEnv fills any
    // gaps (e.g. keys stored only in app_secrets, not SSM).
    await hydrateProcessEnv();

    const { messages, fileContext } = await req.json();

    const systemPrompt = `You are an expert coding assistant integrated into Dev Studio, a browser-based IDE for the Elevate LMS platform.
Stack: Next.js 16 App Router, Supabase (PostgreSQL), TypeScript, Tailwind CSS, AWS ECS.

You help admins:
- Write and edit code
- Debug issues
- Explain code
- Suggest improvements

When asked to edit a file, respond with the complete updated code in a fenced code block with the filename:
\`\`\`filename.tsx
// complete file content here
\`\`\`

Current file context:
${fileContext || 'No file currently open'}

Be concise and direct. Provide working code.`;

    let assistantMessage: string | null = null;
    let provider = 'none';

    // 1. Try Groq (free, fast — llama-3.3-70b)
    if (isGroqConfigured()) {
      try {
        const groq = getGroqClient();
        const res = await groq.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'system', content: systemPrompt }, ...messages],
          temperature: 0.5,
          max_tokens: 4096,
        });
        assistantMessage = res.choices[0]?.message?.content ?? null;
        provider = 'groq';
      } catch (err) {
        logger.warn('[devstudio/chat] Groq failed, trying Gemini', err);
      }
    }

    // 2. Fallback to Gemini (free — gemini-1.5-flash)
    if (!assistantMessage && isGeminiConfigured()) {
      try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
        const model = genAI.getGenerativeModel({
          model: 'gemini-1.5-flash',
          systemInstruction: systemPrompt,
        });
        const history = messages.slice(0, -1).map((m: { role: string; content: string }) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        }));
        const chat = model.startChat({ history });
        const last = messages[messages.length - 1];
        const result = await chat.sendMessage(last.content);
        assistantMessage = result.response.text();
        provider = 'gemini';
      } catch (err) {
        logger.warn('[devstudio/chat] Gemini failed', err);
      }
    }

    if (!assistantMessage) {
      logger.error('[devstudio/chat] no provider available', {
        hasGroq: isGroqConfigured(),
        hasGemini: isGeminiConfigured(),
      });
      return NextResponse.json(
        {
          error: 'AI Assistant is not configured. Add GROQ_API_KEY or GEMINI_API_KEY to the admin service environment (SSM Parameter Store → /elevate/GROQ_API_KEY).',
          debug: { hasGroq: isGroqConfigured(), hasGemini: isGeminiConfigured(), service: 'admin' },
        },
        { status: 503 }
      );
    }

    // Log to DB — non-fatal
    try {
      const supabase = await createClient();
      const db = await requireAdminClient();
      const { data: { user } } = await supabase.auth.getUser();
      const userMessage = messages[messages.length - 1]?.content || '';
      await db.from('devstudio_chat_log').insert({
        user_id: user?.id || null,
        user_message: userMessage,
        assistant_response: assistantMessage,
        file_context: fileContext || null,
        provider,
      }).catch(() => {});
    } catch (err) {
      logger.warn('[devstudio/chat] DB log failed', err);
    }

    return NextResponse.json({ message: assistantMessage });
  } catch (error) {
    logger.error('[devstudio/chat] error', error);
    return NextResponse.json({ error: 'Failed to get AI response' }, { status: 500 });
  }
}

export const POST = withApiAudit('/api/devstudio/chat', _POST);
