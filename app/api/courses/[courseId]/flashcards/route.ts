/**
 * Flashcards API for NHA Exam Prep
 * 
 * GET  - Get flashcards for a course (user's progress included)
 * POST - Generate flashcards for a course using AI
 * PATCH - Update flashcard rating (spaced repetition)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/api/requireAuth';
import { aiChat } from '@/lib/ai/ai-service';
import { logger } from '@/lib/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  const { courseId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Get flashcards with user's progress
  const { data: flashcards, error } = await supabase
    .from('flashcards')
    .select(`
      *,
      flashcard_progress (
        rating,
        last_reviewed,
        next_review,
        review_count
      )
    `)
    .eq('course_id', courseId)
    .order('difficulty', { ascending: true });

  if (error) {
    logger.error('Flashcards fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch flashcards' }, { status: 500 });
  }

  // Filter by due reviews (spaced repetition)
  const now = new Date().toISOString();
  const dueCards = flashcards?.filter((card: any) => {
    const progress = card.flashcard_progress?.[0];
    return !progress?.next_review || progress.next_review <= now;
  }) || [];

  return NextResponse.json({
    flashcards,
    due_count: dueCards.length,
    total_count: flashcards?.length || 0,
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  const { courseId } = await params;
  const supabase = await createClient();

  // Get course lessons to generate flashcards from
  const { data: lessons } = await supabase
    .from('course_lessons')
    .select('title, content')
    .eq('course_id', courseId)
    .eq('is_published', true)
    .limit(10);

  if (!lessons?.length) {
    return NextResponse.json({ error: 'No lessons found for course' }, { status: 404 });
  }

  // Generate flashcards using AI
  const content = lessons.map((l: any) => l.content || l.title).join('\n\n');
  
  const aiResponse = await aiChat({
    model: 'gpt-4.1',
    messages: [
      {
        role: 'system',
        content: `You are a medical exam prep expert. Generate flashcards for NHA certification exam prep.
        Return JSON array with format:
        [{"front": "question", "back": "answer", "difficulty": 1-5}]
        Difficulty: 1=easy, 5=hard.
        Generate 20-30 flashcards covering key concepts.`
      },
      {
        role: 'user',
        content: `Generate flashcards for exam prep based on:\n${content.slice(0, 4000)}`
      }
    ],
    temperature: 0.7,
    maxTokens: 3000,
  });

  let flashcards;
  try {
    const clean = aiResponse.content?.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    flashcards = JSON.parse(clean || '[]');
  } catch {
    return NextResponse.json({ error: 'Failed to generate flashcards' }, { status: 500 });
  }

  // Insert flashcards
  const inserts = flashcards.map((card: any) => ({
    course_id: courseId,
    front: card.front,
    back: card.back,
    difficulty: card.difficulty || 2,
    source: 'ai_generated',
  }));

  const { data: inserted, error } = await supabase
    .from('flashcards')
    .insert(inserts)
    .select();

  if (error) {
    logger.error('Flashcard insert error:', error);
    return NextResponse.json({ error: 'Failed to save flashcards' }, { status: 500 });
  }

  return NextResponse.json({
    generated: inserted?.length || 0,
    flashcards: inserted,
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  const { courseId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { flashcardId, rating } = await request.json();

  // Calculate next review using SM-2 algorithm
  const intervals = [1, 3, 7, 14, 30, 60]; // days
  const nextReviewDays = intervals[Math.min(rating - 1, intervals.length - 1)];
  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + nextReviewDays);

  const { error } = await supabase
    .from('flashcard_progress')
    .upsert({
      user_id: user.id,
      flashcard_id: flashcardId,
      rating,
      last_reviewed: new Date().toISOString(),
      next_review: nextReview.toISOString(),
      review_count: supabase.sql`review_count + 1`,
    }, {
      onConflict: 'user_id,flashcard_id',
    });

  if (error) {
    return NextResponse.json({ error: 'Failed to update progress' }, { status: 500 });
  }

  // Update flashcard stats
  await supabase.rpc('increment_flashcard_stats', {
    p_flashcard_id: flashcardId,
    p_correct: rating >= 3,
  });

  return NextResponse.json({ success: true, next_review: nextReview.toISOString() });
}