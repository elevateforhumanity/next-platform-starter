import { redirect } from 'next/navigation';

export default function StudioIndexPage() {
  redirect('/admin/dev-studio?tab=courses');
}
