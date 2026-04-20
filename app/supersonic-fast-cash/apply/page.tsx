export const dynamic = 'force-static';
export const revalidate = 86400;

import { redirect } from 'next/navigation';

export default function ApplyPage() {
  redirect('/supersonic-fast-cash/start');
}
