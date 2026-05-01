// AUTH: enforced by delegate — /api/supervisor/verify-rep requires authenticated session
// Partner-friendly alias for verifying competency reps (shares the supervisor handler).
export { POST } from '@/app/api/supervisor/verify-rep/route';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
