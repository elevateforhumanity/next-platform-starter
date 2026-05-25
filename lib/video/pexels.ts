/**
 * lib/video/pexels.ts
 *
 * Free background images from Pexels API.
 * API key is free at pexels.com/api — no credit card required.
 * Falls back to Pollinations.ai (zero-key AI images) if Pexels is unavailable.
 */

import { logger } from '@/lib/logger';

// ── Topic → search query map ──────────────────────────────────────────────────

const TOPIC_QUERIES: Record<string, string> = {
  foundations: 'community support people helping',
  ethics: 'professional meeting office trust',
  advocacy: 'people talking support community',
  cultural_competency: 'diverse people community culture',
  documentation: 'writing notes professional workspace',
  career_readiness: 'professional career success workplace',
  // HVAC
  hvac: 'hvac technician air conditioning',
  electrical: 'electrical wiring professional',
  // Barber
  barber: 'barbershop professional grooming',
  // Generic fallbacks
  default: 'professional learning education',
};

// ── Pexels API ────────────────────────────────────────────────────────────────

interface PexelsPhoto {
  id: number;
  src: { landscape: string; large2x: string; original: string };
  alt: string;
}

interface PexelsResponse {
  photos: PexelsPhoto[];
  total_results: number;
}

export async function getPexelsImage(
  domainKey: string,
  options: { orientation?: 'landscape' | 'portrait' | 'square'; perPage?: number } = {},
): Promise<string | null> {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) {
    logger.warn('[pexels] PEXELS_API_KEY not set — falling back to Pollinations');
    return getPollinationsImage(domainKey);
  }

  const query = TOPIC_QUERIES[domainKey] ?? TOPIC_QUERIES.default;
  const { orientation = 'landscape', perPage = 10 } = options;

  try {
    const url = new URL('https://api.pexels.com/v1/search');
    url.searchParams.set('query', query);
    url.searchParams.set('orientation', orientation);
    url.searchParams.set('per_page', String(perPage));
    url.searchParams.set('size', 'large');

    const res = await fetch(url.toString(), {
      headers: { Authorization: apiKey },
      next: { revalidate: 3600 }, // cache for 1 hour
    });

    if (!res.ok) {
      logger.warn('[pexels] API error', undefined, { status: res.status });
      return getPollinationsImage(domainKey);
    }

    const data: PexelsResponse = await res.json();
    if (!data.photos?.length) return getPollinationsImage(domainKey);

    // Pick a random photo from results for variety
    const photo = data.photos[Math.floor(Math.random() * data.photos.length)];
    return photo.src.large2x ?? photo.src.landscape;
  } catch (err) {
    logger.warn('[pexels] fetch error', undefined, { err });
    return getPollinationsImage(domainKey);
  }
}

// ── Pollinations.ai fallback (zero API key, AI-generated) ────────────────────

export function getPollinationsImage(domainKey: string): string {
  const prompt = TOPIC_QUERIES[domainKey] ?? TOPIC_QUERIES.default;
  const encoded = encodeURIComponent(
    `${prompt}, professional, cinematic lighting, high quality, 16:9`,
  );
  // Pollinations returns a JPEG directly from the URL — no API key needed
  return `https://image.pollinations.ai/prompt/${encoded}?width=1920&height=1080&nologo=true`;
}

// ── Pexels Video API ──────────────────────────────────────────────────────────

interface PexelsVideoFile {
  id: number;
  quality: string;
  file_type: string;
  link: string;
  width: number;
  height: number;
}

interface PexelsVideo {
  id: number;
  duration: number;
  video_files: PexelsVideoFile[];
}

interface PexelsVideoResponse {
  videos: PexelsVideo[];
  total_results: number;
}

/**
 * Fetch a stock video clip URL from Pexels for a given keyword.
 * Prefers landscape HD (1280×720 or better). Falls back to any available file.
 * Returns null if Pexels is unavailable — caller should use a static image instead.
 */
export async function getPexelsVideoClip(
  keyword: string,
  options: { minDuration?: number; maxDuration?: number; perPage?: number } = {},
): Promise<string | null> {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) {
    logger.warn('[pexels] PEXELS_API_KEY not set — no video clip available');
    return null;
  }

  const { minDuration = 5, maxDuration = 30, perPage = 10 } = options;

  try {
    const url = new URL('https://api.pexels.com/videos/search');
    url.searchParams.set('query', keyword);
    url.searchParams.set('orientation', 'landscape');
    url.searchParams.set('size', 'medium');
    url.searchParams.set('per_page', String(perPage));

    const res = await fetch(url.toString(), {
      headers: { Authorization: apiKey },
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      logger.warn('[pexels] Video API error', undefined, { status: res.status });
      return null;
    }

    const data: PexelsVideoResponse = await res.json();
    if (!data.videos?.length) return null;

    // Filter by duration, pick a random result for variety
    const suitable = data.videos.filter(
      (v) => v.duration >= minDuration && v.duration <= maxDuration,
    );
    const pool = suitable.length ? suitable : data.videos;
    const video = pool[Math.floor(Math.random() * pool.length)];

    // Prefer HD landscape file
    const hdFile =
      video.video_files.find((f) => f.quality === 'hd' && f.width >= 1280) ??
      video.video_files.find((f) => f.quality === 'sd' && f.width >= 640) ??
      video.video_files[0];

    return hdFile?.link ?? null;
  } catch (err) {
    logger.warn('[pexels] video fetch error', undefined, { err });
    return null;
  }
}

/**
 * Batch-fetch video clips for an array of scene keywords.
 * Returns a map of keyword → clip URL (or null if unavailable).
 */
export async function getSceneVideoClips(
  keywords: string[],
): Promise<Record<string, string | null>> {
  const unique = [...new Set(keywords)];
  const results: Record<string, string | null> = {};

  // Sequential to avoid hammering the Pexels rate limit (200 req/hour free tier)
  for (const keyword of unique) {
    results[keyword] = await getPexelsVideoClip(keyword);
    // Small delay between requests
    await new Promise((r) => setTimeout(r, 200));
  }

  return results;
}

// ── Batch fetch for a full course ─────────────────────────────────────────────

export async function getCourseBackgroundImages(
  domainKeys: string[],
): Promise<Record<string, string>> {
  const unique = [...new Set(domainKeys)];
  const results: Record<string, string> = {};

  await Promise.all(
    unique.map(async (key) => {
      const url = await getPexelsImage(key);
      results[key] = url ?? getPollinationsImage(key);
    }),
  );

  return results;
}
