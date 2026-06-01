'use client';

/**
 * Search + language — single mount for marketing header (all breakpoints).
 * Avoids duplicating controls in desktop CTAs and mobile menu rows.
 */
import SearchModal from './SearchModal.client';
import LanguageSwitcher from './LanguageSwitcher.client';

export default function HeaderUtilities() {
  return (
    <div className="flex items-center gap-0.5 shrink-0">
      <SearchModal />
      <LanguageSwitcher />
    </div>
  );
}
