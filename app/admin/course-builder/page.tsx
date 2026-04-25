import { redirect } from 'next/navigation';

// Consolidated into /admin/courses/create — all three builders (AI, Blueprint, Manual) live there.
export default function CourseBuilderPage() {
  redirect('/admin/courses/create');
}
