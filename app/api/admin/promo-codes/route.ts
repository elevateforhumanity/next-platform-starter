import { apiRequireAdmin } from '@/lib/admin/guards';
import {
  GET as adminGET,
  POST as adminPOST,
  PUT as adminPUT,
  DELETE as adminDELETE,
} from '@/apps/admin/app/api/admin/promo-codes/route';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;
  return adminGET(request);
}

export async function POST(request: Request) {
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;
  return adminPOST(request);
}

export async function PUT(request: Request) {
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;
  return adminPUT(request);
}

export async function DELETE(request: Request) {
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;
  return adminDELETE(request);
}
