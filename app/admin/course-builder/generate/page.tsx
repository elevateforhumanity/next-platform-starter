import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/auth';
import { GenerateCourseClient } from './GenerateCourseClient';

export const metadata: Metadata = {
  title: 'AI Course Generator | Admin',
  description: 'Generate workforce-ready courses from a course name using AI.',
};

export default async function GenerateCoursePage() {
  await requireAdmin();
  return <GenerateCourseClient />;
}
