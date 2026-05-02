import type { Metadata } from 'next';
import { redirect } from 'next/navigation';


export default function MentorRootPage() {
  redirect('/mentor/dashboard');
}
