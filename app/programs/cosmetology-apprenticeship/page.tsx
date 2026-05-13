import { Metadata } from 'next';
import CosmetologyApprenticeshipClient from './CosmetologyApprenticeshipClient';

export const metadata: Metadata = {
  title: 'Cosmetology Apprenticeship | Elevate for Humanity',
  description: 'Join Indiana\'s premier cosmetology apprenticeship program. Earn while you learn with paid on-the-job training and classroom instruction.',
  openGraph: {
    title: 'Cosmetology Apprenticeship',
    description: 'Paid apprenticeship in cosmetology with real wages, benefits, and a path to entrepreneurship.',
  },
};

export default function CosmetologyApprenticeshipPage() {
  return <CosmetologyApprenticeshipClient />;
}
