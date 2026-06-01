'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import LanguageSwitcher from './LanguageSwitcher.client';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import SearchModal from './SearchModal.client';

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
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setIsOpen(false);
    setExpandedItem(null);
  }, [pathname]);

  useEffect(() => {
    if (!isOpen) {
      document.body.style.overflow = '';
      return;
    }
    document.body.style.overflow = 'hidden';
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const drawer =
    mounted && isOpen
      ? createPortal(
          <>
            <div
              className="fixed inset-0 bg-black/50 z-[9998] lg:hidden"
              onClick={() => setIsOpen(false)}
              aria-hidden="true"
            />
            <div
              className="fixed top-[60px] right-0 bottom-0 w-[min(100vw,20rem)] bg-white z-[9999] lg:hidden overflow-y-auto shadow-2xl"
              role="dialog"
              aria-modal="true"
              aria-label="Main menu"
            >
              <nav className="p-4" aria-label="Mobile navigation">
                {items.map((item) => (
                  <div key={item.name} className="border-b border-slate-100">
                    {item.subItems ? (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedItem(expandedItem === item.name ? null : item.name)
                          }
                          className="flex items-center justify-between w-full py-3 text-slate-900 font-medium text-left"
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
                                item.id === 'programs'
                                  ? getProgramSlugFromHref(subItem.href)
                                  : null;
                              const applyHref = programSlug
                                ? programApplyLinks[programSlug]
                                : undefined;

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

                <div className="mt-6 space-y-2">
                  <Link
                    href="/for-students"
                    prefetch={false}
                    onClick={() => setIsOpen(false)}
                    className="block w-full text-center py-3 bg-brand-red-600 text-white rounded-lg font-semibold"
                  >
                    Get Started
                  </Link>
                  <Link
                    href="/login"
                    prefetch={false}
                    onClick={() => setIsOpen(false)}
                    className="block w-full text-center py-3 border border-slate-300 text-slate-800 rounded-lg font-semibold hover:bg-slate-50"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/start"
                    prefetch={false}
                    onClick={() => setIsOpen(false)}
                    className="block w-full text-center py-2.5 text-brand-blue-600 font-medium text-sm hover:underline"
                  >
                    Check Eligibility
                  </Link>
                </div>
              </nav>
            </div>
          </>,
          document.body,
        )
      : null;

  return (
    <div className="lg:hidden flex flex-row flex-nowrap items-center gap-0.5 sm:gap-1">
      <SearchModal />
      <LanguageSwitcher compact />
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="p-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg min-h-[40px] min-w-[40px] flex items-center justify-center"
        aria-label={isOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={isOpen}
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
      {drawer}
    </div>
  );
}
