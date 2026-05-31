'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import SearchModal from '@/components/site/SearchModal.client';
import LanguageSwitcher from '@/components/site/LanguageSwitcher.client';

interface NavItem {
  id?: string;
  name: string;
  href?: string;
  subItems?: { name: string; href: string; isHeader?: boolean; isSectionLink?: boolean; nested?: boolean }[];
}

interface HeaderMobileMenuProps {
  items: NavItem[];
  programApplyLinks?: Record<string, string>;
}

function getProgramSlugFromHref(href: string): string | null {
  const match = href.match(/^\/programs\/([^/?#]+)$/);
  if (!match) return null;
  return match[1];
}

export default function HeaderMobileMenu({ items, programApplyLinks = {} }: HeaderMobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const pathname = usePathname();

  // Close menu on any route change
  useEffect(() => {
    setIsOpen(false);
    setExpandedItem(null);
  }, [pathname]);

  // Lock body scroll when menu is open and close on Escape
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setIsOpen(false);
      };
      document.addEventListener('keydown', handleEscape);
      return () => {
        document.body.style.overflow = '';
        document.removeEventListener('keydown', handleEscape);
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [isOpen]);

  return (
    <>
      {/* Mobile/tablet icon row - hidden on desktop (lg+) */}
      <div className="lg:hidden flex items-center gap-1">
        {/* Compact CTAs visible on md screens where desktop nav isn't shown */}
        <Link
          href="/login"
          prefetch={false}
          className="hidden md:block lg:hidden text-slate-600 font-semibold text-[13px] hover:text-slate-900 px-2 py-1.5 rounded-md hover:bg-slate-50 transition-colors"
        >
          Sign In
        </Link>
        <Link
          href="/for-students"
          prefetch={false}
          className="hidden md:inline-flex lg:hidden items-center bg-brand-red-600 text-white px-3 py-1.5 rounded-lg font-semibold text-[13px] hover:bg-brand-red-700 transition-colors whitespace-nowrap"
        >
          Get Started
        </Link>
        <SearchModal />
        <LanguageSwitcher />
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-3 text-slate-700 hover:text-slate-900 min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label={isOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={isOpen}
          aria-controls="mobile-navigation-dialog"
        >
          {isOpen ? (
            <span className="text-2xl leading-none" aria-hidden="true">
              &times;
            </span>
          ) : (
            <span className="text-2xl leading-none" aria-hidden="true">
              &#9776;
            </span>
          )}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[9998] lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile Menu Panel */}
      {isOpen && (
        <div
          id="mobile-navigation-dialog"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation"
          className="fixed top-[60px] right-0 bottom-0 w-[85vw] max-w-sm bg-white z-[9999] lg:hidden overflow-y-auto shadow-2xl"
        >
          <nav className="p-4" aria-label="Mobile navigation">
            {items.map((item) => (
              <div key={item.name} className="border-b border-slate-100">
                {item.subItems ? (
                  <>
                    <button
                      onClick={() => setExpandedItem(expandedItem === item.name ? null : item.name)}
                      className="flex items-center justify-between w-full py-3 text-slate-900 font-medium"
                      aria-expanded={expandedItem === item.name}
                    >
                      {item.name}
                      <span
                        className={`text-sm leading-none transition-transform inline-block ${
                          expandedItem === item.name ? 'rotate-180' : ''
                        }`}
                        aria-hidden="true"
                      >
                        &#9660;
                      </span>
                    </button>
                    {expandedItem === item.name && (
                      <div className="pb-3 pl-4">
                        {item.subItems.map((subItem) => {
                          if (subItem.isHeader) {
                            return (
                              <div
                                key={subItem.name}
                                className="pt-3 pb-1 text-xs font-extrabold text-brand-red-600 uppercase tracking-wide border-l-3 border-brand-red-500 pl-2"
                              >
                                {subItem.name.replace(/—/g, '').trim()}
                              </div>
                            );
                          }

                          if (subItem.isSectionLink) {
                            return (
                              <Link
                                key={subItem.name}
                                href={subItem.href}
                                prefetch={false}
                                onClick={() => setIsOpen(false)}
                                className="block pt-3 pb-1 text-xs font-extrabold text-brand-red-600 uppercase tracking-wide border-t border-brand-red-100 hover:text-brand-red-700 transition-colors"
                              >
                                {subItem.name}
                              </Link>
                            );
                          }

                          const programSlug =
                            item.id === 'programs' ? getProgramSlugFromHref(subItem.href) : null;
                          const applyHref = programSlug ? programApplyLinks[programSlug] : undefined;

                          return (
                            <div key={subItem.name}>
                              <Link
                                href={subItem.href}
                                prefetch={false}
                                onClick={() => setIsOpen(false)}
                                className={`block hover:text-brand-blue-600 ${
                                  subItem.nested
                                    ? 'py-1.5 pl-4 text-xs text-slate-400 border-l border-slate-200'
                                    : 'py-3 text-slate-600'
                                }`}
                              >
                                {subItem.name}
                              </Link>
                              {applyHref && (
                                <Link
                                  href={applyHref}
                                  prefetch={false}
                                  onClick={() => setIsOpen(false)}
                                  className="block py-1.5 pl-6 text-xs text-brand-blue-700 hover:text-brand-blue-800 border-l border-slate-200"
                                >
                                  Apply to {subItem.name}
                                </Link>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                ) : item.href ? (
                  <Link
                    href={item.href}
                    prefetch={false}
                    onClick={() => setIsOpen(false)}
                    className="block py-3 text-slate-900 font-medium hover:text-brand-blue-600"
                  >
                    {item.name}
                  </Link>
                ) : (
                  <span className="block py-3 text-slate-900 font-medium">{item.name}</span>
                )}
              </div>
            ))}

            {/* Mobile CTAs */}
            <div className="mt-6 space-y-3">
              <Link
                href="/start"
                prefetch={false}
                onClick={() => setIsOpen(false)}
                className="block w-full text-center py-3 bg-brand-red-600 text-white rounded-lg font-semibold"
              >
                Check Eligibility
              </Link>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
