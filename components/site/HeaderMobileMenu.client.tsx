'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

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
  const [isOpen, setIsOpen] = useState(false);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const pathname = usePathname();
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const menuPanelRef = useRef<HTMLDivElement>(null);

  const closeMenu = useCallback(() => {
    setIsOpen(false);
    setExpandedItem(null);
    requestAnimationFrame(() => menuButtonRef.current?.focus());
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
      if (e.key === 'Escape') closeMenu();
    };

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !menuPanelRef.current) return;
      const focusables = menuPanelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled])',
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('keydown', handleTab);

    const first = menuPanelRef.current?.querySelector<HTMLElement>('a[href], button:not([disabled])');
    first?.focus();

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('keydown', handleTab);
    };
  }, [isOpen, closeMenu]);

  return (
    <>
      <div className="lg:hidden flex items-center gap-1 shrink-0">
        <Link
          href="/login"
          prefetch={false}
          className="hidden md:block lg:hidden text-slate-600 font-semibold text-[13px] hover:text-slate-900 px-2 py-1.5 rounded-md hover:bg-slate-50 transition-colors min-h-[44px] inline-flex items-center"
        >
          Sign In
        </Link>
        <Link
          href="/for-students"
          prefetch={false}
          className="hidden md:inline-flex lg:hidden items-center bg-brand-red-600 text-white px-3 py-1.5 rounded-lg font-semibold text-[13px] hover:bg-brand-red-700 transition-colors whitespace-nowrap min-h-[44px]"
        >
          Get Started
        </Link>
        <button
          ref={menuButtonRef}
          type="button"
          onClick={() => (isOpen ? closeMenu() : setIsOpen(true))}
          className="p-3 text-slate-700 hover:text-slate-900 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-md hover:bg-slate-50"
          aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={isOpen}
          aria-controls="mobile-menu"
          aria-haspopup="dialog"
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

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[9998] lg:hidden"
          onClick={closeMenu}
          aria-hidden="true"
        />
      )}

      <div
        id="mobile-menu"
        ref={menuPanelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        aria-hidden={!isOpen}
        className="fixed top-[60px] right-0 bottom-0 w-[85vw] max-w-sm bg-white z-[9999] lg:hidden transform transition-transform duration-300 overflow-y-auto shadow-2xl motion-reduce:transition-none"
        style={{ transform: isOpen ? 'translateX(0)' : 'translateX(100%)' }}
      >
        <nav className="p-4" aria-label="Mobile navigation">
          <div role="menu">
            {items.map((item) => (
              <div key={item.name} className="border-b border-slate-100" role="none">
                {item.subItems ? (
                  <>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => setExpandedItem(expandedItem === item.name ? null : item.name)}
                      className="flex items-center justify-between w-full py-3 text-slate-900 font-medium min-h-[44px]"
                      aria-expanded={expandedItem === item.name}
                      aria-controls={`mobile-submenu-${item.id ?? item.name.replace(/\s+/g, '-').toLowerCase()}`}
                    >
                      {item.name}
                      <span
                        className={`text-sm leading-none transition-transform inline-block motion-reduce:transition-none ${
                          expandedItem === item.name ? 'rotate-180' : ''
                        }`}
                        aria-hidden="true"
                      >
                        &#9660;
                      </span>
                    </button>
                    {expandedItem === item.name && (
                      <div
                        id={`mobile-submenu-${item.id ?? item.name.replace(/\s+/g, '-').toLowerCase()}`}
                        className="pb-3 pl-4"
                      >
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
                                role="menuitem"
                                onClick={closeMenu}
                                className="block pt-3 pb-1 text-xs font-extrabold text-brand-red-600 uppercase tracking-wide border-t border-brand-red-100 hover:text-brand-red-700 transition-colors min-h-[44px] flex items-center"
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
                                role="menuitem"
                                onClick={closeMenu}
                                className={`block hover:text-brand-blue-600 min-h-[44px] flex items-center ${
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
                                  role="menuitem"
                                  onClick={closeMenu}
                                  className="block py-1.5 pl-6 text-xs text-brand-blue-700 hover:text-brand-blue-800 border-l border-slate-200 min-h-[44px] flex items-center"
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
                    role="menuitem"
                    onClick={closeMenu}
                    className="block py-3 text-slate-900 font-medium hover:text-brand-blue-600 min-h-[44px] flex items-center"
                  >
                    {item.name}
                  </Link>
                ) : (
                  <span className="block py-3 text-slate-900 font-medium">{item.name}</span>
                )}
              </div>
            ))}
          </div>

          <div className="mt-6 space-y-3 md:hidden">
            <Link
              href="/login"
              prefetch={false}
              onClick={closeMenu}
              className="block w-full text-center py-3 border border-slate-200 text-slate-800 rounded-lg font-semibold min-h-[44px] flex items-center justify-center"
            >
              Sign In
            </Link>
            <Link
              href="/for-students"
              prefetch={false}
              onClick={closeMenu}
              className="block w-full text-center py-3 bg-brand-red-600 text-white rounded-lg font-semibold min-h-[44px] flex items-center justify-center"
            >
              Get Started
            </Link>
          </div>

          <div className="mt-6 space-y-3">
            <Link
              href="/start"
              prefetch={false}
              onClick={closeMenu}
              className="block w-full text-center py-3 bg-brand-red-600 text-white rounded-lg font-semibold min-h-[44px] flex items-center justify-center"
            >
              Check Eligibility
            </Link>
          </div>
        </nav>
      </div>
    </>
  );
}
