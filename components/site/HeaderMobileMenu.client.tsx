'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronDown, Menu, X } from 'lucide-react';
import SearchModal from './SearchModal.client';
import LanguageSwitcher from './LanguageSwitcher.client';

interface NavItem {
  id?: string;
  name: string;
  href?: string;
  subItems?: {
    name: string;
    href: string;
    isHeader?: boolean;
    isSectionLink?: boolean;
    nested?: boolean;
  }[];
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
  const firstItemKey = items[0]?.id ?? items[0]?.name ?? null;
  const [isOpen, setIsOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(firstItemKey);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setIsOpen(false);
    setExpanded(firstItemKey);
  }, [pathname, firstItemKey]);

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
              className="fixed top-[60px] right-0 bottom-0 w-[min(100vw,22rem)] bg-white z-[9999] lg:hidden overflow-y-auto shadow-2xl"
              role="dialog"
              aria-modal="true"
              aria-label="Main menu"
            >
              <nav className="flex flex-col p-4 pb-10" aria-label="Mobile navigation">
                {items.map((item) => {
                  const key = item.id ?? item.name;
                  const hasSubItems = Boolean(item.subItems?.length);
                  const isExpanded = expanded === key;

                  return (
                    <section key={item.name} className="border-b border-slate-100 last:border-0">
                      {hasSubItems ? (
                        <button
                          type="button"
                          onClick={() => setExpanded(isExpanded ? null : key)}
                          className="flex min-h-[48px] w-full items-center justify-between gap-3 py-3 text-left text-base font-semibold text-slate-900 hover:text-brand-blue-600"
                          aria-expanded={isExpanded}
                        >
                          <span>{item.name}</span>
                          <ChevronDown
                            className={`h-5 w-5 flex-none text-slate-400 transition-transform ${
                              isExpanded ? 'rotate-180' : ''
                            }`}
                            aria-hidden="true"
                          />
                        </button>
                      ) : item.href ? (
                        <Link
                          href={item.href}
                          prefetch={false}
                          onClick={() => setIsOpen(false)}
                          className="block py-3 text-base font-semibold text-slate-900 hover:text-brand-blue-600"
                        >
                          {item.name}
                        </Link>
                      ) : (
                        <p className="py-3 text-base font-semibold text-slate-900">{item.name}</p>
                      )}

                      {hasSubItems && isExpanded ? (
                        <div className="flex flex-col pb-4 pl-3 border-l-2 border-brand-red-200">
                          {item.href ? (
                            <Link
                              href={item.href}
                              prefetch={false}
                              onClick={() => setIsOpen(false)}
                              className="block py-2 text-sm font-bold text-brand-red-600 hover:text-brand-red-700"
                            >
                              View all {item.name} →
                            </Link>
                          ) : null}
                        {item.subItems.map((subItem) => {
                          if (subItem.isHeader) {
                            return (
                              <p
                                key={subItem.name}
                                className="pt-3 pb-1 text-xs font-extrabold uppercase tracking-wide text-brand-red-600"
                              >
                                {subItem.name.replace(/—/g, '').trim()}
                              </p>
                            );
                          }

                          if (subItem.isSectionLink) {
                            return (
                              <Link
                                key={`${subItem.name}-${subItem.href}`}
                                href={subItem.href}
                                prefetch={false}
                                onClick={() => setIsOpen(false)}
                                className="block py-2 text-sm font-semibold text-brand-red-600 hover:text-brand-red-700"
                              >
                                {subItem.name}
                              </Link>
                            );
                          }

                          const programSlug =
                            item.id === 'programs' ? getProgramSlugFromHref(subItem.href) : null;
                          const applyHref = programSlug ? programApplyLinks[programSlug] : undefined;

                          return (
                            <div key={`${subItem.name}-${subItem.href}`}>
                              <Link
                                href={subItem.href}
                                prefetch={false}
                                onClick={() => setIsOpen(false)}
                                className={`block py-2.5 text-sm text-slate-700 hover:text-brand-blue-600 ${
                                  subItem.nested ? 'pl-4 text-slate-500' : ''
                                }`}
                              >
                                {subItem.name}
                              </Link>
                              {applyHref ? (
                                <Link
                                  href={applyHref}
                                  prefetch={false}
                                  onClick={() => setIsOpen(false)}
                                  className="block py-1.5 pl-4 text-xs text-brand-blue-700 hover:underline"
                                >
                                  Apply to {subItem.name}
                                </Link>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    ) : null}
                  </section>
                  );
                })}

                <div className="mt-6 flex flex-col gap-2">
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
                    href="/apply"
                    prefetch={false}
                    onClick={() => setIsOpen(false)}
                    className="block w-full text-center py-2.5 text-brand-blue-600 font-medium text-sm hover:underline"
                  >
                    Check eligibility
                  </Link>
                </div>
              </nav>
            </div>
          </>,
          document.body,
        )
      : null;

  return (
    <div className="lg:hidden flex flex-row flex-nowrap items-center justify-end gap-0.5 shrink-0">
      <SearchModal />
      <LanguageSwitcher compact={true} />
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="p-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg min-h-[40px] min-w-[40px] flex items-center justify-center"
        aria-label={isOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={isOpen}
      >
        {isOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
      </button>
      {drawer}
    </div>
  );
}
