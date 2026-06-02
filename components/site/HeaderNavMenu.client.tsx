'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Menu, X, ChevronDown } from 'lucide-react';

export interface NavSubItem {
  name: string;
  href: string;
  isHeader?: boolean;
  isSectionLink?: boolean;
  nested?: boolean;
}

export interface NavItem {
  id?: string;
  name: string;
  href?: string;
  subItems?: NavSubItem[];
}

interface HeaderNavMenuProps {
  items: NavItem[];
  programApplyLinks?: Record<string, string>;
}

function getProgramSlugFromHref(href: string): string | null {
  const match = href.match(/^\/programs\/([^/?#]+)$/);
  if (!match) return null;
  return match[1];
}

function groupSubItemsByHeader(subItems: NavSubItem[]) {
  const columns: NavSubItem[][] = [];
  let current: NavSubItem[] = [];
  for (const sub of subItems) {
    if (sub.isHeader && current.length > 0) {
      columns.push(current);
      current = [sub];
    } else {
      current.push(sub);
    }
  }
  if (current.length > 0) columns.push(current);
  return columns;
}

/** One grid cell for desktop mega-menu — every header group gets its own column. */
function flattenNavColumns(items: NavItem[]) {
  return items.flatMap((item) => {
    if (!item.subItems?.length) return [];
    const columns = groupSubItemsByHeader(item.subItems);
    if (columns.length <= 1) {
      return [{ key: item.id ?? item.name, parent: item, subItems: item.subItems, showParentTitle: true }];
    }
    return columns.map((col, ci) => ({
      key: `${item.id ?? item.name}-${ci}`,
      parent: item,
      subItems: col,
      showParentTitle: ci === 0,
    }));
  });
}

function NavLinkList({
  item,
  programApplyLinks,
  onNavigate,
  compact,
  showParentTitle = true,
}: {
  item: NavItem;
  programApplyLinks: Record<string, string>;
  onNavigate: () => void;
  compact?: boolean;
  showParentTitle?: boolean;
}) {
  if (!item.subItems?.length) {
    if (!item.href) return null;
    return (
      <Link
        href={item.href}
        prefetch={false}
        onClick={onNavigate}
        className="block py-2 text-sm font-semibold text-slate-800 hover:text-brand-blue-600"
      >
        {item.name}
      </Link>
    );
  }

  return (
    <div className={compact ? 'space-y-2' : 'space-y-2'}>
      {showParentTitle &&
        (item.href ? (
          <Link
            href={item.href}
            prefetch={false}
            onClick={onNavigate}
            className="text-sm font-bold text-brand-red-600 hover:text-brand-red-700 block mb-1"
          >
            {item.name} →
          </Link>
        ) : (
          <p className="text-sm font-bold text-slate-900 mb-1">{item.name}</p>
        ))}
      {item.subItems.map((sub) => {
        if (sub.isHeader) {
          return (
            <p
              key={sub.name}
              className="text-[11px] font-extrabold uppercase tracking-wide text-brand-red-600 pt-2 first:pt-0"
            >
              {sub.name.replace(/—/g, '').trim()}
            </p>
          );
        }
        if (sub.isSectionLink) {
          return (
            <Link
              key={sub.name}
              href={sub.href}
              prefetch={false}
              onClick={onNavigate}
              className="block text-xs font-bold text-brand-red-600 hover:text-brand-red-700 py-1"
            >
              {sub.name}
            </Link>
          );
        }
        const programSlug = item.id === 'programs' ? getProgramSlugFromHref(sub.href) : null;
        const applyHref = programSlug ? programApplyLinks[programSlug] : undefined;
        return (
          <div key={sub.name + sub.href}>
            <Link
              href={sub.href}
              prefetch={false}
              onClick={onNavigate}
              className={`block text-sm text-slate-600 hover:text-brand-blue-600 ${
                sub.nested ? 'pl-3 text-xs' : 'py-0.5'
              }`}
            >
              {sub.name}
            </Link>
            {applyHref && (
              <Link
                href={applyHref}
                prefetch={false}
                onClick={onNavigate}
                className="block pl-3 text-xs text-brand-blue-700 hover:text-brand-blue-800 py-0.5"
              >
                Apply · {sub.name}
              </Link>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function HeaderNavMenu({ items, programApplyLinks = {} }: HeaderNavMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const pathname = usePathname();
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

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
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMenu();
    };
    document.addEventListener('keydown', onEscape);
    const mq = window.matchMedia('(max-width: 767px)');
    const lockScroll = () => {
      document.body.style.overflow = mq.matches ? 'hidden' : '';
    };
    lockScroll();
    mq.addEventListener('change', lockScroll);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onEscape);
      mq.removeEventListener('change', lockScroll);
    };
  }, [isOpen, closeMenu]);

  // Close dropdown when clicking outside (tablet/desktop)
  useEffect(() => {
    if (!isOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        panelRef.current?.contains(target) ||
        menuButtonRef.current?.contains(target)
      ) {
        return;
      }
      closeMenu();
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [isOpen, closeMenu]);

  const topLevelSimple = items.filter((i) => !i.subItems?.length && i.href);
  const topLevelMega = items.filter((i) => i.subItems && i.subItems.length > 0);
  const desktopColumns = flattenNavColumns(topLevelMega);

  return (
    <div className="relative flex items-center">
      {/* Menu trigger — all breakpoints; horizontal bar context on md+ */}
      <button
        ref={menuButtonRef}
        type="button"
        onClick={() => (isOpen ? closeMenu() : setIsOpen(true))}
        className="flex items-center gap-1.5 text-slate-700 hover:text-slate-900 min-h-[44px] min-w-[44px] px-2 md:px-3 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-colors"
        aria-label={isOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={isOpen}
        aria-controls="site-nav-menu"
        aria-haspopup="true"
      >
        {isOpen ? (
          <X className="w-5 h-5 shrink-0" aria-hidden />
        ) : (
          <Menu className="w-5 h-5 shrink-0" aria-hidden />
        )}
        <span className="hidden md:inline text-[13px] font-semibold">Menu</span>
      </button>

      {/* Backdrop — mobile only */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 top-[60px] bg-black/50 z-[9998]"
          onClick={closeMenu}
          aria-hidden
        />
      )}

      {/* ── Tablet / desktop / iPad: full-width mega-menu below header ── */}
      {isOpen && (
        <>
          <div
            className="hidden md:block fixed inset-0 top-[60px] z-[9998] bg-black/20"
            onClick={closeMenu}
            aria-hidden
          />
          <div
            id="site-nav-menu"
            ref={panelRef}
            className="hidden md:block fixed left-0 right-0 top-[60px] z-[10000] bg-white border-b border-slate-200 shadow-2xl max-h-[calc(100vh-60px)] overflow-y-auto overscroll-contain"
            role="dialog"
            aria-modal="true"
            aria-label="Site menu"
          >
            <div className="max-w-screen-2xl mx-auto px-4 lg:px-8 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-bold text-slate-900">All pages</p>
              <nav
                className="flex flex-wrap items-center gap-1 flex-1 justify-center min-w-0"
                aria-label="Quick section links"
              >
                {topLevelMega.map((item) =>
                  item.href ? (
                    <Link
                      key={item.id ?? item.name}
                      href={item.href}
                      prefetch={false}
                      onClick={closeMenu}
                      className="text-[12px] font-semibold text-slate-600 hover:text-brand-blue-600 px-2.5 py-1.5 rounded-md hover:bg-slate-50 whitespace-nowrap"
                    >
                      {item.name}
                    </Link>
                  ) : (
                    <span
                      key={item.id ?? item.name}
                      className="text-[12px] font-semibold text-slate-500 px-2.5 py-1.5 whitespace-nowrap"
                    >
                      {item.name}
                    </span>
                  ),
                )}
              </nav>
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href="/login"
                  prefetch={false}
                  onClick={closeMenu}
                  className="text-[13px] font-semibold text-slate-600 hover:text-slate-900 px-3 py-2 rounded-lg hover:bg-slate-50"
                >
                  Sign In
                </Link>
                <Link
                  href="/for-students"
                  prefetch={false}
                  onClick={closeMenu}
                  className="text-[13px] font-semibold bg-brand-red-600 text-white px-3 py-2 rounded-lg hover:bg-brand-red-700"
                >
                  Get Started
                </Link>
              </div>
            </div>

            <div className="max-w-screen-2xl mx-auto px-4 lg:px-8 py-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-6 gap-y-8">
                {desktopColumns.map(({ key, parent, subItems, showParentTitle }) => (
                  <div key={key} className="min-w-0 break-words">
                    <NavLinkList
                      item={{ ...parent, subItems }}
                      programApplyLinks={programApplyLinks}
                      onNavigate={closeMenu}
                      showParentTitle={showParentTitle}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="max-w-screen-2xl mx-auto px-4 lg:px-8 pb-6 flex flex-wrap gap-x-6 gap-y-2 border-t border-slate-100 pt-4">
              <Link
                href="/start"
                prefetch={false}
                onClick={closeMenu}
                className="text-sm font-semibold text-brand-red-600 hover:text-brand-red-700"
              >
                Check Eligibility
              </Link>
              {topLevelSimple.map((item) => (
                <Link
                  key={item.href}
                  href={item.href!}
                  prefetch={false}
                  onClick={closeMenu}
                  className="text-sm font-semibold text-slate-700 hover:text-brand-blue-600"
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── Mobile: vertical panel + accordion dropdowns ── */}
      {isOpen && (
        <div
          id="site-nav-menu-mobile"
          className="md:hidden fixed top-[60px] left-0 right-0 bottom-0 z-[9999] bg-white overflow-y-auto shadow-2xl"
          role="dialog"
          aria-modal="true"
          aria-label="Site menu"
        >
          <nav className="flex flex-col p-4 max-w-lg mx-auto w-full" aria-label="Mobile navigation">
            {items.map((item) => (
              <div key={item.name} className="border-b border-slate-100">
                {item.subItems && item.subItems.length > 0 ? (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedItem(expandedItem === item.name ? null : item.name)
                      }
                      className="flex items-center justify-between w-full py-4 text-left text-slate-900 font-semibold min-h-[48px]"
                      aria-expanded={expandedItem === item.name}
                    >
                      <span>{item.name}</span>
                      <ChevronDown
                        className={`w-5 h-5 text-slate-400 transition-transform ${
                          expandedItem === item.name ? 'rotate-180' : ''
                        }`}
                        aria-hidden
                      />
                    </button>
                    {expandedItem === item.name && (
                      <div className="pb-4 pl-1 border-l-2 border-brand-red-200 ml-2">
                        <NavLinkList
                          item={item}
                          programApplyLinks={programApplyLinks}
                          onNavigate={closeMenu}
                          compact
                        />
                      </div>
                    )}
                  </>
                ) : item.href ? (
                  <Link
                    href={item.href}
                    prefetch={false}
                    onClick={closeMenu}
                    className="flex items-center py-4 text-slate-900 font-semibold min-h-[48px] hover:text-brand-blue-600"
                  >
                    {item.name}
                  </Link>
                ) : null}
              </div>
            ))}

            <div className="mt-6 flex flex-col gap-3">
              <Link
                href="/login"
                prefetch={false}
                onClick={closeMenu}
                className="w-full text-center py-3.5 border border-slate-200 rounded-xl font-semibold text-slate-800 min-h-[48px] flex items-center justify-center"
              >
                Sign In
              </Link>
              <Link
                href="/for-students"
                prefetch={false}
                onClick={closeMenu}
                className="w-full text-center py-3.5 bg-brand-red-600 text-white rounded-xl font-semibold min-h-[48px] flex items-center justify-center"
              >
                Get Started
              </Link>
              <Link
                href="/start"
                prefetch={false}
                onClick={closeMenu}
                className="w-full text-center py-3.5 bg-slate-900 text-white rounded-xl font-semibold min-h-[48px] flex items-center justify-center"
              >
                Check Eligibility
              </Link>
            </div>
          </nav>
        </div>
      )}
    </div>
  );
}
