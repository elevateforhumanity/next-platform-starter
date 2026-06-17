'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, Search, Menu, ChevronDown, LogOut, Settings, User, ExternalLink } from 'lucide-react';
import type { UserRole, NavSection, BreadcrumbItem, ActionItem } from '@/lib/navigation/navigation-config';
import { getNavigationForRole, generateBreadcrumbs, ROLE_DISPLAY_NAMES } from '@/lib/navigation/navigation-config';

interface PlatformShellProps {
  user: {
    id: string;
    email: string;
    full_name?: string;
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
  };
  role: UserRole;
  breadcrumbs?: BreadcrumbItem[];
  actions?: ActionItem[];
  notifications?: number;
  children: React.ReactNode;
}

function isActiveHref(href: string, pathname: string): boolean {
  return pathname === href || pathname.startsWith(href + '/');
}

export function PlatformShell({
  user,
  role,
  breadcrumbs,
  actions = [],
  notifications = 0,
  children,
}: PlatformShellProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const sections = getNavigationForRole(role);
  const autoBreadcrumbs = breadcrumbs || generateBreadcrumbs(pathname);

  const userInitials = user.first_name && user.last_name
    ? `${user.first_name[0]}${user.last_name[0]}`
    : user.full_name
      ? user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)
      : 'U';

  const userName = user.full_name || (user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : 'User');

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="flex items-center justify-between h-16 px-4 lg:px-6">
          {/* Left: Logo + Menu */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
              aria-label="Toggle menu"
            >
              {sidebarOpen ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-brand-red-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">E</span>
              </div>
              <span className="font-bold text-slate-900 hidden md:block">{ROLE_DISPLAY_NAMES[role]}</span>
            </Link>
          </div>

          {/* Center: Search */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="search"
                placeholder="Search..."
                className="w-full pl-10 pr-4 py-2 bg-slate-100 border-0 rounded-lg text-sm focus:ring-2 focus:ring-brand-blue-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {/* Actions */}
            {actions.length > 0 && (
              <div className="hidden lg:flex items-center gap-2 mr-4">
                {actions.slice(0, 2).map((action) => (
                  action.href ? (
                    <Link
                      key={action.id}
                      href={action.href}
                      className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                        action.variant === 'primary'
                          ? 'bg-brand-blue-600 text-white hover:bg-brand-blue-700'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {action.icon && <action.icon className="w-4 h-4" />}
                      {action.label}
                    </Link>
                  ) : (
                    <button
                      key={action.id}
                      onClick={action.onClick}
                      className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                        action.variant === 'primary'
                          ? 'bg-brand-blue-600 text-white hover:bg-brand-blue-700'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {action.icon && <action.icon className="w-4 h-4" />}
                      {action.label}
                    </button>
                  )
                ))}
              </div>
            )}

            {/* Notifications */}
            <Link
              href="/notifications"
              className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5 text-slate-600" />
              {notifications > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-brand-red-600 text-white text-xs rounded-full flex items-center justify-center">
                  {notifications > 9 ? '9+' : notifications}
                </span>
              )}
            </Link>

            {/* User Menu */}
            <div className="relative group">
              <button className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-100 transition-colors">
                <div className="w-8 h-8 bg-brand-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  {userInitials}
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400 hidden lg:block" />
              </button>
              
              {/* Dropdown */}
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="font-medium text-slate-900">{userName}</p>
                  <p className="text-sm text-slate-500">{user.email}</p>
                </div>
                <Link href="/profile" className="flex items-center gap-2 px-4 py-2 hover:bg-slate-50 text-slate-700">
                  <User className="w-4 h-4" />
                  Profile
                </Link>
                <Link href="/settings" className="flex items-center gap-2 px-4 py-2 hover:bg-slate-50 text-slate-700">
                  <Settings className="w-4 h-4" />
                  Settings
                </Link>
                <hr className="my-2 border-slate-100" />
                <button className="flex items-center gap-2 px-4 py-2 hover:bg-slate-50 text-slate-700 w-full text-left">
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Breadcrumbs */}
        {autoBreadcrumbs.length > 0 && (
          <div className="px-4 py-2 border-t border-slate-100 bg-slate-50">
            <nav className="flex items-center gap-2 text-sm max-w-7xl mx-auto">
              <Link href="/" className="text-slate-500 hover:text-slate-700">Home</Link>
              {autoBreadcrumbs.map((crumb, i) => (
                <React.Fragment key={i}>
                  <span className="text-slate-300">/</span>
                  {crumb.href && i < autoBreadcrumbs.length - 1 ? (
                    <Link href={crumb.href} className="text-slate-500 hover:text-slate-700">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="text-slate-900 font-medium">{crumb.label}</span>
                  )}
                </React.Fragment>
              ))}
            </nav>
          </div>
        )}
      </header>

      <div className="flex">
        {/* Mobile Overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside className={`
          fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-white transform transition-transform duration-200 ease-in-out
          lg:translate-x-0 lg:static lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] lg:shrink-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="flex flex-col h-full">
            {/* Sidebar Header */}
            <div className="p-4 border-b border-slate-700">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {ROLE_DISPLAY_NAMES[role]}
              </h2>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-4">
              {sections.map((section) => (
                <div key={section.id} className="mb-4">
                  {section.label && (
                    <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      {section.label}
                    </div>
                  )}
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const active = isActiveHref(item.href, pathname);
                    return (
                      <Link
                        key={item.id}
                        href={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className={`
                          flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg transition-colors
                          ${active 
                            ? 'bg-brand-blue-600 text-white' 
                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'}
                        `}
                      >
                        <Icon className="w-5 h-5 shrink-0" />
                        <span className="flex-1">{item.label}</span>
                        {item.badge && (
                          <span className="px-2 py-0.5 bg-brand-red-600 text-xs rounded-full">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              ))}
            </nav>

            {/* Sidebar Footer */}
            <div className="p-4 border-t border-slate-700 space-y-1">
              <Link href="/support" className="flex items-center gap-2 text-slate-400 hover:text-white text-sm py-2">
                <Bell className="w-4 h-4" />
                Support
              </Link>
              <Link href="/help" className="flex items-center gap-2 text-slate-400 hover:text-white text-sm py-2">
                <ExternalLink className="w-4 h-4" />
                Help Center
              </Link>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          <div className="p-4 lg:p-6">
            {mounted ? children : (
              <div className="animate-pulse space-y-4">
                <div className="h-8 bg-slate-200 rounded w-1/4" />
                <div className="h-4 bg-slate-200 rounded w-1/2" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <div className="h-32 bg-slate-200 rounded" />
                  <div className="h-32 bg-slate-200 rounded" />
                  <div className="h-32 bg-slate-200 rounded" />
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

// Re-export types
export type { UserRole, NavSection, BreadcrumbItem, ActionItem } from '@/lib/navigation/navigation-config';
