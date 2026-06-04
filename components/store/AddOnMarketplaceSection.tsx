'use client';

import { useState } from 'react';
import { Check, Plus } from 'lucide-react';
import { ADD_ON_MARKETPLACE } from '@/lib/store/platform-pricing';

interface Props {
  selectedSlugs: string[];
  onToggle: (slug: string) => void;
}

export function AddOnMarketplaceSection({ selectedSlugs, onToggle }: Props) {
  return (
    <section className="py-16 px-4 bg-slate-50" id="addons">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center text-slate-900 mb-2">Add-on marketplace</h2>
        <p className="text-slate-600 text-center mb-10 max-w-2xl mx-auto">
          A barber can start at $29/month. A workforce training provider can grow to $250–500/month
          by adding LMS, workforce, apprenticeship, employer portal, and AI modules.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {ADD_ON_MARKETPLACE.map((addon) => {
            const selected = selectedSlugs.includes(addon.slug);
            return (
              <div
                key={addon.slug}
                className={`rounded-xl border p-6 flex flex-col bg-white ${
                  selected ? 'border-brand-blue-500 ring-2 ring-brand-blue-200' : 'border-slate-200'
                }`}
              >
                <div className="flex justify-between items-start gap-2 mb-2">
                  <h3 className="font-bold text-slate-900">{addon.name}</h3>
                  <span className="text-lg font-bold text-brand-blue-600 whitespace-nowrap">
                    ${addon.priceMonthly}/mo
                  </span>
                </div>
                <p className="text-sm text-slate-600 mb-4">{addon.description}</p>
                {addon.usageNote && (
                  <p className="text-xs text-slate-500 mb-3">{addon.usageNote}</p>
                )}
                <ul className="space-y-2 mb-6 flex-1">
                  {addon.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2 text-sm text-slate-700">
                      <Check className="w-4 h-4 text-brand-green-600 flex-shrink-0 mt-0.5" />
                      {b}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => onToggle(addon.slug)}
                  className={`w-full py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 ${
                    selected
                      ? 'bg-brand-blue-600 text-white'
                      : 'border border-slate-300 text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  {selected ? 'Included at checkout' : 'Add to checkout'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/** Self-contained marketplace with local selection state */
export function AddOnMarketplaceStandalone({
  initialSlugs = [],
  onSelectionChange,
}: {
  initialSlugs?: string[];
  onSelectionChange?: (slugs: string[]) => void;
}) {
  const [selected, setSelected] = useState<string[]>(initialSlugs);

  const toggle = (slug: string) => {
    setSelected((prev) => {
      const next = prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug];
      onSelectionChange?.(next);
      return next;
    });
  };

  return <AddOnMarketplaceSection selectedSlugs={selected} onToggle={toggle} />;
}
