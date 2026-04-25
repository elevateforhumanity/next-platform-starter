import { logger } from '@/lib/logger';
/**
 * AI Assistant Chat API
 * 
 * Provides real AI-powered responses for the AIAssistantBubble component.
 * Stores conversation history in database for continuity.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';
export const maxDuration = 30;

// System prompt for the public AI assistant (marketing site only — not the LMS tutor)
const SYSTEM_PROMPT = `You are the Elevate for Humanity AI Assistant. You help visitors navigate the website and learn about workforce training programs.

Key information about Elevate for Humanity:
- Workforce development organization in Indianapolis, Indiana
- DOL Registered Apprenticeship Sponsor and ETPL-listed training provider
- Training may be fully funded for eligible participants through WIOA, Workforce Ready Grant (WRG), FSSA IMPACT, or Job Ready Indy (JRI) — eligibility is determined by the applicable agency, not by us
- Do NOT say training is "free" — say "may be funded" or "no out-of-pocket cost for eligible participants"
- Programs: HVAC Technician, CNA, Medical Assistant, Phlebotomy, Pharmacy Technician, Home Health Aide, Peer Recovery Specialist, IT Help Desk, Cybersecurity Analyst, Network Administration, Software Development, Web Development, Bookkeeping, Tax Preparation, Business Administration, Entrepreneurship, Project Management, Welding, Electrical, Plumbing, Construction Trades, Forklift, Barber Apprenticeship, Cosmetology, Esthetician, CPR & First Aid
- Phone: 317-314-3757
- Key pages: /programs, /check-eligibility, /apply, /funding, /about, /contact

Your role:
- Be friendly, helpful, and concise
- Guide users to relevant pages with markdown links like [View Programs](/programs)
- Help with eligibility questions — direct to /check-eligibility for a full assessment
- Encourage users to apply or contact the team
- If asked something you don't know, direct them to call 317-314-3757 or visit /contact

Keep responses brief (2-4 sentences) unless more detail is needed.`;

async function callGemini(
  messages: Array<{ role: string; content: string }>,
  systemPrompt: string,
): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const contents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const body = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents,
    generationConfig: { temperature: 0.7, maxOutputTokens: 512 },
  };

  const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.0-flash-lite'];
  for (const model of models) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return text;
    }
    if (res.status === 429) continue; // rate-limited — try next model
    break;
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(req, 'public');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    const { message, conversationId } = await req.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Auth is optional — public widget works for unauthenticated visitors
    const { data: { user } } = await supabase.auth.getUser();

    // Get or create conversation record (best-effort — failures don't break the chat)
    let convId = conversationId;
    if (!convId) {
      const { data: newConv } = await supabase
        .from('ai_assistant_conversations')
        .insert({ user_id: user?.id ?? null, started_at: new Date().toISOString() })
        .select('id')
        .single();
      convId = newConv?.id ?? null;
    }

    // Load conversation history (best-effort)
    const historyRows = convId
      ? (await supabase
          .from('ai_assistant_messages')
          .select('role, content')
          .eq('conversation_id', convId)
          .order('created_at', { ascending: true })
          .limit(20)
        ).data ?? []
      : [];

    const chatHistory = historyRows.map((m: any) => ({
      role: m.role as string,
      content: m.content as string,
    }));

    // Add the new user message
    const allMessages = [...chatHistory, { role: 'user', content: message }];

    let assistantMessage: string | null = null;

    // 1. Try Gemini (free tier, no cost)
    assistantMessage = await callGemini(allMessages, SYSTEM_PROMPT);

    // 2. Fall back to OpenAI gpt-4o-mini
    if (!assistantMessage && process.env.OPENAI_API_KEY) {
      try {
        const OpenAI = (await import('openai')).default;
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            ...allMessages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
          ],
          temperature: 0.7,
          max_tokens: 300,
        });
        assistantMessage = completion.choices[0]?.message?.content ?? null;
      } catch (err) {
        logger.error('OpenAI fallback error:', err);
      }
    }

    // 3. Static fallback — never leave the user with nothing
    if (!assistantMessage) {
      assistantMessage = "I'm having trouble connecting right now. Please call us at [317-314-3757](tel:3173143757) or visit our [Contact Page](/contact) for assistance.";
    }

    // Persist messages (best-effort — don't fail the response if DB is unavailable)
    if (convId) {
      await supabase.from('ai_assistant_messages').insert([
        { conversation_id: convId, role: 'user',      content: message },
        { conversation_id: convId, role: 'assistant', content: assistantMessage },
      ]).then(null, () => {}); // swallow errors
    }

    return NextResponse.json({ success: true, message: assistantMessage, conversationId: convId });

  } catch (error) {
    logger.error('AI Assistant error:', error);
    return NextResponse.json({
      success: true,
      message: "I'm having trouble connecting right now. Please call us at [317-314-3757](tel:3173143757) or visit our [Contact Page](/contact) for assistance.",
      conversationId: null,
    });
  }
}

export async function GET() {
  return NextResponse.json({
    name: 'AI Assistant Chat API',
    version: '1.0.0',
    description: 'Powers the AIAssistantBubble chat widget',
  });
}
