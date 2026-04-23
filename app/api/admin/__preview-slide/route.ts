import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';

export const runtime = 'nodejs';
export const maxDuration = 30;

/**
 * Renders a single slide frame as PNG for preview.
 * POST { slide, slideIndex, totalSlides, opts }
 * Requires admin role.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;
  } catch (e) {
    const msg = e instanceof Error ? e.message : '';
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: msg === 'FORBIDDEN' ? 403 : 401 }
    );
  }

  const body = await req.json();
  const { slide, slideIndex, totalSlides, opts } = body;

  const { renderSlideFrameForPreview } = await import('../../../../server/lesson-video-renderer');

  const buf: Buffer = await renderSlideFrameForPreview(slide, slideIndex, totalSlides, opts);

  return new NextResponse(buf, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'no-store',
    },
  });
}
