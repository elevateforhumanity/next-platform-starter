/**
 * Course Builder Data Sources
 * All external data feeds for AI-powered course generation
 */

import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ready',
    sources: {
      careers: {
        name: 'O*NET Career Data',
        endpoint: '/api/onet/careers',
        provides: ['skills', 'tasks', 'knowledge', 'abilities'],
        requiresKey: true,
        keyEnv: 'ONET_API_KEY',
      },
      jobs: {
        name: 'Government Job Feeds',
        endpoint: '/api/jobs/government-feed',
        provides: ['real-world requirements', 'job trends'],
        sources: ['USAJobs.gov', 'CareerOneStop'],
        requiresKey: true,
      },
      bls: {
        name: 'Bureau of Labor Statistics',
        endpoint: '/api/course-builder/bls',
        provides: ['employment data', 'wages', 'outlook'],
        requiresKey: false,
      },
      certifications: {
        name: 'Industry Certifications',
        endpoint: '/api/course-builder/certifications',
        provides: ['exam requirements', 'competencies', 'renewal info'],
        requiresKey: false,
        bodies: ['NATE', 'NCLEX', 'CompTIA', 'CDL'],
      },
      curriculum: {
        name: 'Curriculum Frameworks',
        endpoint: '/api/course-builder/curriculum',
        provides: ['competencies', 'hour requirements', 'standards'],
        requiresKey: false,
        fields: ['healthcare', 'trades', 'technology', 'transportation'],
      },
    },
    usage: {
      courseGeneration: [
        '1. GET /api/onet/careers?action=careers&keyword=NURSE',
        '2. GET /api/course-builder/certifications?industry=healthcare',
        '3. GET /api/course-builder/curriculum?field=healthcare',
        '4. GET /api/course-builder/bls?action=wages',
        '5. POST all data to AI for course generation',
      ],
    },
  });
}