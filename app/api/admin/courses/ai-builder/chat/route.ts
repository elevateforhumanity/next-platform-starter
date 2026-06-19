/**
 * POST /api/admin/courses/ai-builder/chat
 * Streams AI responses for course generation using Gemini.
 */
import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

interface Message { role: 'user' | 'assistant'; content: string; }

const COURSE_SYSTEM_PROMPT = `You are an expert curriculum designer for vocational training and workforce development programs. 

Create complete, industry-aligned courses with detailed lesson content. Return JSON:

{
  "title": "Course Title",
  "subtitle": "Brief subtitle", 
  "description": "Full description",
  "audience": "Who this is for",
  "duration_hours": 40,
  "category": "Category",
  "passing_score": 70,
  "completion_rule": "Complete all modules",
  "modules": [
    {
      "title": "Module 1 Title",
      "sort_order": 1,
      "lessons": [
        {
          "lesson_number": 1,
          "title": "Lesson Title",
          "description": "What students will learn",
          "content": "Full HTML content (300-500 words of real instructional content)",
          "duration_minutes": 45,
          "quiz_questions": [
            {
              "question": "Question text?",
              "options": ["Option A", "Option B", "Option C", "Option D"],
              "correct_index": 0,
              "explanation": "Why this is correct"
            }
          ]
        }
      ]
    }
  ]
}`;

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;
  
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const { messages } = body as { messages: Message[] };

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages array required' }, { status: 400 });
    }

    const conversation = [
      { role: 'user', parts: [{ text: COURSE_SYSTEM_PROMPT }] },
      ...messages.slice(-6).map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
    ];

    const apiKey = process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({ error: 'AI not configured. Set GOOGLE_GEMINI_API_KEY.' }, { status: 500 });
    }

    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: conversation,
        generationConfig: { temperature: 0.7, maxOutputTokens: 8192 },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error('Gemini API error', error);
      return NextResponse.json({ error: 'AI generation failed' }, { status: 500 });
    }

    const data = await response.json();
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Extract course JSON
    let course = null;
    const jsonMatch = responseText.match(/\{[\s\S]*"modules"[\s\S]*\}/);
    if (jsonMatch) {
      try { course = JSON.parse(jsonMatch[0]); } catch {}
    }

    // Use TextEncoder to properly encode strings for ReadableStream
    const encoder = new TextEncoder();
    
    const stream = new ReadableStream({
      start(controller) {
        try {
          for (const chunk of responseText.match(/.{1,50}/g) || []) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'text', content: chunk })}\n\n`));
          }
          if (course) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'course_ready', course })}\n\n`));
          }
          controller.close();
        } catch (err) {
          logger.error('[course-builder/chat] stream error', err);
          controller.error(err);
        }
      }
    });

    return new Response(stream, {
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' },
    });

  } catch (err) {
    logger.error('Course builder error', err);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
