import { redirect } from 'next/navigation';

export const metadata = {
  title: "Apprenticeship Programs",
  description: "Explore our apprenticeship programs in cosmetology, barbering, and more.",
  robots: { index: true, follow: true },
};

export default function ApprenticeshipProgramsPage() {
  redirect('/barber-and-beauty-apprenticeships');
}