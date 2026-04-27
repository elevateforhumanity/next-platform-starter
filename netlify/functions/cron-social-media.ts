// Netlify scheduled function: social media auto-posting
// Schedule: 3x daily at 9 AM, 1 PM, 5 PM ET (14:00, 18:00, 22:00 UTC)
//
// Calls /api/social-media/scheduler which:
//   1. Reads active campaigns from social_media_campaigns
//   2. Determines which slot (morning/afternoon/evening) based on current hour
//   3. Posts the next scheduled content to Facebook, LinkedIn, Instagram
//   4. Logs results to social_media_posts
//
// Also processes blog posts and reels marked for social sharing:
//   - blog_posts with share_to_social = true and not yet posted
//   - reels with published = true and not yet posted
//
// Protected by CRON_SECRET — set this in Netlify site settings.
// Required env vars:
//   CRON_SECRET
//   FACEBOOK_PAGE_ID + FACEBOOK_ACCESS_TOKEN
//   LINKEDIN_ACCESS_TOKEN + LINKEDIN_ORGANIZATION_ID
//   NEXT_PUBLIC_SITE_URL

import type { Config } from '@netlify/functions';

export default async function handler() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.elevateforhumanity.org';
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error('[cron-social-media] CRON_SECRET not set — aborting');
    return { statusCode: 500 };
  }

  console.log('[cron-social-media] Firing social media scheduler');

  const res = await fetch(`${siteUrl}/api/social-media/scheduler`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${cronSecret}`,
    },
  });

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    console.error('[cron-social-media] Scheduler error:', body);
    return { statusCode: res.status };
  }

  console.log(
    `[cron-social-media] Posted ${body.posted ?? 0} times — slot: ${body.slot ?? 'unknown'}`,
    body.results ?? [],
  );

  return { statusCode: 200 };
}

export const config: Config = {
  schedule: '0 14,18,22 * * *', // 9 AM, 1 PM, 5 PM ET
};
