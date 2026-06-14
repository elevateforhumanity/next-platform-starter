import { Metadata } from 'next';
import BeautyProgramPage from '@/components/beauty/BeautyProgramPage';
import { COSMETOLOGY } from '@/data/programs/cosmetology-apprenticeship';
import { validateProgram } from '@/lib/programs/program-schema';

export const dynamic = 'force-dynamic';

const p = COSMETOLOGY;

const errors = validateProgram(p);
if (errors.length > 0) {
  throw new Error(
    `Cosmetology Apprenticeship program schema validation failed:\n${errors.map((e) => `  ${e.field}: ${e.message}`).join('\n')}`
  );
}

export const metadata: Metadata = {
  title: p.metaTitle,
  description: p.metaDescription,
  alternates: { canonical: '/programs/cosmetology-apprenticeship' },
};

export default async function CosmetologyApprenticeshipPage() {
  return <BeautyProgramPage program={p} />;
}
