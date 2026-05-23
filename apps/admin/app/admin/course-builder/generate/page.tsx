import type { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { GenerateCourseClient } from './GenerateCourseClient';

export const metadata: Metadata = {
  title: 'AI Course Generator | Admin',
  description: 'Generate workforce-ready courses from a course name using AI.',
};

export default async function GenerateCoursePage() {
  await requireRole(['admin', 'super_admin', 'staff']);
  return <GenerateCourseClient />;
}
