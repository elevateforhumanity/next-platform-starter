'use server';

import { redirect } from 'next/navigation';
import { requireAdminClient } from '@/lib/supabase/admin';
import { requireRole } from '@/lib/auth/require-role';

export async function createUserAction(formData: FormData) {
  await requireRole(['admin', 'super_admin']);

  const email = (formData.get('email') as string)?.trim().toLowerCase();
  const password = formData.get('password') as string;
  const firstName = (formData.get('first_name') as string)?.trim();
  const lastName = (formData.get('last_name') as string)?.trim();
  const phone = (formData.get('phone') as string)?.trim() || null;
  const role = (formData.get('role') as string) || 'student';
  const notes = (formData.get('notes') as string)?.trim() || null;
  const sendWelcome = formData.get('send_welcome') === 'on';

  if (!email || !password || !firstName || !lastName) return;

  const db = await requireAdminClient();

  // Create auth user via Supabase admin API
  const { data: created, error: createErr } = await db.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      first_name: firstName,
      last_name: lastName,
      full_name: `${firstName} ${lastName}`,
      phone,
    },
  });

  if (createErr || !created?.user) {
    // Re-render with error — for now redirect with error param
    redirect(`/admin/users/new?error=${encodeURIComponent(createErr?.message ?? 'Failed to create user')}`);
  }

  const userId = created.user.id;

  // Upsert profile row
  await db.from('profiles').upsert({
    id: userId,
    email,
    first_name: firstName,
    last_name: lastName,
    full_name: `${firstName} ${lastName}`,
    phone,
    role,
    notes,
    is_active: true,
  });

  redirect('/admin/staff');
}
