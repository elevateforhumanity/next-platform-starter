import { redirect } from 'next/navigation';

// /admin/command-center → /admin/mission-control (canonical observability page)
export default function CommandCenterPage() {
  redirect('/admin/mission-control');
}
