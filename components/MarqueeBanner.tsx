'use client';

const ITEMS = [
  'ELEVATE FOR HUMANITY',
  'WIOA · WRG · SNAP E&T · IMPACT',
  'WIOA FUNDED TRAINING',
  'DOL REGISTERED APPRENTICESHIP',
  'INDIANA ETPL APPROVED',
  'CNA CERTIFICATION',
  'CDL CLASS A',
  'HVAC · WELDING · ELECTRICAL',
  'BARBER APPRENTICESHIP',
  'EARN WHILE YOU LEARN',
  "APPLY NOW — IT'S FREE",
  '$0 FOR ELIGIBLE PARTICIPANTS',
  'INDIANAPOLIS, INDIANA',
];

// Stable doubled array — defined outside component so it never changes between
// server and client renders, eliminating the hydration key mismatch.
const ROW = ITEMS.concat(ITEMS);

export default function MarqueeBanner() {
  return (
    <div
      className="bg-slate-900 border-y border-slate-800 py-3.5 overflow-hidden select-none"
      aria-hidden="true"
      // Browser extensions (ad blockers, Grammarly, etc.) inject <style> tags
      // into the DOM before React hydrates, causing a server/client mismatch.
      // suppressHydrationWarning tells React to skip the diff for this subtree.
      suppressHydrationWarning
    >
      <div
        className="flex whitespace-nowrap"
        style={{ animation: 'elevate-marquee 40s linear infinite' }}
      >
        {ROW.map((item, i) => (
          <span key={`${item}-${i}`} className="inline-flex items-center">
            <span className="text-sm font-black tracking-widest text-white uppercase">{item}</span>
            <span className="mx-5 text-white/30 font-black">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}
