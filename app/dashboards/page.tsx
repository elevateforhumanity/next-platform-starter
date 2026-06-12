import { Metadata } from 'next';
import Link from 'next/link';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Briefcase,
  Building2,
  DollarSign,
  Shield,
  BookOpen,
  UserCheck,
  Zap,
  ArrowRight,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Portals & Dashboards',
  description: 'Sign in to access student, employer, LMS, and staff portals.',
  robots: { index: false, follow: false },
};

type PortalLink = {
  name: string;
  description: string;
  href: string;
  icon: typeof GraduationCap;
  color: string;
  /** Marketing pages anyone can browse without signing in */
  marketing?: boolean;
};

const portals: PortalLink[] = [
  {
    name: 'Student Portal',
    description: 'Track your enrollment, courses, and progress',
    href: '/login?redirect=/learner/dashboard',
    icon: GraduationCap,
    color: 'bg-blue-500',
  },
  {
    name: 'LMS Dashboard',
    description: 'Access your courses and learning materials',
    href: '/login?redirect=/lms/courses',
    icon: BookOpen,
    color: 'bg-indigo-500',
  },
  {
    name: 'Employer Portal',
    description: 'Post jobs, hire graduates, access WOTC credits',
    href: '/login?redirect=/employer/dashboard',
    icon: Building2,
    color: 'bg-brand-green-500',
  },
  {
    name: 'Partner Portal',
    description: 'Track referrals and partnership metrics',
    href: '/login?redirect=/partner/dashboard',
    icon: Briefcase,
    color: 'bg-purple-500',
  },
  {
    name: 'Staff Portal',
    description: 'Manage students, attendance, and reports',
    href: '/login?redirect=/admin/staff-portal/dashboard',
    icon: Users,
    color: 'bg-orange-500',
  },
  {
    name: 'Admin Portal',
    description: 'Full platform administration',
    href: '/login?redirect=/admin/dashboard',
    icon: Shield,
    color: 'bg-red-500',
  },
  {
    name: 'VITA Tax Services',
    description: 'Free tax preparation for eligible individuals',
    href: '/community-services',
    icon: DollarSign,
    color: 'bg-emerald-500',
    marketing: true,
  },
  {
    name: 'Tax Filing Services',
    description: 'Paid tax services and refund advances',
    href: '/community-services',
    icon: Zap,
    color: 'bg-yellow-500',
    marketing: true,
  },
  {
    name: 'Career Services',
    description: 'Job search, resume help, interview prep',
    href: '/career-services',
    icon: UserCheck,
    color: 'bg-teal-500',
    marketing: true,
  },
  {
    name: 'Training Programs',
    description: 'Browse all available training programs',
    href: '/programs',
    icon: LayoutDashboard,
    color: 'bg-cyan-500',
    marketing: true,
  },
];

export const dynamic = 'force-dynamic';


export default function PortalsPage() {
  return <PortalsDirectory />;
}

function PortalsDirectory() {
  const signInPortals = portals.filter((p) => !p.marketing);
  const marketingPortals = portals.filter((p) => p.marketing);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 py-16">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Portals & Dashboards</h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Sign in to access {PLATFORM_DEFAULTS.orgName} training portals and role dashboards
          </p>
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Sign in required</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {signInPortals.map((portal) => (
              <Link
                key={portal.href}
                href={portal.href}
                className="bg-white rounded-xl p-6 hover:shadow-xl transition-all hover:-translate-y-1 group"
              >
                <div
                  className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 ${portal.color}`}
                >
                  <portal.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="font-bold text-xl text-slate-900 group-hover:text-blue-600 transition mb-2">
                  {portal.name}
                </h3>
                <p className="text-slate-600 mb-4">{portal.description}</p>
                <span className="inline-flex items-center text-blue-600 font-medium">
                  Sign in <ArrowRight className="w-4 h-4 ml-1" />
                </span>
              </Link>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-white mb-6">Public resources</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {marketingPortals.map((portal) => (
              <Link
                key={portal.name}
                href={portal.href}
                className="bg-white/10 backdrop-blur rounded-xl p-6 hover:bg-white/20 transition group border border-white/20"
              >
                <div
                  className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${portal.color}`}
                >
                  <portal.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-lg text-white group-hover:text-blue-300 transition">
                  {portal.name}
                </h3>
                <p className="text-slate-400 text-sm mt-2">{portal.description}</p>
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-12 bg-blue-600 rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Need Help Getting Started?</h2>
          <p className="text-blue-100 mb-6">
            Not sure which portal you need? Contact us or apply for a program to get started.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/apply"
              className="px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition"
            >
              Apply for Training
            </Link>
            <Link
              href="/contact"
              className="px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-400 transition"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
