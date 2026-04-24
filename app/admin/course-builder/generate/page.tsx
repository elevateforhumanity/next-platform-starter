import type { Metadata } from 'next';
import { GenerateCourseClient } from './GenerateCourseClient';

export const metadata: Metadata = {
  title: 'AI Course Generator | Admin',
  description: 'Generate workforce-ready courses from a course name using AI.',
};

export default function GenerateCoursePage() {
  return <GenerateCourseClient />;
}
