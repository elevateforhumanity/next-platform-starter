import heroBanners from '@/content/heroBanners';
import ElectricalProgramPageClient from './ElectricalProgramPageClient';

export default function ElectricalProgramPage() {
  const heroBanner = heroBanners['electrical'] ?? null;
  return <ElectricalProgramPageClient heroBanner={heroBanner} />;
}
