'use client';

import { ReactNode, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Building2,
  Home,
  Users,
  Clock,
  CheckCircle,
  Calendar,
  BarChart3,
  MessageSquare,
  FileText,
  ClipboardCheck,
  DollarSign,
  Settings,
  ShoppingBag,
  Shield,
  ChevronRight,
  Bell,
  Search,
  Menu,
  X,
  ExternalLink,
  GraduationCap,
  LayoutDashboard,
} from 'lucide-react';

interface HostShop {
  id: string;
  business_name: string;
  logo_url?: string;
}

interface Subscription {
  plan_name: string;
  tier: string;
  status: string;
  current_period_end: string;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', href: '/host-shop/dashboard', icon: Home },
  { id: 'apprentices', label: 'Apprentices', href: '/host-shop/dashboard/apprentices', icon: Users },
  { id: 'hours', label: 'Hours', href: '/host-shop/dashboard/hours', icon: Clock },
  { id: 'competencies', label: 'Sign-Offs', href: '/host-shop/dashboard/competencies', icon: CheckCircle },
  { id: 'evaluations', label: 'Evaluations', href: '/host-shop/dashboard/evaluations', icon: ClipboardCheck },
  { id: 'schedule', label: 'Schedule', href: '/host-shop/dashboard/schedule', icon: Calendar },
  { id: 'reports', label: 'Reports', href: '/host-shop/dashboard/reports', icon: BarChart3 },
];

const secondaryNav = [
  { id: 'messages', label: 'Messages', href: '/host-shop/dashboard/messages', icon: MessageSquare },
  { id: 'documents', label: 'Documents', href: '/host-shop/dashboard/documents', icon: FileText },
  { id: 'billing', label: 'Billing', href: '/host-shop/dashboard/subscription', icon: DollarSign },
  { id: 'store', label: 'Store', href: '/host-shop/dashboard/store', icon: ShoppingBag },
  { id: 'settings', label: 'Profile', href: '/host-shop/dashboard/profile', icon: Settings },
];

// Demo data - in production this would come from server
const demoHostShop: HostShop = {
  id: '1',
  business_name: 'Elevate Barbershop',
};

const demoSubscription: Subscription = {
  plan_name: 'Professional Host Shop',
  tier: 'professional',
  status: 'active',
  current_period_end: '2026-07-16',
};

export default function HostShopDashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/host-shop/dashboard" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-brand-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div className="hidden sm:block">
                <p className="font-bold text-slate-900 leading-none">{demoHostShop.business_name}</p>
                <p className="text-xs text-slate-500">Host Shop Portal</p>
              </div>
            </Link>

            {/* Portal Navigation */}
            <div className="hidden lg:flex items-center gap-1 ml-6 pl-6 border-l border-slate-200">
              <Link
                href="/host-shop/dashboard"
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  pathname?.startsWith('/host-shop') 
                    ? 'bg-brand-blue-100 text-brand-blue-700' 
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Building2 className="w-4 h-4" />
                Host Shop
              </Link>
              <Link
                href="/apprentice"
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition"
              >
                <GraduationCap className="w-4 h-4" />
                Apprentice
              </Link>
              <Link
                href="/admin"
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition"
              >
                <LayoutDashboard className="w-4 h-4" />
                Admin
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>

            {/* Search */}
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="Search apprentices, hours, tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-100 rounded-xl border-0 focus:ring-2 focus:ring-brand-blue-500 text-sm"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-3">
              {/* Subscription Badge */}
              <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg">
                <span className="flex items-center gap-1.5 text-xs">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span className="font-medium text-slate-700">{demoSubscription.plan_name}</span>
                </span>
              </div>

              <button className="relative p-2 rounded-xl hover:bg-slate-100 transition">
                <Bell className="w-5 h-5 text-slate-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-xl hover:bg-slate-100 transition"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Desktop Nav */}
        <div className="hidden lg:block border-t border-slate-100">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
            <nav className="flex items-center gap-1 py-2 overflow-x-auto">
              {navItems.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition ${
                    isActive(item.href)
                      ? 'bg-brand-blue-50 text-brand-blue-700'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              ))}
              {secondaryNav.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition ${
                    isActive(item.href)
                      ? 'bg-brand-blue-50 text-brand-blue-700'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* Mobile Nav Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* Mobile Nav Drawer */}
      <div className={`lg:hidden fixed inset-y-0 left-0 z-50 w-80 max-w-full bg-white shadow-2xl transform transition-transform ${
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-blue-100 rounded-xl flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-brand-blue-600" />
                </div>
                <div>
                  <p className="font-bold text-slate-900">{demoHostShop.business_name}</p>
                  <p className="text-xs text-slate-500">{demoSubscription.plan_name}</p>
                </div>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {/* Portal Switcher */}
            <div className="px-3 mb-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Portal</p>
              <div className="flex gap-2">
                <Link
                  href="/host-shop/dashboard"
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-brand-blue-100 text-brand-blue-700 rounded-xl text-sm font-medium"
                >
                  <Building2 className="w-4 h-4" />
                  Host Shop
                </Link>
                <Link
                  href="/apprentice"
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-100 text-slate-600 rounded-xl text-sm font-medium"
                >
                  <GraduationCap className="w-4 h-4" />
                  Apprentice
                </Link>
              </div>
            </div>

            <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Main</p>
            {navItems.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                  isActive(item.href)
                    ? 'bg-brand-blue-50 text-brand-blue-700'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            ))}

            <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 mt-6">Management</p>
            {secondaryNav.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                  isActive(item.href)
                    ? 'bg-brand-blue-50 text-brand-blue-700'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Subscription Status */}
          <div className="p-4 border-t border-slate-200">
            <Link
              href="/host-shop/dashboard/subscription"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl"
            >
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                <Shield className="w-5 h-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-900">{demoSubscription.plan_name}</p>
                <p className="text-xs text-slate-500">Active</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6">
        {children}
      </main>

      {/* Floating Help */}
      <div className="fixed bottom-6 right-6 z-40">
        <button className="bg-brand-blue-600 hover:bg-brand-blue-700 text-white w-14 h-14 rounded-full shadow-lg shadow-brand-blue-500/30 flex items-center justify-center transition-all hover:scale-110">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
