import { redirect } from 'next/navigation';
// Consolidated into course-builder. Redirect to canonical route.
export default function Page() { redirect('/admin/course-builder/templates'); }
