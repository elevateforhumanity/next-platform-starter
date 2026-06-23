/**
 * POST /api/admin/course-builder/audit
 * 
 * Updated to use: lib/course-factory/
 * 
 * Migration: auditCourseTemplate → validateBlueprint
 */

import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { validateBlueprint } from '@/lib/course-factory/validator';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import type { CredentialBlueprint } from '@/lib/curriculum/blueprints/types';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;
  
  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;

  try {
    const body = (await req.json()) as CredentialBlueprint;
    const audit = validateBlueprint(body);
    
    return NextResponse.json({ 
      ok: true, 
      valid: audit.valid,
      errors: audit.errors,
      warnings: audit.warnings,
      errorCount: audit.errorCount,
      warningCount: audit.warningCount,
    });
  } catch (error) {
    logger.error('[course-builder/audit]', error);
    return NextResponse.json({ ok: false, error: 'Invalid request body' }, { status: 400 });
  }
}
