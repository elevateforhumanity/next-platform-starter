import { Metadata } from 'next';
import BeautyProgramPage from '@/components/beauty/BeautyProgramPage';
import { BARBER_APPRENTICESHIP } from '@/data/programs/barber-apprenticeship';
import { validateProgram } from '@/lib/programs/program-schema';

export const dynamic = 'force-dynamic';

const p = BARBER_APPRENTICESHIP;

const errors = validateProgram(p);
if (errors.length > 0) {
  throw new Error(
    `Barber Apprenticeship program schema validation failed:\n${errors.map((e) => `  ${e.field}: ${e.message}`).join('\n')}`
  );
}

export const metadata: Metadata = {
  title: p.metaTitle,
  description: p.metaDescription,
  alternates: { canonical: '/programs/barber-apprenticeship' },
};

export default async function BarberApprenticeshipPage() {
  return <BeautyProgramPage program={p} />;
}
