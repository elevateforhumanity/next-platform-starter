import type { Metadata } from 'next';
import ProgramApplyPage from '@/components/programs/ProgramApplyPage';
import { SOFTWARE_DEV } from '@/data/programs/software-development';

export const metadata: Metadata = {
  title: `Apply — ${SOFTWARE_DEV.title} | Elevate for Humanity`,
  description: `Apply for the ${SOFTWARE_DEV.title} program at Elevate for Humanity.`,
  robots: { index: false },
};

export default function ApplyPage() {
  return <ProgramApplyPage program={SOFTWARE_DEV} />;
}
