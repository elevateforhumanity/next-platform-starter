import { redirect } from 'next/navigation';

export default function StudentHoursRedirect() {
  redirect('/learner/dashboard');
}
