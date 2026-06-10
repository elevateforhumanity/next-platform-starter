import { NextResponse } from 'next/server';
import { safeError } from '@/lib/api/safe-error';

export function isMissingTable(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  return (
    error.code === '42P01' ||
    error.code === 'PGRST205' ||
    (error.message?.includes('relation') && error.message.includes('does not exist')) === true
  );
}

export function tableNotReadyResponse() {
  return safeError(
    'Dev Studio OS tables not found. Apply migration 20260708000005_dev_studio_full_os.sql in Supabase Dashboard.',
    503,
  );
}

export function jsonOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}
