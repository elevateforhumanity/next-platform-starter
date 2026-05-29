// Server Component - NO 'use client'
// Static desktop navigation links

import Link from 'next/link';

interface SubItem {
  name: string;
  href: string;
  isHeader?: boolean;
  isSectionLink?: boolean;
  nested?: boolean;
}

interface NavItem {
  name: string;
  href?: string;
  subItems?: SubItem[];
}

interface HeaderDesktopNavProps {
  items: NavItem[];
}

export default function HeaderDesktopNav({ items }: HeaderDesktopNavProps) {
  return (
    <nav className="hidden lg:flex items-center gap-0.5 xl:gap-1 2xl:gap-2" aria-label="Main navigation">
      {items.map((item) => (
        <div key={item.name} className="relative group">
          {item.subItems && item.subItems.length > 0 ? (
            item.href ? (
              <Link
                href={item.href}
                prefetch={false}
                className="text-slate-700 hover:text-brand-blue-600 font-medium text-[13px] transition-colors px-2.5 py-1.5 rounded-md hover:bg-slate-50"
                aria-haspopup="true"
              >
                {item.name}
              </Link>
            ) : (
              <button
                type="button"
                className="text-slate-700 hover:text-brand-blue-600 font-medium text-[13px] transition-colors px-2.5 py-1.5 rounded-md hover:bg-slate-50 cursor-default"
                aria-haspopup="true"
              >
                {item.name}
              </button>
            )
          ) : item.href ? (
            <Link
              href={item.href}
              prefetch={false}
              className="text-slate-700 hover:text-brand-blue-600 font-medium text-[13px] transition-colors px-2.5 py-1.5 rounded-md hover:bg-slate-50"
            >
              {item.name}
            </Link>
          ) : (
            <span className="text-slate-700 font-medium text-[13px] px-2.5 py-1.5">{item.name}</span>
          )}

          {/* Dropdown — horizontal mega-menu layout */}
          {item.subItems && item.subItems.length > 0 && (
            <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus-within:opacity-100 group-focus-within:visible transition-all duration-200 z-50">
              <div className="bg-white rounded-xl shadow-xl border border-slate-200 p-4">
                {/* Group sub-items by section headers into columns */}
                {(() => {
                  // Split into columns at each isHeader boundary
                  const columns: typeof item.subItems[] = [];
                  let current: typeof item.subItems = [];
                  for (const sub of item.subItems) {
                    if (sub.isHeader && current.length > 0) {
                      columns.push(current);
                      current = [sub];
                    } else {
                      current.push(sub);
                    }
                  }
                  if (current.length > 0) columns.push(current);

                  // Single column (no headers) — compact vertical list
                  const isExternal = (href: string) => href.startsWith('https://app.');
                  if (columns.length <= 1) {
                    return (
                      <div className="flex flex-col min-w-[180px]">
                        {item.subItems.map((sub) =>
                          sub.isHeader ? (
                            <p key={sub.name} className="text-xs font-extrabold text-brand-red-600 uppercase tracking-wide px-2 pt-3 pb-1 first:pt-0">
                              {sub.name.replace(/—/g, '').trim()}
                            </p>
                          ) : (
                            <Link key={sub.href + sub.name} href={sub.href} prefetch={false}
                              {...(isExternal(sub.href) ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                              className="text-sm text-slate-700 hover:text-brand-blue-600 hover:bg-slate-50 rounded-lg px-2 py-1.5 transition-colors whitespace-nowrap">
                              {sub.name}
                            </Link>
                          )
                        )}
                      </div>
                    );
                  }

                  // Multi-column horizontal layout
                  return (
                    <div className="flex gap-6 divide-x divide-slate-100">
                      {columns.map((col, ci) => (
                        <div key={ci} className={`flex flex-col min-w-[160px] ${ci > 0 ? 'pl-6' : ''}`}>
                          {col.map((sub) =>
                            sub.isHeader ? (
                              <p key={sub.name} className="text-xs font-extrabold text-brand-red-600 uppercase tracking-wide px-1 pb-2">
                                {sub.name.replace(/—/g, '').trim()}
                              </p>
                            ) : sub.isSectionLink ? (
                              <Link key={sub.href + sub.name} href={sub.href} prefetch={false}
                                {...(isExternal(sub.href) ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                                className="text-xs font-bold text-brand-red-600 hover:text-brand-red-700 px-1 py-1 mt-1 transition-colors whitespace-nowrap">
                                {sub.name}
                              </Link>
                            ) : (
                              <Link key={sub.href + sub.name} href={sub.href} prefetch={false}
                                {...(isExternal(sub.href) ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                                className="text-sm text-slate-700 hover:text-brand-blue-600 hover:bg-slate-50 rounded-lg px-1 py-1.5 transition-colors whitespace-nowrap">
                                {sub.name}
                              </Link>
                            )
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      ))}
    </nav>
  );
}
