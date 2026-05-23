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

// System prompt moved to lib/ai/orchestrator.ts (task: 'prospective_student_chat')

export async function POST(req: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    const { message, conversationId } = await req.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Get user if authenticated (optional for chat)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Get or create conversation
    let convId = conversationId;
    if (!convId) {
      const { data: newConv } = await supabase
        .from('ai_assistant_conversations')
        .insert({
          user_id: user?.id || null,
          started_at: new Date().toISOString(),
        })
        .select('id')
        .single();
      convId = newConv?.id;
    }

    // Get conversation history
    const { data: history } = await supabase
      .from('ai_assistant_messages')
      .select('role, content')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true })
      .limit(20);

    // Build messages array for OpenAI
    const messages = [
      { role: 'system' as const, content: SYSTEM_PROMPT },
      ...(history || []).map((msg: any) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
      { role: 'user' as const, content: message },
    ];

    // Route through centralized AI orchestrator
    const { runAITask } = await import('@/lib/ai/orchestrator');
    const aiResult = await runAITask({
      task: 'prospective_student_chat',
      prompt: message,
      context: { history: (history || []).map((m: any) => ({ role: m.role, content: m.content })), userId: user?.id },
      maxTokens: 300,
    });

    const assistantMessage = aiResult.content ||
      "I'm sorry, I couldn't process that. Please try again or call 317-314-3757 for help.";

    // Save messages to database
    if (convId) {
      await supabase.from('ai_assistant_messages').insert([
        { conversation_id: convId, role: 'user', content: message },
        { conversation_id: convId, role: 'assistant', content: assistantMessage },
      ]);
    }

    return NextResponse.json({
      success: true,
      message: assistantMessage,
      conversationId: convId,
    });
  } catch (error) {
    logger.error('AI Assistant error:', error);

    // Fallback response if AI fails
    return NextResponse.json({
      success: true,
      message:
        "I'm having trouble connecting right now. Please call us at 317-314-3757 or visit our [Contact Page](/contact) for assistance.",
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
