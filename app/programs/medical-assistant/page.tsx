import heroBanners from '@/content/heroBanners';
import MedicalAssistantProgramPageClient from './MedicalAssistantProgramPageClient';

export default function MedicalAssistantProgramPage() {
  const heroBanner = heroBanners['medical-assistant'] ?? null;
  return <MedicalAssistantProgramPageClient heroBanner={heroBanner} />;
}
