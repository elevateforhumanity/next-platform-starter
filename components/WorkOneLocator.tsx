import Link from 'next/link';
import { WorkOneIndianaMap } from '@/components/workone/WorkOneIndianaMap';
import { getWorkOneRegion } from '@/data/workone/indiana-regions';

/** @deprecated Prefer WorkOneIndianaMap — kept for career-services page compatibility */
export default function WorkOneLocator() {
  const central = getWorkOneRegion('central-indiana');

  return (
    <>
      {central && <WorkOneIndianaMap region={central} />}
      <div className="pb-12 text-center">
        <Link
          href="/find-workone"
          className="text-sm font-semibold text-brand-blue-700 hover:underline"
        >
          Browse all Indiana WorkOne regions →
        </Link>
      </div>
    </>
  );
}
